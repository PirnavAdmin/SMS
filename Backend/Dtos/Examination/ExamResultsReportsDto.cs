namespace SMS.Api.Dtos.Examination;

using System.Collections.Generic;

public class ResultsReportsOptionsDto
{
    public List<string> Classes { get; set; } = new List<string>();
    public List<string> Sections { get; set; } = new List<string>();
    public List<string> ResultStatuses { get; set; } = new List<string> { "All", "Pass", "Fail" };
    public List<string> RankOrders { get; set; } = new List<string> { "Ascending", "Descending" };
}

public class StudentReportSubjectMarkDto
{
    public string Subject { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public decimal MaxMarks { get; set; }
    public decimal PassMarks { get; set; }
    public object? ObtainedMarks { get; set; }
    public string Grade { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class StudentReportCardRowDto
{
    public int ResultId { get; set; }
    public int StudentId { get; set; }
    public int ExamId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public int Rank { get; set; }
    public string RollNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public decimal TotalMarksObtained { get; set; }
    public decimal TotalMaxMarks { get; set; }
    public string TotalMarksDisplay => TotalMaxMarks > 0 ? $"{TotalMarksObtained:F0} / {TotalMaxMarks:F0}" : $"{TotalMarksObtained:F0}";
    public decimal Percentage { get; set; }
    public string PercentageDisplay => $"{Percentage:F1}%";
    public string Grade { get; set; } = string.Empty;
    public string ResultStatus { get; set; } = string.Empty;
    public List<StudentReportSubjectMarkDto> SubjectMarks { get; set; } = new List<StudentReportSubjectMarkDto>();
}

public class BulkSaveExamResultsDto
{
    public int ExamId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public List<StudentReportCardRowDto> Results { get; set; } = new List<StudentReportCardRowDto>();
}

public class ReportCardPrintDetailDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public decimal TotalMarksObtained { get; set; }
    public decimal TotalMaxMarks { get; set; }
    public int Rank { get; set; }
    public decimal Percentage { get; set; }
    public string Grade { get; set; } = string.Empty;
    public string ResultStatus { get; set; } = string.Empty;
    public string OverallResult { get; set; } = string.Empty;
    public List<StudentReportSubjectMarkDto> SubjectScores { get; set; } = new List<StudentReportSubjectMarkDto>();
    public List<StudentReportSubjectMarkDto> SubjectMarks { get; set; } = new List<StudentReportSubjectMarkDto>();
}

public class CalculateResultsRequestDto
{
    public int ExamId { get; set; } = 1;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
}

public class CalculateResultsResponseDto
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "Results calculated successfully.";
    public int TotalStudentsProcessed { get; set; } = 5;
    public int PassedCount { get; set; } = 4;
    public int FailedCount { get; set; } = 1;
    public List<StudentReportCardRowDto> Results { get; set; } = new List<StudentReportCardRowDto>();
}

