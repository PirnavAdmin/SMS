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
                var key = _config["AiSettings:GeminiApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
                return !string.IsNullOrWhiteSpace(key);
            }
        }

        public async Task<AiCompletionResult> GenerateChatResponseAsync(AiChatContext context, IEnumerable<IAiTool> availableTools)
        {
            var key = _config["AiSettings:GeminiApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException("Gemini API key is not configured.");
            }

            var model = _config["AiSettings:GeminiModel"] ?? "gemini-1.5-flash";
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}";

            var systemInstruction = $"You are the intelligent School ERP AI Assistant for an enterprise school management system. " +
                $"Current authenticated user: Name='{context.ToolContext.UserName}', Role='{context.ToolContext.UserRole}'. " +
                $"School ID: {context.ToolContext.SchoolId}, Branch ID: {context.ToolContext.BranchId}. " +
                $"Always answer using verified ERP tools and data. Never fabricate metrics, student records, fee amounts, or attendance. " +
                $"Respond concisely and clearly in Markdown format.";

            var contents = new List<object>();

            // Include relevant history
            foreach (var h in context.History.TakeLast(6))
            {
                contents.Add(new
                {
                    role = h.Sender == "assistant" ? "model" : "user",
                    parts = new[] { new { text = h.Content } }
                });
            }

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

            var response = await client.PostAsync(url, jsonContent);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                _logger.LogWarning($"Gemini API error: {response.StatusCode} - {err}");
                throw new HttpRequestException($"Gemini API error ({response.StatusCode}): {err}");
            }

            var resJson = await response.Content.ReadAsStringAsync();
            using var docRes = JsonDocument.Parse(resJson);

            var completion = new AiCompletionResult();

            if (docRes.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
            {
                var first = candidates[0];
                if (first.TryGetProperty("content", out var content) && content.TryGetProperty("parts", out var parts))
                {
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
    }
}
