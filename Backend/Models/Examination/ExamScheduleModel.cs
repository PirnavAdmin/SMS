namespace SMS.Api.Models.Examination;

using System;
using System.ComponentModel.DataAnnotations;

public class NewExamTimetableSlot
{
    [Key]
    public int SlotId { get; set; }
    public int ExamId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public int TotalMarks { get; set; }
    public DateTime ExamDate { get; set; }
    public string TimeSlot { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string RoomHall { get; set; } = string.Empty;
    public string InvigilatorFaculty { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

