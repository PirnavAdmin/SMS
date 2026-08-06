namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class EventCategoryLegendDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class EventsOptionsDto
{
    public List<string> AcademicYears { get; set; } = new List<string> { "2027-28", "2026-27", "2025-26" };
    public List<EventCategoryLegendDto> Categories { get; set; } = new List<EventCategoryLegendDto>();
}

public class CalendarEventDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Category { get; set; } = "Holiday";
    public string Color { get; set; } = "#06b6d4";
    public bool IsGazettedHoliday { get; set; } = false;
}

public class UpcomingEventAgendaDto
{
    public int Id { get; set; }
    public string Tag { get; set; } = "SCHOOL EVENT";
    public string Source { get; set; } = "School Events Module";
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string TimeSlot { get; set; } = string.Empty;
    public string Category { get; set; } = "Event";
}

public class SchoolHolidayDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string DayOfWeek { get; set; } = string.Empty;
    public string Type { get; set; } = "Gazetted Holiday";
}
