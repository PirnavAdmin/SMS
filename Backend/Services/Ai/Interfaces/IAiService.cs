using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using SMS.Api.Dtos.Ai;

namespace SMS.Api.Services.Ai.Interfaces
{
    public interface IAiService
    {
        Task<List<AiConversationSummaryDto>> GetUserConversationsAsync(ClaimsPrincipal user);
        Task<AiConversationDetailDto?> GetConversationDetailAsync(ClaimsPrincipal user, string conversationId);
        Task<AiConversationSummaryDto> CreateConversationAsync(ClaimsPrincipal user, string? title);
        Task<bool> RenameConversationAsync(ClaimsPrincipal user, string conversationId, string newTitle);
        Task<bool> DeleteConversationAsync(ClaimsPrincipal user, string conversationId);
        Task<AiChatResponseDto> SendChatMessageAsync(ClaimsPrincipal user, AiChatRequestDto request);
        Task<AiActionConfirmationResponseDto> ConfirmActionAsync(ClaimsPrincipal user, AiActionConfirmationRequestDto request);
        Task<List<AiSuggestedPromptDto>> GetSuggestedPromptsAsync(ClaimsPrincipal user);
    }
}
