using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Services.Ai.Providers
{
    /// <summary>
    /// Deterministic fallback and system-level validation engine.
    /// Strictly handles explicit UI action tokens (confirmations / cancellations).
    /// All natural language intent understanding, query parsing, and conversational routing
    /// are delegated dynamically to Google Gemini LLM per architecture specifications.
    /// </summary>
    public class DeterministicAiEngine : IAiProvider
    {
        public string ProviderName => "DeterministicBuiltInEngine";
        public bool IsConfigured => true;

        public Task<AiCompletionResult> GenerateChatResponseAsync(AiChatContext context, IEnumerable<IAiTool> availableTools)
        {
            var msg = (context.LatestUserMessage ?? "").Trim();
            var result = new AiCompletionResult();

            // Handle explicit action confirmation button callbacks
            if (msg.StartsWith("action_confirm:", StringComparison.OrdinalIgnoreCase))
            {
                result.ReplyText = "Action confirmed. The operation has been authorized and queued for execution.";
                return Task.FromResult(result);
            }

            if (msg.StartsWith("action_cancel:", StringComparison.OrdinalIgnoreCase))
            {
                result.ReplyText = "Action was cancelled. No changes have been made to the system.";
                return Task.FromResult(result);
            }

            // Clean message when Gemini is unavailable or not configured
            result.ReplyText = "The School ERP AI Assistant requires Google Gemini API connectivity for dynamic natural language reasoning. Please ensure a valid API key is configured in application settings.";
            return Task.FromResult(result);
        }
    }
}
