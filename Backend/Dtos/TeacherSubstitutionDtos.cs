namespace SMS.Api.Dtos;

using System;
using System.Collections.Generic;

public class TeacherSubstitutionDto
{
    public int SubstitutionId { get; set; }
    public string Date { get; set; } = string.Empty; // "yyyy-MM-dd"
    public string DayOfWeek { get; set; } = string.Empty;
    public int? SlotId { get; set; }
    public int? PeriodId { get; set; }
    public string? PeriodName { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string TimeSlot { get; set; } = string.Empty;
    public int? ClassId { get; set; }
    public string? ClassName { get; set; }
    public int? SectionId { get; set; }
    public string? SectionName { get; set; }
    public int? SubjectId { get; set; }
    public string? SubjectName { get; set; }
    public int OriginalTeacherId { get; set; }
    public string OriginalTeacherName { get; set; } = string.Empty;
    public int SubstituteTeacherId { get; set; }
    public string SubstituteTeacherName { get; set; } = string.Empty;
    public string? RoomNo { get; set; }
    public string? Reason { get; set; }
    public int? LeaveApplicationId { get; set; }
    public string Status { get; set; } = "Assigned";
    public string? Remarks { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? CreatedBy { get; set; }
    public string? AcademicYear { get; set; }
    public string? BranchName { get; set; }
}

public class AssignTeacherSubstitutionDto
{
    public string Date { get; set; } = string.Empty; // "yyyy-MM-dd"
    public int? SlotId { get; set; }
    public int? PeriodId { get; set; }
    public string? PeriodName { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public int? ClassId { get; set; }
    public string? ClassName { get; set; }
    public int? SectionId { get; set; }
    public string? SectionName { get; set; }
    public int? SubjectId { get; set; }
    public string? SubjectName { get; set; }
    public int OriginalTeacherId { get; set; }
    public string? OriginalTeacherName { get; set; }
    public int SubstituteTeacherId { get; set; }
    public string? SubstituteTeacherName { get; set; }
    public string? RoomNo { get; set; }
    public string? Reason { get; set; } = "Teacher on Leave";
    public int? LeaveApplicationId { get; set; }
    public string? Remarks { get; set; }
    public string? AcademicYear { get; set; }
    public string? BranchName { get; set; }
}

public class AvailableLeisureTeacherDto
{
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public List<string> AssignedSubjects { get; set; } = new();
    public bool IsSubjectMatch { get; set; }
    public bool IsDepartmentMatch { get; set; }
    public int TodaySubstitutionsCount { get; set; }
    public int TodayScheduledLecturesCount { get; set; }
    public string AvailabilityStatus { get; set; } = "At Leisure (Free Period)";
}

public class AbsentTeacherPeriodDto
{
    public int? SlotId { get; set; }
    public int? PeriodId { get; set; }
    public string PeriodName { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string TimeSlot { get; set; } = string.Empty;
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public int SectionId { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public int SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string? RoomNo { get; set; }
    public bool IsReplaced { get; set; }
    public TeacherSubstitutionDto? ActiveSubstitution { get; set; }
    public List<AvailableLeisureTeacherDto> AvailableLeisureTeachers { get; set; } = new();
}

public class AbsentTeacherScheduleDto
{
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string LeaveType { get; set; } = "Casual Leave";
    public string LeaveReason { get; set; } = string.Empty;
    public int? LeaveApplicationId { get; set; }
    public bool IsHalfDay { get; set; }
    public int TotalPeriodsToday { get; set; }
    public int ReplacedPeriodsCount { get; set; }
    public int PendingPeriodsCount { get; set; }
    public List<AbsentTeacherPeriodDto> Periods { get; set; } = new();
}

public class AutoReplaceSubstitutionsRequestDto
{
    public string Date { get; set; } = string.Empty; // "yyyy-MM-dd"
    public int? TeacherId { get; set; } // Optional: target specific absent teacher or all
    public string? AcademicYear { get; set; }
    public string? BranchName { get; set; }
    public string? Remarks { get; set; }
}

public class AutoReplaceSubstitutionsResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TotalUnassignedPeriods { get; set; }
    public int SuccessfullyReplacedCount { get; set; }
    public int UncoveredCount { get; set; }
    public List<TeacherSubstitutionDto> CreatedSubstitutions { get; set; } = new();
    public List<string> UncoveredPeriodDescriptions { get; set; } = new();
}
