using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SMS.Api.Dtos.Ai;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Services.Ai;

/// <summary>
/// Routes AI operations to the autonomous Python AI-Platform via HMAC-signed context,
/// with optional controlled fallback to legacy AiService only when AI-Platform is offline.
/// </summary>
public sealed class HybridAiService : IAiService
{
    private readonly IAiPlatformProxyService _proxy;
    private readonly AiService _legacy;
    private readonly ILogger<HybridAiService> _logger;

    public HybridAiService(
        IAiPlatformProxyService proxy,
        AiService legacy,
        ILogger<HybridAiService> logger)
    {
        _proxy = proxy;
        _legacy = legacy;
        _logger = logger;
    }

    private async Task<T> ExecuteWithFallbackAsync<T>(
        string operationName,
        Func<Task<T>> platformCall,
        Func<Task<T>> legacyCall)
    {
        if (!_proxy.IsEnabled)
        {
            return await legacyCall();
        }

        try
        {
            return await platformCall();
        }
        catch (AiPlatformUnavailableException ex) when (_proxy.FallbackToLegacyOnUnavailable)
        {
            _logger.LogWarning(ex, "Python AI-Platform unavailable for {Operation}; falling back to legacy AiService.", operationName);
            return await legacyCall();
        }
    }

    public Task<List<AiConversationSummaryDto>> GetUserConversationsAsync(ClaimsPrincipal user) =>
        ExecuteWithFallbackAsync(
            nameof(GetUserConversationsAsync),
            () => _proxy.GetUserConversationsAsync(user),
            () => _legacy.GetUserConversationsAsync(user));

    public Task<AiConversationDetailDto?> GetConversationDetailAsync(ClaimsPrincipal user, string conversationId) =>
        ExecuteWithFallbackAsync(
            nameof(GetConversationDetailAsync),
            () => _proxy.GetConversationDetailAsync(user, conversationId),
            () => _legacy.GetConversationDetailAsync(user, conversationId));

    public Task<AiConversationSummaryDto> CreateConversationAsync(ClaimsPrincipal user, string? title) =>
        ExecuteWithFallbackAsync(
            nameof(CreateConversationAsync),
            () => _proxy.CreateConversationAsync(user, title),
            () => _legacy.CreateConversationAsync(user, title));

    public Task<bool> RenameConversationAsync(ClaimsPrincipal user, string conversationId, string newTitle) =>
        ExecuteWithFallbackAsync(
            nameof(RenameConversationAsync),
            () => _proxy.RenameConversationAsync(user, conversationId, newTitle),
            () => _legacy.RenameConversationAsync(user, conversationId, newTitle));

    public Task<bool> DeleteConversationAsync(ClaimsPrincipal user, string conversationId) =>
        ExecuteWithFallbackAsync(
            nameof(DeleteConversationAsync),
            () => _proxy.DeleteConversationAsync(user, conversationId),
            () => _legacy.DeleteConversationAsync(user, conversationId));

    public Task<AiChatResponseDto> SendChatMessageAsync(ClaimsPrincipal user, AiChatRequestDto request) =>
        ExecuteWithFallbackAsync(
            nameof(SendChatMessageAsync),
            () => _proxy.SendChatMessageAsync(user, request),
            () => _legacy.SendChatMessageAsync(user, request));

    public Task<AiActionConfirmationResponseDto> ConfirmActionAsync(ClaimsPrincipal user, AiActionConfirmationRequestDto request) =>
        ExecuteWithFallbackAsync(
            nameof(ConfirmActionAsync),
            () => _proxy.ConfirmActionAsync(user, request),
            () => _legacy.ConfirmActionAsync(user, request));

    public Task<List<AiSuggestedPromptDto>> GetSuggestedPromptsAsync(ClaimsPrincipal user) =>
        ExecuteWithFallbackAsync(
            nameof(GetSuggestedPromptsAsync),
            () => _proxy.GetSuggestedPromptsAsync(user),
            () => _legacy.GetSuggestedPromptsAsync(user));
}
