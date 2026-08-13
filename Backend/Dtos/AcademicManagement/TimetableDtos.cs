namespace SMS.Api.Dtos.AcademicManagement;

using System;
using System.Collections.Generic;

// 1. Period Setting DTOs
public class PeriodSettingDto
{
    public int PeriodId { get; set; }
    public string PeriodName { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty; // "08:30 AM"
    public string EndTime { get; set; } = string.Empty;   // "09:15 AM"
    public string PeriodType { get; set; } = "Teaching Period";
    public int DisplayOrder { get; set; }
}

public class SavePeriodSettingDto
{
    public int? PeriodId { get; set; }
    public string PeriodName { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty; // "08:30 AM" or "08:30"
    public string EndTime { get; set; } = string.Empty;   // "09:15 AM" or "09:15"
    public string PeriodType { get; set; } = "Teaching Period";
    public int DisplayOrder { get; set; } = 1;
}

// 2. Class Timetable Period Slot Allocation DTOs
public class SaveTimetableSlotDto
{
    public int ClassId { get; set; }
    public int SectionId { get; set; }
    public string AcademicYear { get; set; } = "2026-2027";
    public string BranchName { get; set; } = "Main Campus";
    public string DayOfWeek { get; set; } = "Monday";
    public string StartTime { get; set; } = string.Empty; // "08:30 AM"
    public string EndTime { get; set; } = string.Empty;   // "09:15 AM"
    public int SubjectId { get; set; }
    public int? TeacherId { get; set; } // Optional: Auto-resolved from TeacherSubjectAssignment if null
    public string? RoomNo { get; set; }
    public int? PeriodId { get; set; }
}

public class TimetableSlotDto
{
    public int SlotId { get; set; }
    public int HeaderId { get; set; }
    public int? PeriodId { get; set; }
    public string PeriodName { get; set; } = string.Empty;
    public string DayOfWeek { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty; // "08:30 AM"
    public string EndTime { get; set; } = string.Empty;   // "09:15 AM"
    public int SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string? RoomNo { get; set; }
}

// 3. Main Grid Matrix DTO
public class ClassTimetableGridDto
{
    public int HeaderId { get; set; }
    public string AcademicYear { get; set; } = "2026-2027";
    public string BranchName { get; set; } = "Main Campus";
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public int SectionId { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft"; // "Draft", "Published"
    public bool IncludeSaturday { get; set; } = true;
    public List<PeriodSettingDto> Periods { get; set; } = new();
    public List<TimetableSlotDto> Slots { get; set; } = new();
    public List<ClassSubjectQuotaDto> ClassSubjects { get; set; } = new();
}

public class ClassSubjectQuotaDto
{
    public int SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public int AssignedTeacherId { get; set; }
    public string AssignedTeacherName { get; set; } = string.Empty;
    public int AssignedPeriodsPerWeek { get; set; }
    public int MaxPeriodsPerWeek { get; set; } = 5;
}

// 4. Auto-Generated Teacher Timetable DTOs
public class TeacherTimetableDto
{
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public List<DayScheduleDto> Days { get; set; } = new();
}

public class StudentTimetableDto
{
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public int SectionId { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = "2026-2027";
    public List<DayScheduleDto> Days { get; set; } = new();
}

public class DayScheduleDto
{
    public string DayOfWeek { get; set; } = string.Empty;
    public List<TimetableSlotDto> Periods { get; set; } = new();
}

// 5. Copy Timetable DTO
public class CopyTimetableDto
{
    public int SourceClassId { get; set; }
    public int SourceSectionId { get; set; }
    public int TargetClassId { get; set; }
    public int TargetSectionId { get; set; }
    public string AcademicYear { get; set; } = "2026-2027";
}

public class PublishTimetableDto
{
    public int ClassId { get; set; }
    public int SectionId { get; set; }
    public string AcademicYear { get; set; } = "2026-2027";
    public string Status { get; set; } = "Published"; // "Draft", "Published"
}

// 6. Generate Timetable DTOs
public class GenerateTimetableRequestDto
{
    public string AcademicYear { get; set; } = "2026-2027";
    public string SchoolStartTime { get; set; } = "08:30 AM";
    public string SchoolEndTime { get; set; } = "03:30 PM";
    public int PeriodDurationMinutes { get; set; } = 45;
    public List<string> WorkingDays { get; set; } = new();
    public List<BreakItemDto> Breaks { get; set; } = new();
    public List<string> SelectedClassSections { get; set; } = new(); // e.g. ["Class 9-A"]
    public bool AutoAssignMappedSubjects { get; set; } = true;
}

public class BreakItemDto
{
    public string Name { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public int AfterPeriod { get; set; }
    public string Type { get; set; } = "Break"; // "Break", "Lunch", "Assembly", "Tea", "Other"
}

public class TimetableValidationResultDto
{
    public bool Valid { get; set; }
    public List<TimetableConflictDto> Conflicts { get; set; } = new();
}

public class TimetableConflictDto
{
    public string Type { get; set; } = string.Empty; // "TeacherConflict", "RoomConflict", "WeeklyLimit", etc.
    public string Message { get; set; } = string.Empty;
    public int? TeacherId { get; set; }
    public string? TeacherName { get; set; }
    public string? RoomNo { get; set; }
    public string? Day { get; set; }
    public string? TimeSlot { get; set; }
}
