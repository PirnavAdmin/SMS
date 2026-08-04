using System;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models;

public class SystemNotification
{
    [Key]
    public int NotificationId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = "Info"; // Info, Warning, Error

    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public int? SchoolId { get; set; }
}
