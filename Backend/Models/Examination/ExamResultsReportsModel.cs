namespace SMS.Api.Models.Examination;

using System;
using System.ComponentModel.DataAnnotations;

using System.ComponentModel.DataAnnotations;

public class NewStudentExamResult
{
    [Key]
    public int ResultId { get; set; }
    public int ExamId { get; set; } = 1;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public int StudentId { get; set; }
    public string RollNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public decimal TotalMarksObtained { get; set; } = 0;
    public decimal TotalMaxMarks { get; set; } = 600;
    public decimal Percentage { get; set; } = 0;
    public string Grade { get; set; } = "A+";
    public int Rank { get; set; } = 1;
    public string ResultStatus { get; set; } = "Pass"; // "Pass", "Fail"
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}

