namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class HomeworkResponseDto
{
    public int HomeworkId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DueDate { get; set; } = string.Empty;
    public string? AttachmentFileName { get; set; }
    public string? AttachmentUrl { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public int SubmissionsCount { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class StudentHomeworkItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectDisplay => string.IsNullOrWhiteSpace(SubjectCode) ? Subject : $"{Subject} ({SubjectCode})";
    public string Description { get; set; } = string.Empty;
    public string HomeworkDate { get; set; } = string.Empty;
    public string SubmissionDate { get; set; } = string.Empty;
    public bool IsClosed { get; set; } = false;
}

public class HomeworkDropdownOptionsDto
{
    public List<string> AcademicYears { get; set; } = new List<string> { "2027-28", "2026-27", "2025-26" };
    public List<string> Subjects { get; set; } = new List<string> { "All Subjects", "Mathematics", "Social Studies (212)", "English (210)", "Mathematics (110)", "Physics (phy-102)" };
}
