namespace SMS.Api.Dtos;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class HostelAttendanceDto
{
    public long AttendanceId { get; set; }
    public int AllocationId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string HostelName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public string BedNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string CurfewStatus { get; set; } = "Present";
    public string? Remarks { get; set; }
}

public class SaveHostelAttendanceRollCallDto
{
    [Required]
    public DateTime Date { get; set; } = DateTime.UtcNow;

    public int? HostelId { get; set; }
    public string? FloorLevel { get; set; }
    public int? RoomId { get; set; }

    [Required]
    public List<StudentAttendanceRecordDto> Records { get; set; } = new();
}

public class StudentAttendanceRecordDto
{
    [Required]
    public int AllocationId { get; set; }

    [Required]
    public string CurfewStatus { get; set; } = "Present"; // Present, Absent, Late, On Leave

    public string? Remarks { get; set; }
}
