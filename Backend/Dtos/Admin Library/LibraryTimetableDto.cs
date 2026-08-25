namespace SMS.Api.Dtos;

using System;
using System.Collections.Generic;

public class LibraryTimetableSlotDto
{
    public int SlotId { get; set; }
    public string DayOfWeek { get; set; } = "Tuesday";
    public int PeriodNumber { get; set; }
    public string PeriodName { get; set; } = string.Empty;
    public string TimeRange { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string Subject { get; set; } = "Library Free / Maintenance";
    public string AssignedLibrarian { get; set; } = "Bhanu Prakash & Rachel Green";
    public bool IsFreeSlot { get; set; } = true;
    public string DisplayStatus { get; set; } = "No class scheduled";
}

public class CreateLibraryTimetableSlotDto
{
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
