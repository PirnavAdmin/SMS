namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class HomeworkSubmission
{
    [Key]
    public int SubmissionId { get; set; }

    [Required]
    public int HomeworkId { get; set; }

    [ForeignKey("HomeworkId")]
    public Homework? Homework { get; set; }

    [Required]
    public int StudentId { get; set; }

    public string StudentName { get; set; } = string.Empty;

    public DateTime SubmissionDate { get; set; } = DateTime.UtcNow;

    public string? AttachmentUrl { get; set; }

    public string Status { get; set; } = "Submitted";

    public decimal? MarksObtained { get; set; }

    public string? Feedback { get; set; }
}
