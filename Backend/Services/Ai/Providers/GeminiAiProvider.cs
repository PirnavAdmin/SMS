using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Services.Ai.Providers
{
    public class GeminiAiProvider : IAiProvider
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<GeminiAiProvider> _logger;

        public GeminiAiProvider(IConfiguration config, IHttpClientFactory httpClientFactory, ILogger<GeminiAiProvider> logger)
        {
            _config = config;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public string ProviderName => "GoogleGemini";

        public bool IsConfigured
        {
            get
            {
                var key = GetApiKey();
                return !string.IsNullOrWhiteSpace(key);
            }
        }

        private string? GetApiKey()
        {
            return _config["AiSettings:GeminiApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        }

        private List<string> GetCandidateModels()
        {
            var configuredModel = _config["AiSettings:GeminiModel"] ?? "gemini-flash-lite-latest";
            return new List<string> { configuredModel, "gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-2.5-flash-lite" }
                .Distinct()
                .ToList();
        }

        private string BuildSystemInstruction(AiToolContext context)
        {
            return $"You are the official School ERP AI Assistant for an enterprise school management system. " +
                   $"Authenticated User: Name='{context.UserName}', Role='{context.UserRole}'. " +
                   $"Tenant / Branch: '{context.BranchName ?? "Madhapur Branch"}', Academic Year: '{context.AcademicYear ?? "2026-27"}'. " +
                   $"Instructions:\n" +
                   $"- Always answer user questions using verified ERP tools and live database metrics.\n" +
                   $"- When asked for overall student strength, total students, enrollment counts, or grade distribution, call 'student_get_overview'.\n" +
                   $"- When asked for absent students or attendance percentages, call the appropriate attendance tool.\n" +
                   $"- When asked for fee collections, defaulters, or financial comparisons, call the fee tools.\n" +
                   $"- Never fabricate numbers or simulate database records.\n" +
                   $"- Provide clear, concise, professional responses formatted in GitHub-flavored Markdown with bold key numbers and bullet points.";
        }

        public async Task<AiCompletionResult> GenerateChatResponseAsync(AiChatContext context, IEnumerable<IAiTool> availableTools)
        {
            var key = GetApiKey();
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException("Gemini API key is not configured.");
            }

            var candidateModels = GetCandidateModels();
            var systemInstruction = BuildSystemInstruction(context.ToolContext);

            var contents = new List<object>();

            // Include conversation history for context
            foreach (var h in context.History.TakeLast(6))
            {
                contents.Add(new
                {
                    role = h.Sender == "assistant" ? "model" : "user",
                    parts = new[] { new { text = h.Content } }
                });
            }

            // Latest user message
            contents.Add(new
            {
                role = "user",
                parts = new[] { new { text = context.LatestUserMessage } }
            });

            var functionDeclarations = availableTools.Select(t =>
            {
                using var doc = JsonDocument.Parse(t.ParametersJsonSchema);
                return new
                {
                    name = t.Name,
                    description = t.Description,
                    parameters = doc.RootElement.Clone()
                };
            }).ToList();

            var requestBody = new
            {
                system_instruction = new { parts = new[] { new { text = systemInstruction } } },
                contents = contents,
                tools = new[] { new { function_declarations = functionDeclarations } }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(25);

            HttpResponseMessage? response = null;
            string? lastError = null;

            foreach (var model in candidateModels)
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}";
                try
                {
                    response = await client.PostAsync(url, jsonContent);
                    if (response.IsSuccessStatusCode)
                    {
                        break;
                    }
                    lastError = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning($"[GeminiAiProvider] Model '{model}' failed ({response.StatusCode}): {lastError}. Trying next candidate...");
                }
                catch (Exception ex)
                {
                    lastError = ex.Message;
                    _logger.LogWarning($"[GeminiAiProvider] Exception calling model '{model}': {ex.Message}. Trying next candidate...");
                }
            }

            if (response == null || !response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"All Gemini models failed in Turn 1. Last error: {lastError}");
            }

            var resJson = await response.Content.ReadAsStringAsync();
            using var docRes = JsonDocument.Parse(resJson);

            var completion = new AiCompletionResult();

            if (docRes.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
            {
                var first = candidates[0];
                if (first.TryGetProperty("content", out var content) && content.TryGetProperty("parts", out var parts))
                {
                    completion.RawModelTurn = parts.Clone();

                    foreach (var part in parts.EnumerateArray())
                    {
                        if (part.TryGetProperty("text", out var textElem))
                        {
                            completion.ReplyText += textElem.GetString();
                        }
                        if (part.TryGetProperty("functionCall", out var fnCall))
                        {
                            var fnName = fnCall.GetProperty("name").GetString() ?? "";
                            var args = fnCall.GetProperty("args").Clone();
                            completion.ToolCallsRequested.Add(new AiToolCallRequest
                            {
                                ToolName = fnName,
                                Arguments = args
                            });
                        }
                    }
                }
            }

            return completion;
        }

        public async Task<string?> SynthesizeToolResponsesAsync(
            AiChatContext context,
            object rawModelParts,
            List<(string ToolName, string Summary, object? Data)> toolOutputs,
            IEnumerable<IAiTool> availableTools)
        {
            var key = GetApiKey();
            if (string.IsNullOrWhiteSpace(key) || toolOutputs == null || toolOutputs.Count == 0)
            {
                return null;
            }

            var candidateModels = GetCandidateModels();
            var systemInstruction = BuildSystemInstruction(context.ToolContext);

            var contents = new List<object>();

            // 1. History
            foreach (var h in context.History.TakeLast(6))
            {
                contents.Add(new
                {
                    role = h.Sender == "assistant" ? "model" : "user",
                    parts = new[] { new { text = h.Content } }
                });
            }

            // 2. Latest User Query
            contents.Add(new
            {
                role = "user",
                parts = new[] { new { text = context.LatestUserMessage } }
            });

            // 3. Model Tool Call Turn (Must retain exact parts and thought signatures)
            contents.Add(new
            {
                role = "model",
                parts = rawModelParts
            });

            // 4. Function Responses Turn
            var funcResponseParts = toolOutputs.Select(to => new
            {
                functionResponse = new
                {
                    name = to.ToolName,
                    response = new
                    {
                        output = to.Summary,
                        data = to.Data
                    }
                }
            }).ToArray();

            contents.Add(new
            {
                role = "user",
                parts = funcResponseParts
            });

            var requestBody = new
            {
                system_instruction = new { parts = new[] { new { text = systemInstruction } } },
                contents = contents
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(25);

            foreach (var model in candidateModels)
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}";
                try
                {
                    var response = await client.PostAsync(url, jsonContent);
                    if (response.IsSuccessStatusCode)
                    {
                        var resJson = await response.Content.ReadAsStringAsync();
                        using var docRes = JsonDocument.Parse(resJson);
                        if (docRes.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                        {
                            var first = candidates[0];
                            if (first.TryGetProperty("content", out var content) && content.TryGetProperty("parts", out var parts))
                            {
                                var sb = new StringBuilder();
                                foreach (var part in parts.EnumerateArray())
                                {
                                    if (part.TryGetProperty("text", out var textElem))
                                    {
                                        sb.Append(textElem.GetString());
                                    }
                                }
                                var synthesized = sb.ToString().Trim();
                                if (!string.IsNullOrWhiteSpace(synthesized))
                                {
                                    return synthesized;
                                }
                            }
                        }
                    }
                    else
                    {
                        var err = await response.Content.ReadAsStringAsync();
                        _logger.LogWarning($"[GeminiAiProvider] Synthesis with model '{model}' returned {response.StatusCode}: {err}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"[GeminiAiProvider] Synthesis exception with model '{model}': {ex.Message}");
                }
            }

            return null;
        }
    }
}
