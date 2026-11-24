using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using SMS.Api.Dtos.Ai;

namespace SMS.Api.Services.Ai.Interfaces
{
    public class AiChatContext
    {
        public string ConversationId { get; set; } = string.Empty;
        public string LatestUserMessage { get; set; } = string.Empty;
        public List<AiChatMessageDto> History { get; set; } = new();
        public AiToolContext ToolContext { get; set; } = new();
    }

    public class AiCompletionResult
    {
        public string ReplyText { get; set; } = string.Empty;
        public List<AiToolCallRequest> ToolCallsRequested { get; set; } = new();
        public bool HasToolCalls => ToolCallsRequested.Count > 0;
    }

    public class AiToolCallRequest
    {
        public string ToolName { get; set; } = string.Empty;
        public JsonElement Arguments { get; set; }
    }

    public interface IAiProvider
    {
        string ProviderName { get; }
        bool IsConfigured { get; }
        Task<AiCompletionResult> GenerateChatResponseAsync(AiChatContext context, IEnumerable<IAiTool> availableTools);
    }
}
