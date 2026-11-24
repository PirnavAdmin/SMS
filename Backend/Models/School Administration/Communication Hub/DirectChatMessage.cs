namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Finbuckle.MultiTenant.EntityFrameworkCore;

[MultiTenant]
[Table("direct_chat_messages")]
public class DirectChatMessage
{
    [Key]
    [Column("message_id")]
    public int MessageId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("sender_id")]
    public string SenderId { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    [Column("sender_name")]
    public string SenderName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column("sender_role")]
    public string SenderRole { get; set; } = string.Empty;

    [MaxLength(50)]
    [Column("sender_class")]
    public string? SenderClass { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("receiver_id")]
    public string ReceiverId { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    [Column("receiver_name")]
    public string ReceiverName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column("receiver_role")]
    public string ReceiverRole { get; set; } = string.Empty;

    [MaxLength(50)]
    [Column("receiver_class")]
    public string? ReceiverClass { get; set; }

    [Required]
    [Column("message_text", TypeName = "text")]
    public string MessageText { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("attachment_url")]
    public string? AttachmentUrl { get; set; }

    [MaxLength(255)]
    [Column("attachment_name")]
    public string? AttachmentName { get; set; }

    [MaxLength(100)]
    [Column("attachment_type")]
    public string? AttachmentType { get; set; }

    [MaxLength(30)]
    [Column("call_type")]
    public string? CallType { get; set; } // "video" | "audio" | null

    [MaxLength(500)]
    [Column("call_meeting_url")]
    public string? CallMeetingUrl { get; set; }

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
