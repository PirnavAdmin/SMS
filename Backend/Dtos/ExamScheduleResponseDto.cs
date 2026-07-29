namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class ExamScheduleResponseDto
{
    public int ScheduleId { get; set; }
    public long ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string ExamDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public decimal MaxMarks { get; set; }
    public decimal PassMarks { get; set; }
    public List<ExamInvigilatorAssignmentDto> Invigilators { get; set; } = new();
}
