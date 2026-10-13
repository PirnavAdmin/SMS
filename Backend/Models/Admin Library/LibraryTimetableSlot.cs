namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("library_timetable_slots")]
public class LibraryTimetableSlot
{
    [Key]
    public int SlotId { get; set; }

    [Required]
    public string DayOfWeek { get; set; } = string.Empty;

    public int PeriodNumber { get; set; } = 1;

    public string PeriodName { get; set; } = string.Empty;

    public string StartTime { get; set; } = string.Empty;

    public string EndTime { get; set; } = string.Empty;

    public string? ClassName { get; set; }

    public string? Section { get; set; }

    public string Subject { get; set; } = string.Empty;

    public string AssignedLibrarian { get; set; } = string.Empty;

    public bool IsFreeSlot { get; set; } = true;
}
