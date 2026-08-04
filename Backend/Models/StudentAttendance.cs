namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class StudentAttendance
{
    [Key]
    public int Id { get; set; }

    public int StudentId { get; set; }

    public string? StudentName { get; set; }

    public string? ClassName { get; set; }

    public string? SectionName { get; set; }

    public DateTime Date { get; set; }

    public string Status { get; set; } = "Present"; // Present, Absent, Late, HalfDay, Leave

    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
