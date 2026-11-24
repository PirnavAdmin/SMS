using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.Ai
{
    [Table("ai_chat_messages")]
    public class AiChatMessage
    {
        [Key]
        [Column("id")]
        [StringLength(64)]
        public string Id { get; set; } = string.Empty;

        [Column("TenantId")]
        [StringLength(64)]
        public string? TenantId { get; set; } = "tenant-default";

        [Column("conversation_id")]
        [StringLength(64)]
        public string ConversationId { get; set; } = string.Empty;

        [ForeignKey(nameof(ConversationId))]
        public virtual AiConversation? Conversation { get; set; }

        [Column("sender")]
        [StringLength(20)]
        public string Sender { get; set; } = "user";

        [Column("content")]
        public string Content { get; set; } = string.Empty;

        [Column("tool_calls_json")]
        public string? ToolCallsJson { get; set; }

        [Column("visual_type")]
        [StringLength(50)]
        public string? VisualType { get; set; }

        [Column("visual_data_json")]
        public string? VisualDataJson { get; set; }

        [Column("pending_action_json")]
        public string? PendingActionJson { get; set; }

        [Column("is_action_executed")]
        public bool? IsActionExecuted { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
