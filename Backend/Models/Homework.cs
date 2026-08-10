namespace SMS.Api.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class Homework
{
    [Key]
    public int HomeworkId { get; set; }

    [Required]
    public string ClassName { get; set; } = "Class 10-A";

    public string ClassRoom { get; set; } = "Class 10-A";

    [Required]
    public string SubjectName { get; set; } = "Mathematics";

    [Required]
    public string Title { get; set; } = "Quadratic Equations Problem Set";

    public string? Topic { get; set; } = "Quadratic Equations";

    public string? Description { get; set; }

    [Required]
    public DateTime DueDate { get; set; } = DateTime.Parse("2026-07-22");

    public string PublishedTo { get; set; } = "Entire Class";

    public string Status { get; set; } = "PUBLISHED";

    public string? AttachmentFileName { get; set; }
    public string? AttachmentUrl { get; set; }

    public string TeacherName { get; set; } = "Jonathan Miller";

    public int SubmissionsCount { get; set; } = 24;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<HomeworkSubmission> Submissions { get; set; } = new List<HomeworkSubmission>();
}
