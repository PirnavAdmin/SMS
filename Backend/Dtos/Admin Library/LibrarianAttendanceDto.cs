namespace SMS.Api.Dtos;

using System;

public class LibrarianAttendanceDto
{
    public int AttendanceId { get; set; }
    public string Date { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string ShiftDetails { get; set; } = string.Empty;
    public string CheckInTime { get; set; } = string.Empty;
    public string CheckOutTime { get; set; } = string.Empty;
    public double TotalHours { get; set; }
    public string Status { get; set; } = "Present";
    public string DutyRemarks { get; set; } = string.Empty;
}

public class CreateLibrarianAttendanceDto
{
    public string Date { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string ShiftDetails { get; set; } = "Morning Shift (08:30 - 17:00)";
    public string CheckInTime { get; set; } = "08:30 AM";
    public string CheckOutTime { get; set; } = "05:00 PM";
    public double TotalHours { get; set; } = 8.5;
    public string Status { get; set; } = "Present";
    public string? DutyRemarks { get; set; }
}
