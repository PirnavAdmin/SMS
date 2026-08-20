namespace SMS.Api.Models.TeacherScreens;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("teacher_screen_education_records")]
public class TeacherScreenEducationRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StaffId { get; set; }

    [Required]
    [MaxLength(150)]
    public string HighestQualification { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string BoardUniversity { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Year { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Percentage { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? BEd { get; set; }

    [MaxLength(100)]
    public string? MEd { get; set; }

    [MaxLength(100)]
    public string? PhD { get; set; }

    [MaxLength(150)]
    public string? Specialization { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
