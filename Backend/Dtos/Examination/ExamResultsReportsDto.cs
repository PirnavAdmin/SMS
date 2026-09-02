namespace SMS.Api.Dtos.Examination;

using System.Collections.Generic;

public class ResultsReportsOptionsDto
{
    public List<string> Classes { get; set; } = new List<string>();
    public List<string> Sections { get; set; } = new List<string>();
    public List<string> ResultStatuses { get; set; } = new List<string> { "All", "Pass", "Fail" };
    public List<string> RankOrders { get; set; } = new List<string> { "Ascending", "Descending" };
}

public class StudentReportCardRowDto
{
    public int ResultId { get; set; }
    public int StudentId { get; set; }
    public int Rank { get; set; }
    public string RollNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public decimal TotalMarksObtained { get; set; }
    public decimal TotalMaxMarks { get; set; } = 600;
    public string TotalMarksDisplay => $"{TotalMarksObtained:F0} / {TotalMaxMarks:F0}";
    public decimal Percentage { get; set; }
    public string PercentageDisplay => $"{Percentage:F1}%";
    public string Grade { get; set; } = "A+";
    public string ResultStatus { get; set; } = "Pass";
}

public class ReportCardPrintDetailDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = "2026-27";
    public decimal TotalMarksObtained { get; set; }
    public decimal TotalMaxMarks { get; set; } = 600;
    public int Rank { get; set; }
    public decimal Percentage { get; set; }
    public string Grade { get; set; } = "A+";
    public string ResultStatus { get; set; } = "Pass";
    public string OverallResult { get; set; } = "Pass";
    public List<SubjectMarksConfigItemDto> SubjectScores { get; set; } = new List<SubjectMarksConfigItemDto>();
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

