namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class ScheduleSubjectExamDto
{
    public long ExamId { get; set; }
    public string ExamTitle { get; set; } = "Mid-Term Examination 2026";
    public string SubjectName { get; set; } = "Computer - CS";
    public string ClassName { get; set; } = "Class 11";
    public string SectionName { get; set; } = "All Sections";
    public bool ApplyToAllSections { get; set; } = true;
    public string ExamDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = "09:00";
    public string EndTime { get; set; } = "12:00";
    public List<ExamInvigilatorAssignmentDto> InvigilatorAssignments { get; set; } = new();
}
