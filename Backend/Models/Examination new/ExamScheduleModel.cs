namespace SMS.Api.Models.ExaminationNew;

using System;

public class NewExamTimetableSlot
{
    public int SlotId { get; set; }
    public int ExamId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public int TotalMarks { get; set; } = 100;
    public DateTime ExamDate { get; set; }
    public string TimeSlot { get; set; } = "09:00 - 12:00";
    public string Duration { get; set; } = "3h";
    public string RoomHall { get; set; } = "TBA";
    public string InvigilatorFaculty { get; set; } = "Unassigned";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
