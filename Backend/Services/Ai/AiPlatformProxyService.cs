using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SMS.Api.Dtos.Ai;

namespace SMS.Api.Services.Ai;

public interface IAiPlatformProxyService
{
    bool IsEnabled { get; }
    bool FallbackToLegacyOnUnavailable { get; }
    Task<AiChatResponseDto> SendChatMessageAsync(ClaimsPrincipal user, AiChatRequestDto request, CancellationToken ct = default);
    Task<List<AiConversationSummaryDto>> GetUserConversationsAsync(ClaimsPrincipal user, CancellationToken ct = default);
    Task<AiConversationDetailDto?> GetConversationDetailAsync(ClaimsPrincipal user, string conversationId, CancellationToken ct = default);
    Task<AiConversationSummaryDto> CreateConversationAsync(ClaimsPrincipal user, string? title, CancellationToken ct = default);
    Task<bool> RenameConversationAsync(ClaimsPrincipal user, string conversationId, string newTitle, CancellationToken ct = default);
    Task<bool> DeleteConversationAsync(ClaimsPrincipal user, string conversationId, CancellationToken ct = default);
    Task<AiActionConfirmationResponseDto> ConfirmActionAsync(ClaimsPrincipal user, AiActionConfirmationRequestDto request, CancellationToken ct = default);
    Task<List<AiSuggestedPromptDto>> GetSuggestedPromptsAsync(ClaimsPrincipal user, CancellationToken ct = default);
    Task StreamChatAsync(ClaimsPrincipal user, AiChatRequestDto request, HttpResponse downstreamResponse, CancellationToken ct = default);
    Task<JsonElement> ProxyJsonAsync(ClaimsPrincipal user, HttpMethod method, string relativePath, object? body = null, CancellationToken ct = default);
    Task<JsonElement> UploadDocumentAsync(ClaimsPrincipal user, IFormFile file, string category, string allowedRoles, CancellationToken ct = default);
}

public sealed class AiPlatformUnavailableException : Exception
{
    public AiPlatformUnavailableException(string message, Exception? inner = null) : base(message, inner) { }
}

