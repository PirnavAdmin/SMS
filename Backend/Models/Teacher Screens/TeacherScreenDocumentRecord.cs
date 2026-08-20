namespace SMS.Api.Models.TeacherScreens;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("teacher_screen_document_records")]
public class TeacherScreenDocumentRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StaffId { get; set; }

    [Required]
    [MaxLength(150)]
    public string DocumentTitle { get; set; } = string.Empty;

    [MaxLength(100)]
    public string DocumentType { get; set; } = string.Empty;

    public string? FileUrl { get; set; }

    [MaxLength(255)]
    public string? FileName { get; set; }

    public bool IsRequired { get; set; } = true;

    [MaxLength(50)]
    public string Status { get; set; } = "Pending";

    public DateTime? UploadedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
