namespace SMS.Api.Models.TeacherScreens;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("teacher_screen_review_records")]
public class TeacherScreenReviewRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StaffId { get; set; }

    [Required]
    [MaxLength(50)]
    public string SubmissionStatus { get; set; } = "Pending"; // "Pending", "Completed"

    public DateTime? SubmittedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
