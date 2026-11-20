namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Finbuckle.MultiTenant.EntityFrameworkCore;

[MultiTenant]
[Table("application_drafts")]
public class ApplicationDraft
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string FormType { get; set; } = string.Empty; // "student_admission", "staff_registration"

    [MaxLength(100)]
    public string DraftKey { get; set; } = "default";

    [MaxLength(100)]
    public string? UserId { get; set; }

    [MaxLength(150)]
    public string? UserName { get; set; }

    [MaxLength(100)]
    public string? Branch { get; set; }

    [MaxLength(50)]
    public string? AcademicYear { get; set; }

    [MaxLength(250)]
    public string? ApplicantName { get; set; }

    public int CurrentStep { get; set; } = 1;

    [Column(TypeName = "longtext")]
    public string FormData { get; set; } = "{}";

    [MaxLength(50)]
    public string Status { get; set; } = "Draft"; // "Draft", "Submitted", "Discarded"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
