namespace SMS.Api.Dtos.StaffManagement;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

// ---------------------------------------------------------
// Common dropdown response
// ---------------------------------------------------------

public class AttendanceDropdownDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
}

// ---------------------------------------------------------
// Period dropdown
// ---------------------------------------------------------

public class AttendancePeriodDropdownDto
{
    public int PeriodId { get; set; }

    public string PeriodName { get; set; } = string.Empty;

    public TimeSpan? StartTime { get; set; }

    public TimeSpan? EndTime { get; set; }

    public int? TimetableSlotId { get; set; }
}

// ---------------------------------------------------------
// Attendance sheet query
// ---------------------------------------------------------

public class TeacherAttendanceSheetQueryDto
{
    [Required]
    public DateTime Date { get; set; }

    [Range(1, int.MaxValue)]
    public int BranchId { get; set; }

    [Range(1, int.MaxValue)]
    public int AcademicYearId { get; set; }

    [Range(1, int.MaxValue)]
    public int ClassId { get; set; }

    [Range(1, int.MaxValue)]
    public int SectionId { get; set; }

    [Range(1, int.MaxValue)]
    public int SubjectId { get; set; }

    [Range(1, int.MaxValue)]
    public int PeriodId { get; set; }
}

// ---------------------------------------------------------
// Individual student displayed in attendance sheet
// ---------------------------------------------------------

public class TeacherAttendanceStudentDto
{
    public int StudentId { get; set; }

    public string AdmissionNumber { get; set; } = string.Empty;

    public string RollNumber { get; set; } = string.Empty;

    public string StudentName { get; set; } = string.Empty;

    public string Status { get; set; } = "Present";

    public string? Remarks { get; set; }

    public bool HasExistingRecord { get; set; }
}

// ---------------------------------------------------------
// Attendance summary cards
// ---------------------------------------------------------

public class TeacherAttendanceSummaryDto
{
    public int TotalStudents { get; set; }

    public int Present { get; set; }

    public int Absent { get; set; }

    public int Late { get; set; }

    public int HalfDay { get; set; }

    public decimal AttendancePercentage { get; set; }
}

// ---------------------------------------------------------
// Complete attendance-sheet response
// ---------------------------------------------------------

public class TeacherAttendanceSheetResponseDto
{
    public int? AttendanceSessionId { get; set; }

    public DateTime AttendanceDate { get; set; }

    public int BranchId { get; set; }

    public string BranchName { get; set; } = string.Empty;

    public int AcademicYearId { get; set; }

    public string AcademicYearName { get; set; } = string.Empty;

    public int ClassId { get; set; }

    public string ClassName { get; set; } = string.Empty;

    public int SectionId { get; set; }

    public string SectionName { get; set; } = string.Empty;

    public int SubjectId { get; set; }

    public string SubjectName { get; set; } = string.Empty;

    public int PeriodId { get; set; }

    public string PeriodName { get; set; } = string.Empty;

    public int? TimetableSlotId { get; set; }

    public bool IsLocked { get; set; }

    public DateTime? LockedAt { get; set; }

    public TeacherAttendanceSummaryDto Summary { get; set; }
        = new();

    public List<TeacherAttendanceStudentDto> Students { get; set; }
        = new();
}

// ---------------------------------------------------------
// Individual row sent while saving attendance
// ---------------------------------------------------------

public class SaveTeacherAttendanceRecordDto
{
    [Range(1, int.MaxValue)]
    public int StudentId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Present";

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

// ---------------------------------------------------------
// Bulk save attendance request
// ---------------------------------------------------------

public class SaveTeacherAttendanceSheetDto
{
    [Required]
    public DateTime Date { get; set; }

    [Range(1, int.MaxValue)]
    public int BranchId { get; set; }

    [Range(1, int.MaxValue)]
    public int AcademicYearId { get; set; }

    [Range(1, int.MaxValue)]
    public int ClassId { get; set; }

    [Range(1, int.MaxValue)]
    public int SectionId { get; set; }

    [Range(1, int.MaxValue)]
    public int SubjectId { get; set; }

    [Range(1, int.MaxValue)]
    public int PeriodId { get; set; }

    public int? TimetableSlotId { get; set; }

    [Required]
    [MinLength(1)]
    public List<SaveTeacherAttendanceRecordDto> Students { get; set; }
        = new();
}

// ---------------------------------------------------------
// Save response
// ---------------------------------------------------------

public class SaveTeacherAttendanceResponseDto
{
    public int AttendanceSessionId { get; set; }

    public int InsertedCount { get; set; }

    public int UpdatedCount { get; set; }

    public bool IsLocked { get; set; }

    public string Message { get; set; } = string.Empty;

    public TeacherAttendanceSummaryDto Summary { get; set; }
        = new();
}

// ---------------------------------------------------------
// Lock/unlock response
// ---------------------------------------------------------

public class AttendanceLockResponseDto
{
    public int AttendanceSessionId { get; set; }

    public bool IsLocked { get; set; }

    public DateTime? LockedAt { get; set; }

    public string Message { get; set; } = string.Empty;
}
