namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class Circular
{
    [Key]
    public int CircularId { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;

    public string Category { get; set; } = "SPORTS • ALL";

    [Required]
    public string Content { get; set; } = string.Empty;

    public string TargetAudience { get; set; } = "ALL";

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    public string Author { get; set; } = "School Administration";

    public int DeliveredCount { get; set; } = 1420;

    public bool IsPinned { get; set; } = false;

    public bool SmsSent { get; set; } = true;
    public bool EmailSent { get; set; } = true;
    public bool PushDelivered { get; set; } = true;
}