public sealed class AiPlatformProxyService : IAiPlatformProxyService
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AiContextTokenService _contextTokenService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiPlatformProxyService> _logger;

    public AiPlatformProxyService(
        IHttpClientFactory httpClientFactory,
        AiContextTokenService contextTokenService,
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration,
        ILogger<AiPlatformProxyService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _contextTokenService = contextTokenService;
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsEnabled =>
        _configuration.GetValue("AiPlatform:Enabled", true) &&
        !string.IsNullOrWhiteSpace(_configuration["AiPlatform:BaseUrl"]);

    public bool FallbackToLegacyOnUnavailable =>
        _configuration.GetValue("AiPlatform:FallbackToLegacy", true);

    private string BaseUrl =>
        (_configuration["AiPlatform:BaseUrl"] ?? "http://127.0.0.1:8100").TrimEnd('/');

    private HttpClient CreateClient() => _httpClientFactory.CreateClient("AiPlatform");

    private async Task<HttpRequestMessage> CreateSignedRequestAsync(
        HttpMethod method,
        string path,
        ClaimsPrincipal user,
        int? branchId = null,
        string? branchName = null,
        int? academicYearId = null,
        string? academicYear = null,
        HttpContent? content = null)
    {
        var httpReq = _httpContextAccessor.HttpContext?.Request;
        var (_, signedToken) = await _contextTokenService.BuildVerifiedContextAsync(
            user, httpReq, branchId, branchName, academicYearId, academicYear);

        var msg = new HttpRequestMessage(method, $"{BaseUrl}{path}");
        msg.Headers.TryAddWithoutValidation("X-AI-Context", signedToken);
        if (httpReq != null && httpReq.Headers.TryGetValue("X-Trace-Id", out var traceId))
        {
            msg.Headers.TryAddWithoutValidation("X-Trace-Id", traceId.ToString());
        }
        msg.Content = content;
        return msg;
    }

    private async Task<JsonElement> SendJsonAsync(
        HttpMethod method,
        string path,
        ClaimsPrincipal user,
        object? body = null,
        int? branchId = null,
        string? branchName = null,
        int? academicYearId = null,
        string? academicYear = null,
        CancellationToken ct = default)
    {
        HttpContent? content = body != null
            ? new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
            : null;

        using var req = await CreateSignedRequestAsync(method, path, user, branchId, branchName, academicYearId, academicYear, content);
        using var client = CreateClient();
        try
        {
            using var resp = await client.SendAsync(req, ct);
            var raw = await resp.Content.ReadAsStringAsync(ct);
            if ((int)resp.StatusCode >= 500 && !raw.TrimStart().StartsWith("{"))
            {
                throw new AiPlatformUnavailableException($"AI-Platform upstream error HTTP {(int)resp.StatusCode}");
            }
            if (!resp.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"AI-Platform rejected request ({(int)resp.StatusCode}): {raw}");
            }
            if (string.IsNullOrWhiteSpace(raw))
            {
                return JsonDocument.Parse("{}").RootElement;
            }
            return JsonDocument.Parse(raw).RootElement;
        }
        catch (HttpRequestException ex)
        {
            throw new AiPlatformUnavailableException("AI-Platform service is currently unreachable.", ex);
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            throw new AiPlatformUnavailableException("AI-Platform request timed out.", ex);
        }
    }

    public async Task<AiChatResponseDto> SendChatMessageAsync(ClaimsPrincipal user, AiChatRequestDto request, CancellationToken ct = default)
    {
        var payload = new
        {
            conversation_id = request.ConversationId,
            message = request.Message,
            requested_branch_id = request.BranchId,
            requested_branch_name = request.BranchName,
            requested_academic_year_id = request.AcademicYearId,
            requested_academic_year = request.AcademicYear,
            stream = false,
        };

        var root = await SendJsonAsync(
            HttpMethod.Post,
            "/api/v1/ai/chat",
            user,
            payload,
            request.BranchId,
            request.BranchName,
            request.AcademicYearId,
            request.AcademicYear,
            ct);

        return MapChatResponse(root);
    }

    public async Task StreamChatAsync(ClaimsPrincipal user, AiChatRequestDto request, HttpResponse downstreamResponse, CancellationToken ct = default)
    {
        var payload = new
        {
            conversation_id = request.ConversationId,
            message = request.Message,
            requested_branch_id = request.BranchId,
            requested_branch_name = request.BranchName,
            requested_academic_year_id = request.AcademicYearId,
            requested_academic_year = request.AcademicYear,
            stream = true,
        };
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var req = await CreateSignedRequestAsync(
            HttpMethod.Post,
            "/api/v1/ai/chat/stream",
            user,
            request.BranchId,
            request.BranchName,
            request.AcademicYearId,
            request.AcademicYear,
            content);

        using var client = CreateClient();
        using var resp = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        resp.EnsureSuccessStatusCode();

        downstreamResponse.StatusCode = 200;
        downstreamResponse.ContentType = "text/event-stream; charset=utf-8";
        downstreamResponse.Headers["Cache-Control"] = "no-cache";
        downstreamResponse.Headers["X-Accel-Buffering"] = "no";

        await using var upstreamStream = await resp.Content.ReadAsStreamAsync(ct);
        var buffer = new byte[4096];
        int bytesRead;
        while ((bytesRead = await upstreamStream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct)) > 0)
        {
            await downstreamResponse.Body.WriteAsync(buffer.AsMemory(0, bytesRead), ct);
            await downstreamResponse.Body.FlushAsync(ct);
        }
    }

    public async Task<List<AiConversationSummaryDto>> GetUserConversationsAsync(ClaimsPrincipal user, CancellationToken ct = default)
    {
        var root = await SendJsonAsync(HttpMethod.Get, "/api/v1/ai/conversations", user, ct: ct);
        var list = new List<AiConversationSummaryDto>();
        if (TryGetProp(root, "conversations", out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in arr.EnumerateArray())
            {
                list.Add(MapConversationSummary(item));
            }
        }
        return list;
    }

    public async Task<AiConversationDetailDto?> GetConversationDetailAsync(ClaimsPrincipal user, string conversationId, CancellationToken ct = default)
    {
        var root = await SendJsonAsync(HttpMethod.Get, $"/api/v1/ai/conversations/{Uri.EscapeDataString(conversationId)}", user, ct: ct);
        if (root.ValueKind != JsonValueKind.Object) return null;

        var conv = TryGetProp(root, "conversation", out var inner) ? inner : root;
        var detail = new AiConversationDetailDto
        {
            Id = GetString(conv, "id"),
            Title = GetString(conv, "title", "Conversation"),
            UserRole = GetString(conv, "user_role", "User"),
            CreatedAt = GetDate(conv, "created_at"),
            UpdatedAt = GetDate(conv, "updated_at"),
            IsPinned = GetBool(conv, "is_pinned"),
        };

        if (TryGetProp(root, "messages", out var msgs) && msgs.ValueKind == JsonValueKind.Array)
        {
            foreach (var m in msgs.EnumerateArray())
            {
                detail.Messages.Add(MapMessageDto(m));
            }
        }
        return detail;
    }

    public async Task<AiConversationSummaryDto> CreateConversationAsync(ClaimsPrincipal user, string? title, CancellationToken ct = default)
    {
        var root = await SendJsonAsync(HttpMethod.Post, "/api/v1/ai/conversations", user, new { title = title ?? "New Investigation" }, ct: ct);
        var item = TryGetProp(root, "conversation", out var c) ? c : root;
        return MapConversationSummary(item);
    }

    public async Task<bool> RenameConversationAsync(ClaimsPrincipal user, string conversationId, string newTitle, CancellationToken ct = default)
    {
        await SendJsonAsync(HttpMethod.Patch, $"/api/v1/ai/conversations/{Uri.EscapeDataString(conversationId)}", user, new { title = newTitle }, ct: ct);
        return true;
    }

    public async Task<bool> DeleteConversationAsync(ClaimsPrincipal user, string conversationId, CancellationToken ct = default)
    {
        await SendJsonAsync(HttpMethod.Delete, $"/api/v1/ai/conversations/{Uri.EscapeDataString(conversationId)}", user, ct: ct);
        return true;
    }

    public async Task<AiActionConfirmationResponseDto> ConfirmActionAsync(ClaimsPrincipal user, AiActionConfirmationRequestDto request, CancellationToken ct = default)
    {
        var root = await SendJsonAsync(
            HttpMethod.Post,
            "/api/v1/ai/actions/confirm",
            user,
            new { confirmation_token = request.ConfirmationToken, confirmed = request.Confirmed },
            ct: ct);

        return new AiActionConfirmationResponseDto
        {
            Success = GetBool(root, "success", true),
            Message = GetString(root, "message", "Action processed."),
            ResultDetails = TryGetProp(root, "result_details", out var rd) ? JsonSerializer.Deserialize<object>(rd.GetRawText(), JsonOpts) : null,
        };
    }

    public async Task<List<AiSuggestedPromptDto>> GetSuggestedPromptsAsync(ClaimsPrincipal user, CancellationToken ct = default)
    {
        var root = await SendJsonAsync(HttpMethod.Get, "/api/v1/ai/suggested-prompts", user, ct: ct);
        var result = new List<AiSuggestedPromptDto>();
        if (TryGetProp(root, "prompts", out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var p in arr.EnumerateArray())
            {
                result.Add(new AiSuggestedPromptDto
                {
                    Category = GetString(p, "category", "Intelligence"),
                    Prompt = GetString(p, "prompt"),
                    Description = GetString(p, "description"),
                    Icon = GetString(p, "icon", "Sparkles"),
                });
            }
        }
        return result;
    }

    public Task<JsonElement> ProxyJsonAsync(ClaimsPrincipal user, HttpMethod method, string relativePath, object? body = null, CancellationToken ct = default)
    {
        return SendJsonAsync(method, relativePath, user, body, ct: ct);
    }

    public async Task<JsonElement> UploadDocumentAsync(ClaimsPrincipal user, IFormFile file, string category, string allowedRoles, CancellationToken ct = default)
    {
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms, ct);
        using var form = new MultipartFormDataContent();
        var bytesContent = new ByteArrayContent(ms.ToArray());
        bytesContent.Headers.ContentType = new MediaTypeHeaderValue(string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType);
        form.Add(bytesContent, "file", file.FileName);
        form.Add(new StringContent(category ?? "policy"), "category");
        form.Add(new StringContent(allowedRoles ?? "All"), "allowed_roles");

        using var req = await CreateSignedRequestAsync(HttpMethod.Post, "/api/v1/ai/documents", user, content: form);
        using var client = CreateClient();
        using var resp = await client.SendAsync(req, ct);
        var raw = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Document upload rejected ({(int)resp.StatusCode}): {raw}");
        }
        return JsonDocument.Parse(raw).RootElement;
    }

    private static AiChatResponseDto MapChatResponse(JsonElement root)
    {
        var dto = new AiChatResponseDto
        {
            ConversationId = GetString(root, "conversation_id"),
            MessageId = GetString(root, "message_id"),
            Reply = GetString(root, "reply"),
            VisualType = TryGetProp(root, "visual_type", out var vt) && vt.ValueKind == JsonValueKind.String ? vt.GetString() : null,
            VisualData = TryGetProp(root, "visual_data", out var vd) && vd.ValueKind != JsonValueKind.Null ? JsonSerializer.Deserialize<object>(vd.GetRawText(), JsonOpts) : null,
            Timestamp = GetDate(root, "timestamp"),
            TokensUsed = GetInt(root, "tokens_used"),
            LatencyMs = GetDouble(root, "latency_ms"),
            ProviderUsed = TryGetProp(root, "provider_used", out var pu) && pu.ValueKind == JsonValueKind.String ? pu.GetString() : null,
        };

        if (TryGetProp(root, "tool_calls_executed", out var tools) && tools.ValueKind == JsonValueKind.Array)
        {
            foreach (var t in tools.EnumerateArray())
            {
                dto.ToolCallsExecuted.Add(new AiToolExecutionDto
                {
                    ToolName = GetString(t, "tool_name"),
                    Description = GetString(t, "description"),
                    Success = GetBool(t, "success"),
                    Summary = GetString(t, "summary"),
                    Module = GetString(t, "module"),
                    DurationMs = GetDouble(t, "duration_ms"),
                    RecordCount = GetInt(t, "record_count"),
                });
            }
        }

        if (TryGetProp(root, "additional_visuals", out var av) && av.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in av.EnumerateArray())
            {
                var obj = JsonSerializer.Deserialize<object>(item.GetRawText(), JsonOpts);
                if (obj != null) dto.AdditionalVisuals.Add(obj);
            }
        }

        if (TryGetProp(root, "evidence", out var ev) && ev.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in ev.EnumerateArray())
            {
                var obj = JsonSerializer.Deserialize<object>(item.GetRawText(), JsonOpts);
                if (obj != null) dto.Evidence.Add(obj);
            }
        }

        if (TryGetProp(root, "investigation_plan", out var ip) && ip.ValueKind == JsonValueKind.Object)
        {
            dto.InvestigationPlan = JsonSerializer.Deserialize<object>(ip.GetRawText(), JsonOpts);
        }

        if (TryGetProp(root, "follow_up_questions", out var fq) && fq.ValueKind == JsonValueKind.Array)
        {
            foreach (var q in fq.EnumerateArray())
            {
                if (q.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(q.GetString()))
                {
                    dto.FollowUpQuestions.Add(q.GetString()!);
                }
            }
        }

        if (TryGetProp(root, "pending_action", out var pa) && pa.ValueKind == JsonValueKind.Object)
        {
            var parameters = new Dictionary<string, object?>();
            if (TryGetProp(pa, "parameters", out var pObj) && pObj.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in pObj.EnumerateObject())
                {
                    parameters[prop.Name] = JsonSerializer.Deserialize<object?>(prop.Value.GetRawText(), JsonOpts);
                }
            }
            dto.PendingAction = new AiPendingActionDto
            {
                ActionType = GetString(pa, "action_type"),
                Title = GetString(pa, "title"),
                Description = GetString(pa, "description"),
                ConfirmationToken = GetString(pa, "confirmation_token"),
                ExpiresAt = GetDate(pa, "expires_at"),
                Parameters = parameters,
            };
        }

        return dto;
    }

    private static AiConversationSummaryDto MapConversationSummary(JsonElement el) => new()
    {
        Id = GetString(el, "id"),
        Title = GetString(el, "title", "New Conversation"),
        CreatedAt = GetDate(el, "created_at"),
        UpdatedAt = GetDate(el, "updated_at"),
        LastMessage = TryGetProp(el, "last_message", out var lm) && lm.ValueKind == JsonValueKind.String ? lm.GetString() : null,
        MessageCount = GetInt(el, "message_count"),
        IsPinned = GetBool(el, "is_pinned"),
    };

    private static AiChatMessageDto MapMessageDto(JsonElement el)
    {
        var dto = new AiChatMessageDto
        {
            Id = GetString(el, "id"),
            Sender = GetString(el, "sender", "user"),
            Content = GetString(el, "content"),
            VisualType = TryGetProp(el, "visual_type", out var vt) && vt.ValueKind == JsonValueKind.String ? vt.GetString() : null,
            VisualData = TryGetProp(el, "visual_data", out var vd) && vd.ValueKind != JsonValueKind.Null ? JsonSerializer.Deserialize<object>(vd.GetRawText(), JsonOpts) : null,
            IsActionExecuted = TryGetProp(el, "is_action_executed", out var ae) && (ae.ValueKind == JsonValueKind.True || ae.ValueKind == JsonValueKind.False) ? ae.GetBoolean() : null,
            CreatedAt = GetDate(el, "created_at"),
        };

        if (TryGetProp(el, "tool_calls", out var tools) && tools.ValueKind == JsonValueKind.Array)
        {
            dto.ToolCalls = new List<AiToolExecutionDto>();
            foreach (var t in tools.EnumerateArray())
            {
                dto.ToolCalls.Add(new AiToolExecutionDto
                {
                    ToolName = GetString(t, "tool_name"),
                    Description = GetString(t, "description"),
                    Success = GetBool(t, "success"),
                    Summary = GetString(t, "summary"),
                    Module = GetString(t, "module"),
                    DurationMs = GetDouble(t, "duration_ms"),
                    RecordCount = GetInt(t, "record_count"),
                });
            }
        }
        return dto;
    }

    private static bool TryGetProp(JsonElement obj, string name, out JsonElement val)
    {
        if (obj.ValueKind == JsonValueKind.Object && obj.TryGetProperty(name, out val))
        {
            return true;
        }
        val = default;
        return false;
    }

    private static string GetString(JsonElement obj, string name, string fallback = "") =>
        TryGetProp(obj, name, out var el) && el.ValueKind == JsonValueKind.String ? (el.GetString() ?? fallback) : fallback;

    private static bool GetBool(JsonElement obj, string name, bool fallback = false) =>
        TryGetProp(obj, name, out var el) && (el.ValueKind == JsonValueKind.True || el.ValueKind == JsonValueKind.False) ? el.GetBoolean() : fallback;

    private static int GetInt(JsonElement obj, string name) =>
        TryGetProp(obj, name, out var el) && el.ValueKind == JsonValueKind.Number && el.TryGetInt32(out var v) ? v : 0;

    private static double GetDouble(JsonElement obj, string name) =>
        TryGetProp(obj, name, out var el) && el.ValueKind == JsonValueKind.Number && el.TryGetDouble(out var v) ? v : 0.0;

    private static DateTime GetDate(JsonElement obj, string name)
    {
        if (TryGetProp(obj, name, out var el) && el.ValueKind == JsonValueKind.String && DateTime.TryParse(el.GetString(), out var dt))
        {
            return dt.ToUniversalTime();
        }
        return DateTime.UtcNow;
    }
}
