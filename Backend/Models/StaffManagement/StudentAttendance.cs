namespace SMS.Api.Models.StaffManagement;

using System;
using System.ComponentModel.DataAnnotations;

public class StudentAttendance
{
    [Key]
    public int Id { get; set; }

    public int AttendanceSessionId { get; set; }

    public int? StudentId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Present";

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public StudentAttendanceSession? AttendanceSession { get; set; }

    public Student? Student { get; set; }
}
