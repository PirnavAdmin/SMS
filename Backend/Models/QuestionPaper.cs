namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class QuestionPaper
{
    [Key]
    public int QuestionPaperId { get; set; }

    [Required]
    public long ExamId { get; set; }

    public string ExamTitle { get; set; } = "Mid-Term Examination 2026";

    public string ClassName { get; set; } = "Class 10";

    public string SectionName { get; set; } = "10th (A)";

    public string SubjectName { get; set; } = "Mathematics";

    public string PaperTitle { get; set; } = "final";

    public string PaperCode { get; set; } = "MAT-101";

    public DateTime ExamDate { get; set; }

    public string Duration { get; set; } = "3 Hours";

    public decimal MaxMarks { get; set; } = 100;

    public string? Instructions { get; set; } = "1. Read all questions carefully. 2. Answer in neat handwriting.";

    public string DocumentFileName { get; set; } = "question_paper.pdf";

    public string DocumentSize { get; set; } = "1.5 MB";

    public string? DocumentUrl { get; set; }

    public string UploadedBy { get; set; } = "javvadivenkat999";

    public DateTime UploadedDate { get; set; } = DateTime.UtcNow;

    public string PublishStatus { get; set; } = "PUBLISHED";
}
