namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class StaffAttendance
{
    [Key]
    public int StaffAttendanceId { get; set; }

    [Required]
    public int StaffId { get; set; }

    [ForeignKey("StaffId")]
    public Staff? Staff { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    public string Status { get; set; } = "Present"; // "Present", "Absent", "On Leave", "Half Day"

    public string? AcademicYear { get; set; } = "2026-2027";

    public string? Branch { get; set; } = "Main Campus";

    public string? Department { get; set; }

    public string? Designation { get; set; }

    public string? Remarks { get; set; }

    public string? InTime { get; set; }

    public string? OutTime { get; set; }
}
