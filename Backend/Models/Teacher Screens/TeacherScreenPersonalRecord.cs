namespace SMS.Api.Models.TeacherScreens;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("teacher_screen_personal_records")]
public class TeacherScreenPersonalRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StaffId { get; set; }

    public string? ProfilePhoto { get; set; }

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? MiddleName { get; set; }

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Gender { get; set; } = string.Empty;

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(10)]
    public string? BloodGroup { get; set; }

    [MaxLength(20)]
    public string? AlternateMobile { get; set; }

    [MaxLength(50)]
    public string? Nationality { get; set; }

    [MaxLength(50)]
    public string? Religion { get; set; }

    [MaxLength(30)]
    public string? MaritalStatus { get; set; }

    [MaxLength(150)]
    public string? FatherName { get; set; }

    [MaxLength(150)]
    public string? MotherName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
