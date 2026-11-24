namespace SMS.Api.Dtos;

using System;

public class ChatContactDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "teacher" | "student" | "parent"
    public string? Avatar { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? ClassName { get; set; }
    public string? Section { get; set; }
    public string? Subject { get; set; }
    public string? Designation { get; set; }
    public string? AdmissionNo { get; set; }
    public bool IsOnline { get; set; }
    public string? LastMessage { get; set; }
    public string? LastMessageTime { get; set; }
    public int UnreadCount { get; set; }
}

public class ChatMessageDto
{
    public int Id { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string? SenderClass { get; set; }
    public string ReceiverId { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverRole { get; set; } = string.Empty;
    public string? ReceiverClass { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
    public string? AttachmentType { get; set; }
    public string? CallType { get; set; }
    public string? CallMeetingUrl { get; set; }
    public bool IsOutgoing { get; set; }
}

public class SendMessageDto
{
    public string ReceiverId { get; set; } = string.Empty;
    public string? ReceiverName { get; set; }
    public string? ReceiverRole { get; set; }
    public string MessageText { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
    public string? AttachmentType { get; set; }
}

public class InitiateCallDto
{
    public string ReceiverId { get; set; } = string.Empty;
    public string? ReceiverName { get; set; }
    public string? ReceiverRole { get; set; }
    public string CallType { get; set; } = "video"; // "video" | "audio"
}
