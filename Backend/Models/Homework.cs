namespace SMS.Api.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class Homework
{
    [Key]
    public int HomeworkId { get; set; }

    [Required]
    public string ClassName { get; set; } = string.Empty;

    [Required]
    public string SubjectName { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public DateTime DueDate { get; set; }

    public string? AttachmentFileName { get; set; }
    public string? AttachmentUrl { get; set; }

    public string TeacherName { get; set; } = "Jonathan Miller";

    public int SubmissionsCount { get; set; } = 24;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<HomeworkSubmission> Submissions { get; set; } = new List<HomeworkSubmission>();
}
