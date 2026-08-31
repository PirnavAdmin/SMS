namespace SMS.Api.Dtos.Examination;

using System.Collections.Generic;

public class SubjectOptionItemDto
{
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string DisplayText => $"{SubjectName} ({SubjectCode})";
}

public class MarksEntryOptionsDto
{
    public List<string> Classes { get; set; } = new List<string>();
    public List<string> Sections { get; set; } = new List<string>();
    public List<SubjectOptionItemDto> Subjects { get; set; } = new List<SubjectOptionItemDto>();
}

public class StudentMarksRowDto
{
    public int EntryId { get; set; }
    public string RollNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string AttendanceStatus { get; set; } = "Present";
    public decimal MarksObtained { get; set; } = 0;
    public decimal MaxMarks { get; set; } = 100;
    public string Grade { get; set; } = "A";
    public string EvaluatorRemarks { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
}

public class StudentMarksSheetResponseDto
{
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string Status { get; set; } = "STATUS: NOT STARTED";
    public int TotalStudents { get; set; } = 0;
    public int PresentCount { get; set; } = 0;
    public int AbsentCount { get; set; } = 0;
    public decimal ClassAverage { get; set; } = 0;
    public string FormattedClassAverage => $"{ClassAverage:F1} / 100";
    public List<StudentMarksRowDto> Students { get; set; } = new List<StudentMarksRowDto>();
}

public class SaveMarksSheetRequestDto
{
    public int ExamId { get; set; } = 1;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public List<StudentMarksRowDto> Students { get; set; } = new List<StudentMarksRowDto>();
    public bool IsFinalSubmit { get; set; } = false;
}

