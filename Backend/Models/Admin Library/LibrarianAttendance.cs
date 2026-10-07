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

    public string ShiftDetails { get; set; } = string.Empty;

    public string CheckInTime { get; set; } = string.Empty;

    public string? CheckOutTime { get; set; }

    public double TotalHours { get; set; } = 0;

    public string Status { get; set; } = string.Empty;

    public string? DutyRemarks { get; set; }
}
