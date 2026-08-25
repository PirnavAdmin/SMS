namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("librarian_attendances")]
public class LibrarianAttendance
{
    [Key]
    public int AttendanceId { get; set; }

    public DateTime Date { get; set; } = DateTime.UtcNow;

    [Required]
    public string StaffName { get; set; } = string.Empty;

    public string EmployeeCode { get; set; } = string.Empty;

    public string ShiftDetails { get; set; } = "Morning Shift (08:30 - 17:00)";

    public string CheckInTime { get; set; } = "08:30 AM";

    public string CheckOutTime { get; set; } = "05:00 PM";

    public double TotalHours { get; set; } = 8.5;

    public string Status { get; set; } = "Present";

    public string? DutyRemarks { get; set; }
}
