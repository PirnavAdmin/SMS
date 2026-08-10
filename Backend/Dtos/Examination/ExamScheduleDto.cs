namespace SMS.Api.Dtos.Examination;

using System.Collections.Generic;

public class ScheduleOptionsDto
{
    public List<string> Classes { get; set; } = new List<string> { "Class 1", "Class 2", "Class 3", "Class 4", "Class 5" };
    public List<string> Sections { get; set; } = new List<string> { "Section A", "Section B", "Section C" };
    public List<string> Rooms { get; set; } = new List<string> { "TBA", "Conference Room 102", "Main Hall A", "Academic Block B-201" };
    public List<string> Invigilators { get; set; } = new List<string> { "Unassigned", "Eleanor Vance", "Robert Chen", "Sarah Jenkins", "Michael Chang" };
}

public class TimetableSlotItemDto
{
    public int SlotId { get; set; }
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public int TotalMarks { get; set; } = 100;
    public string SubjectDisplay => $"{SubjectName} ({SubjectCode} • {TotalMarks}M)";
    public string ExamDate { get; set; } = "2026-08-09";
    public string TimeSlot { get; set; } = "09:00 - 12:00";
    public string Duration { get; set; } = "3h";
    public string RoomHall { get; set; } = "TBA";
    public string InvigilatorFaculty { get; set; } = "Unassigned";
}

public class ClassSectionScheduleResponseDto
{
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public List<TimetableSlotItemDto> Timetable { get; set; } = new List<TimetableSlotItemDto>();
}

public class SaveTimetableRequestDto
{
    public int ExamId { get; set; } = 1;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public List<TimetableSlotItemDto> Timetable { get; set; } = new List<TimetableSlotItemDto>();
}

public class SectionSchedulePreviewCardDto
{
    public string Title => $"{ClassName} – {SectionName} Exam Schedule";
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public bool HasSchedule => Timetable != null && Timetable.Count > 0;
    public List<TimetableSlotItemDto> Timetable { get; set; } = new List<TimetableSlotItemDto>();
}

public class SchedulePreviewResponseDto
{
    public string AcademicYear { get; set; } = "2026-27";
    public string FilterView { get; set; } = "View: All Examination Classes — All Sections";
    public List<SectionSchedulePreviewCardDto> SectionSchedules { get; set; } = new List<SectionSchedulePreviewCardDto>();
}

