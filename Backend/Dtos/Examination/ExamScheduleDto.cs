namespace SMS.Api.Dtos.Examination;

using System.Collections.Generic;

public class ScheduleOptionsDto
{
    public List<string> Classes { get; set; } = new List<string>();
    public List<string> Sections { get; set; } = new List<string>();
    public List<string> Rooms { get; set; } = new List<string>();
    public List<string> Invigilators { get; set; } = new List<string>();
}

public class TimetableSlotItemDto
{
    public int SlotId { get; set; }
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public int TotalMarks { get; set; }
    public string SubjectDisplay => TotalMarks > 0 ? $"{SubjectName} ({SubjectCode} • {TotalMarks}M)" : $"{SubjectName} ({SubjectCode})";
    public string ExamDate { get; set; } = string.Empty;
    public string TimeSlot { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string RoomHall { get; set; } = string.Empty;
    public string InvigilatorFaculty { get; set; } = string.Empty;
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

