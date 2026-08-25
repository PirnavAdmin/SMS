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
    public string DayOfWeek { get; set; } = "Tuesday";

    public int PeriodNumber { get; set; } = 1;

    public string PeriodName { get; set; } = "PERIOD 1";

    public string StartTime { get; set; } = "08:30 AM";

    public string EndTime { get; set; } = "09:15 AM";

    public string? ClassName { get; set; }

    public string? Section { get; set; }

    public string Subject { get; set; } = "Library Free / Maintenance";

    public string AssignedLibrarian { get; set; } = "Bhanu Prakash";

    public bool IsFreeSlot { get; set; } = true;
}
