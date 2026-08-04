using System;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models;

public class AuditLog
{
    [Key]
    public int AuditLogId { get; set; }
    
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserRole { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;
    
    [Required]
    public string Details { get; set; } = string.Empty;
    
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public int? SchoolId { get; set; }
}
