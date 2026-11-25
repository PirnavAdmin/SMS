using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos.Ai
{
    public class AiChatRequestDto
    {
        public string? ConversationId { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? BranchId { get; set; }
        public int? AcademicYearId { get; set; }
        public string? BranchName { get; set; }
        public string? AcademicYear { get; set; }
    }

    public class AiChatResponseDto
    {
        public string ConversationId { get; set; } = string.Empty;
        public string MessageId { get; set; } = string.Empty;
        public string Reply { get; set; } = string.Empty;
        public string? VisualType { get; set; } // "table", "chart", "action_preview", "none"
        public object? VisualData { get; set; }
        public List<AiToolExecutionDto> ToolCallsExecuted { get; set; } = new();
        public AiPendingActionDto? PendingAction { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class AiToolExecutionDto
    {
        public string ToolName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool Success { get; set; }
        public object? Summary { get; set; }
    }

    public class AiPendingActionDto
    {
        public string ActionType { get; set; } = string.Empty; // "create_announcement", "schedule_meeting", etc.
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Dictionary<string, object?> Parameters { get; set; } = new();
        public string ConfirmationToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(15);
    }

    public class AiActionConfirmationRequestDto
    {
        public string ConfirmationToken { get; set; } = string.Empty;
        public bool Confirmed { get; set; } = true;
    }

    public class AiActionConfirmationResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public object? ResultDetails { get; set; }
    }

    public class AiConversationSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? LastMessage { get; set; }
        public int MessageCount { get; set; }
        public bool IsPinned { get; set; }
    }

    public class AiConversationDetailDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsPinned { get; set; }
        public List<AiChatMessageDto> Messages { get; set; } = new();
    }

    public class AiChatMessageDto
    {
        public string Id { get; set; } = string.Empty;
        public string Sender { get; set; } = "user";
        public string Content { get; set; } = string.Empty;
        public string? VisualType { get; set; }
        public object? VisualData { get; set; }
        public List<AiToolExecutionDto>? ToolCalls { get; set; }
        public AiPendingActionDto? PendingAction { get; set; }
        public bool? IsActionExecuted { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AiSuggestedPromptDto
    {
        public string Category { get; set; } = string.Empty;
        public string Prompt { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
    }

    public class RenameConversationDto
    {
        public string Title { get; set; } = string.Empty;
    }
}
