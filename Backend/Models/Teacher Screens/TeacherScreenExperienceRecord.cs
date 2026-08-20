namespace SMS.Api.Models.TeacherScreens;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("teacher_screen_experience_records")]
public class TeacherScreenExperienceRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StaffId { get; set; }

    [MaxLength(50)]
    public string? TotalExperience { get; set; }

    [MaxLength(200)]
    public string? PreviousSchool { get; set; }

    [MaxLength(200)]
    public string? Organization { get; set; }

    [MaxLength(150)]
    public string? Designation { get; set; }

    public DateTime? JoiningDate { get; set; }

    public DateTime? RelievingDate { get; set; }

    [MaxLength(255)]
    public string? CertificateFileName { get; set; }

    public string? CertificateFileUrl { get; set; }

    public DateTime? CertificateUploadedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
