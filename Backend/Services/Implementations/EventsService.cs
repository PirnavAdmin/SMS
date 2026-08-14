namespace SMS.Api.Services.Implementations;

using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class EventsService : IEventsService
{
    private readonly AppDbContext _context;

    public EventsService(AppDbContext context)
    {
        _context = context;
    }

    public Task<EventsOptionsDto> GetEventsOptionsAsync()
    {
        var options = new EventsOptionsDto
        {
            AcademicYears = new List<string> { "2027-28", "2026-27", "2025-26" },
            Categories = new List<EventCategoryLegendDto>
            {
                new EventCategoryLegendDto { Name = "Event", Color = "#0284c7" },
                new EventCategoryLegendDto { Name = "Holiday", Color = "#06b6d4" },
                new EventCategoryLegendDto { Name = "Exam", Color = "#ef4444" },
                new EventCategoryLegendDto { Name = "PTM", Color = "#ec4899" },
                new EventCategoryLegendDto { Name = "Meeting", Color = "#2563eb" },
                new EventCategoryLegendDto { Name = "Birthday", Color = "#eab308" }
            }
        };

        return Task.FromResult(options);
    }

    public Task<List<CalendarEventDto>> GetCalendarEventsAsync(int? month, int? year, string? academicYear)
    {
        int targetMonth = month ?? 7;
        int targetYear = year ?? 2026;

        var events = new List<CalendarEventDto>
        {
            new CalendarEventDto
            {
                Id = 1,
                Title = "Independence Holiday (Gazetted)",
                Date = "2026-07-04",
                Category = "Holiday",
                Color = "#06b6d4",
                IsGazettedHoliday = true
            },
            new CalendarEventDto
            {
                Id = 2,
                Title = "Annual Sports Day & Athletic Meet",
                Date = "2026-08-15",
                Category = "Event",
                Color = "#0284c7",
                IsGazettedHoliday = false
            },
            new CalendarEventDto
            {
                Id = 3,
                Title = "Term 1 Parent Teacher Meeting (PTM)",
                Date = "2026-08-28",
                Category = "PTM",
                Color = "#ec4899",
                IsGazettedHoliday = false
            }
        };

        var filtered = events.Where(e =>
        {
            if (DateTime.TryParse(e.Date, out var dt))
            {
                return dt.Month == targetMonth && dt.Year == targetYear;
            }
            return true;
        }).ToList();

        return Task.FromResult(filtered);
    }

    public Task<List<UpcomingEventAgendaDto>> GetUpcomingEventsAsync(string? search, string? date, string? category, string? academicYear)
    {
        var agendaList = new List<UpcomingEventAgendaDto>
        {
            new UpcomingEventAgendaDto
            {
                Id = 1,
                Tag = "SCHOOL EVENT",
                Source = "School Events Module",
                Title = "Annual Sports Day & Athletic Meet 2026",
                Description = "Grand Annual Sports Day featuring track & field competitions, march past, relay races, and trophy distribution.",
                Date = "2026-08-15",
                TimeSlot = "08:30 AM - 04:30 PM",
                Category = "Event"
            },
            new UpcomingEventAgendaDto
            {
                Id = 2,
                Tag = "SCHOOL EVENT",
                Source = "School Events Module",
                Title = "Inter-House Science & Robotics Exhibition",
                Description = "Student project showcases in AI, Renewable Energy, Physics Experiments, and Robotics Prototypes.",
                Date = "2026-08-22",
                TimeSlot = "10:00 AM - 03:00 PM",
                Category = "Event"
            },
            new UpcomingEventAgendaDto
            {
                Id = 3,
                Tag = "SCHOOL EVENT",
                Source = "School Events Module",
                Title = "Term 1 Parent Teacher Meeting (PTM)",
                Description = "Quarterly review meeting to discuss academic progress, attendance, and holistic student growth with parents.",
                Date = "2026-08-28",
                TimeSlot = "09:00 AM - 01:00 PM",
                Category = "PTM"
            },
            new UpcomingEventAgendaDto
            {
                Id = 4,
                Tag = "SCHOOL EVENT",
                Source = "School Events Module",
                Title = "Grand Cultural Fest & Musical Night",
                Description = "Annual cultural extravaganza featuring classical dance, drama performance, school choir, and band live show.",
                Date = "2026-09-05",
                TimeSlot = "04:00 PM - 08:30 PM",
                Category = "Event"
            }
        };

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            agendaList = agendaList.Where(e => e.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(date))
        {
            agendaList = agendaList.Where(e => e.Date.Contains(date)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            agendaList = agendaList.Where(e => 
                e.Title.Contains(search, StringComparison.OrdinalIgnoreCase) || 
                e.Description.Contains(search, StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        return Task.FromResult(agendaList);
    }

    public Task<List<SchoolHolidayDto>> GetSchoolHolidaysAsync(string? academicYear)
    {
        var holidays = new List<SchoolHolidayDto>
        {
            new SchoolHolidayDto
            {
                Id = 1,
                Title = "Independence Holiday (Gazetted)",
                Date = "2026-07-04",
                DayOfWeek = "Saturday",
                Type = "Gazetted Holiday"
            }
        };

        return Task.FromResult(holidays);
    }
}
