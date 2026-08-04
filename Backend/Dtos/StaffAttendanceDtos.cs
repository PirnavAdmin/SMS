namespace SMS.Api.Dtos;

using System;
using System.Collections.Generic;

public class StaffAttendanceRecordDto
{
    public int StaffId { get; set; }
    public string Status { get; set; } = "Present"; // Present, Absent, On Leave, Half Day
    public string? Remarks { get; set; }
    public string? InTime { get; set; }
    public string? OutTime { get; set; }
}

public class BulkAttendanceDto
{
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD
    public string? AcademicYear { get; set; } = "2026-2027";
    public string? Branch { get; set; } = "Main Campus";
    public string? Department { get; set; }
    public List<StaffAttendanceRecordDto> Records { get; set; } = new();
}

public class StaffAttendanceResponseDto
{
    public int StaffAttendanceId { get; set; }
    public int StaffId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Designation { get; set; }
    public string? Remarks { get; set; }
    public string? InTime { get; set; }
    public string? OutTime { get; set; }
}

public class DailyAttendanceSummaryDto
{
    public int TotalStaff { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int OnLeaveCount { get; set; }
    public int HalfDayCount { get; set; }
    public double PresenceRatePercentage { get; set; }
    public string? HolidayAlert { get; set; }
}
