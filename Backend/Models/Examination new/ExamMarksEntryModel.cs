namespace SMS.Api.Models.ExaminationNew;

using System;

public class NewStudentMarksEntry
{
    public int EntryId { get; set; }
    public int ExamId { get; set; } = 1;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string AttendanceStatus { get; set; } = "Present"; // "Present", "Absent"
    public decimal MarksObtained { get; set; } = 0;
    public decimal MaxMarks { get; set; } = 100;
    public string Grade { get; set; } = "A";
    public string EvaluatorRemarks { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft"; // "Draft", "Submitted"
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
