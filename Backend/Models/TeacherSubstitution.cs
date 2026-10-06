namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("teacher_substitutions")]
public class TeacherSubstitution
{
    [Key]
    public int SubstitutionId { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    [MaxLength(20)]
    public string DayOfWeek { get; set; } = "Monday";

    public int? SlotId { get; set; }

    public int? PeriodId { get; set; }

    [MaxLength(50)]
    public string? PeriodName { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public int? ClassId { get; set; }

    [MaxLength(50)]
    public string? ClassName { get; set; }

    public int? SectionId { get; set; }

    [MaxLength(50)]
    public string? SectionName { get; set; }

    public int? SubjectId { get; set; }

    [MaxLength(100)]
    public string? SubjectName { get; set; }

    [Required]
    public int OriginalTeacherId { get; set; }

    [MaxLength(100)]
    public string? OriginalTeacherName { get; set; }

    [Required]
    public int SubstituteTeacherId { get; set; }

    [MaxLength(100)]
    public string? SubstituteTeacherName { get; set; }

    [MaxLength(50)]
    public string? RoomNo { get; set; }

    [MaxLength(150)]
    public string? Reason { get; set; } = "Teacher on Leave";

    public int? LeaveApplicationId { get; set; }

    [MaxLength(30)]
    public string Status { get; set; } = "Assigned"; // Assigned, Completed, Cancelled

    [MaxLength(255)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    [MaxLength(50)]
    public string? AcademicYear { get; set; }

    [MaxLength(100)]
    public string? BranchName { get; set; }

    // Navigation properties
    [ForeignKey(nameof(OriginalTeacherId))]
    public virtual Staff? OriginalTeacher { get; set; }

    [ForeignKey(nameof(SubstituteTeacherId))]
    public virtual Staff? SubstituteTeacher { get; set; }

    [ForeignKey(nameof(SlotId))]
    public virtual TimetableSlot? TimetableSlot { get; set; }

    [ForeignKey(nameof(PeriodId))]
    public virtual PeriodSetting? PeriodSetting { get; set; }
}
