namespace SMS.Api.Models.StaffManagement;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class StudentAttendanceSession
{
    [Key]
    public int AttendanceSessionId { get; set; }

    public DateTime AttendanceDate { get; set; }

    public int BranchId { get; set; }

    public int AcademicYearId { get; set; }

    public int ClassId { get; set; }

    public int SectionId { get; set; }

    public int SubjectId { get; set; }

    public int PeriodId { get; set; }

    // Optional because a manually selected period might not have a timetable slot.
    public int? TimetableSlotId { get; set; }

    // Staff member/teacher who entered the attendance.
    public int MarkedByStaffId { get; set; }

    public bool IsLocked { get; set; }

    public int? LockedByStaffId { get; set; }

    public DateTime? LockedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<StudentAttendance> AttendanceRecords { get; set; }
        = new List<StudentAttendance>();
}
