namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class ExamOptionDto
{
    public string ExamId { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string DisplayName => $"{ExamName} ({Date})";
}

public class ReportCardDropdownOptionsDto
{
    public List<string> AcademicYears { get; set; } = new List<string> { "2026-27", "2027-28", "2025-26" };
    public List<ExamOptionDto> Exams { get; set; } = new List<ExamOptionDto>();
}

public class SubjectScoreDto
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Marks { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
}

public class GradingReferenceDto
{
    public string Grade { get; set; } = string.Empty;
    public string Range { get; set; } = string.Empty;
}

public class StudentReportCardResponseDto
{
    public string ExamName { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Percentage { get; set; } = string.Empty;
    public string OverallGrade { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
    public int TotalScore { get; set; }
    public int MaxPossibleScore { get; set; }
    public List<SubjectScoreDto> Subjects { get; set; } = new List<SubjectScoreDto>();
    public List<GradingReferenceDto> GradingSystemReference { get; set; } = new List<GradingReferenceDto>();
}
