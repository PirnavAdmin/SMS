using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models;

public class School
{
    [Key]
    public int SchoolId { get; set; }

    [Required]
    [MaxLength(200)]
    public string SchoolName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string SchoolCode { get; set; } = string.Empty;

    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? PrincipalName { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active"; // Active, Inactive

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Relationships
    public ICollection<User> Users { get; set; } = new List<User>();
}
