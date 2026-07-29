namespace SMS.Api.Models;

using System.ComponentModel.DataAnnotations;

public class ExamResult
{
    [Key]
    public int ResultId { get; set; }

    [Required]
    public long ExamId { get; set; }

    public string ExamTitle { get; set; } = "Mid-Term Examination 2026";

    public string ClassName { get; set; } = "Class 10";

    public string SectionName { get; set; } = "A";

    public int StudentId { get; set; }

    public string RollNo { get; set; } = "1001";

    public string StudentName { get; set; } = "Alexander Wright";

    public decimal MarksObtained { get; set; } = 95;

    public decimal TotalMaxMarks { get; set; } = 200;

    public decimal Percentage { get; set; } = 48;

    public decimal GPA { get; set; } = 4;

    public string FinalGrade { get; set; } = "D";

    public string PassStatus { get; set; } = "Pass";

    public string ResultStatus { get; set; } = "PROCESSED";
}
