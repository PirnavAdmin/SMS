namespace SMS.Api.Models;

using System.ComponentModel.DataAnnotations;

public class ExamMark
{
    [Key]
    public int MarkId { get; set; }

    [Required]
    public long ExamId { get; set; }

    public string ExamTitle { get; set; } = "Mid-Term Examination 2026";

    public string ClassName { get; set; } = "Class 10";

    public string SectionName { get; set; } = "A";

    public int StudentId { get; set; }

    public string RollNo { get; set; } = "1001";

    public string StudentName { get; set; } = "ALEXANDER WRIGHT";

    public string SubjectName { get; set; } = "Mathematics";

    public decimal MaxMarks { get; set; } = 100;

    public decimal MarksObtained { get; set; } = 95;

    public string GradePreview { get; set; } = "A+";

    public string? Remarks { get; set; } = "E.g., Good";

    public bool IsLocked { get; set; } = false;
}
