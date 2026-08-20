namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/events")]
[AllowAnonymous]
[Tags("Events & Holidays Calendar")]
public class EventsController : ControllerBase
{
    private readonly AppDbContext _context;

    public EventsController(AppDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // 1. DROPDOWN OPTIONS & LEGENDS
    // =========================================================

    [HttpGet("options")]
    public IActionResult GetEventsOptions()
    {
        var legendCategories = new List<EventCategoryLegendDto>
        {
            new EventCategoryLegendDto { Name = "Holiday", Color = "#10b981" },
            new EventCategoryLegendDto { Name = "Event", Color = "#3b82f6" },
            new EventCategoryLegendDto { Name = "Exam", Color = "#ef4444" },
            new EventCategoryLegendDto { Name = "PTM / Meeting", Color = "#f97316" },
            new EventCategoryLegendDto { Name = "Birthday", Color = "#eab308" }
        };

        var holidayTypes = new List<string> { "All Types", "National", "Gazetted", "Festival", "Vacation", "Optional" };
        var eventCategories = new List<string> { "Sports Day", "Science Exhibition", "Parent Teacher Meeting", "Cultural Fest", "Workshop & Seminar", "Academic" };
        var academicYears = new List<string> { "2027-28", "2026-27", "2025-26" };

        return Ok(new
        {
            success = true,
            data = new
            {
                categories = legendCategories,
                eventCategories = eventCategories,
                holidayTypes = holidayTypes,
                academicYears = academicYears
            }
        });
    }

    // =========================================================
    // 2. ACADEMIC CALENDAR MONTH GRID VIEW
    // =========================================================

    [HttpGet("calendar")]
    public async Task<IActionResult> GetCalendarEvents(
        [FromQuery] int? month = 8,
        [FromQuery] int? year = 2026)
    {
        var list = new List<CalendarEventDto>();

        var holidays = await _context.HolidayCalendars.AsNoTracking().ToListAsync();
        foreach (var h in holidays)
        {
            list.Add(new CalendarEventDto
            {
                Id = h.HolidayId,
                Title = h.Name,
                Date = h.FromDate.ToString("yyyy-MM-dd"),
                Category = "Holiday",
                Color = "#10b981",
                IsGazettedHoliday = h.Type?.ToLower() == "gazetted" || h.Type?.ToLower() == "national"
            });
        }

        var events = await _context.SchoolEvents.AsNoTracking().ToListAsync();
        foreach (var e in events)
        {
            string cat = e.Category ?? "Event";
            string color = cat.Contains("Exam", StringComparison.OrdinalIgnoreCase) ? "#ef4444" :
                           cat.Contains("PTM", StringComparison.OrdinalIgnoreCase) ? "#f97316" : "#3b82f6";

            list.Add(new CalendarEventDto
            {
                Id = e.EventId,
                Title = e.Title,
                Date = e.StartDate.ToString("yyyy-MM-dd"),
                Category = cat,
                Color = color,
                IsGazettedHoliday = false
            });
        }

        // Seed DB if table is empty
        if (!list.Any())
        {
            await SeedDefaultHolidaysAndEventsAsync();
            
            holidays = await _context.HolidayCalendars.AsNoTracking().ToListAsync();
            foreach (var h in holidays)
            {
                list.Add(new CalendarEventDto
                {
                    Id = h.HolidayId,
                    Title = h.Name,
                    Date = h.FromDate.ToString("yyyy-MM-dd"),
                    Category = "Holiday",
                    Color = "#10b981",
                    IsGazettedHoliday = h.Type?.ToLower() == "gazetted" || h.Type?.ToLower() == "national"
                });
            }

            events = await _context.SchoolEvents.AsNoTracking().ToListAsync();
            foreach (var e in events)
            {
                string cat = e.Category ?? "Event";
                string color = cat.Contains("Exam", StringComparison.OrdinalIgnoreCase) ? "#ef4444" :
                               cat.Contains("PTM", StringComparison.OrdinalIgnoreCase) ? "#f97316" : "#3b82f6";

                list.Add(new CalendarEventDto
                {
                    Id = e.EventId,
                    Title = e.Title,
                    Date = e.StartDate.ToString("yyyy-MM-dd"),
                    Category = cat,
                    Color = color,
                    IsGazettedHoliday = false
                });
            }
        }

        return Ok(new { success = true, data = list });
    }

    // =========================================================
    // 3. UPCOMING SCHEDULES / AGENDA LIST VIEW
    // =========================================================

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcomingEvents(
        [FromQuery] string? search,
        [FromQuery] string? date,
        [FromQuery] string? category = "All",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var events = await _context.SchoolEvents.AsNoTracking().OrderBy(e => e.StartDate).ToListAsync();

        if (!events.Any())
        {
            await SeedDefaultHolidaysAndEventsAsync();
            events = await _context.SchoolEvents.AsNoTracking().OrderBy(e => e.StartDate).ToListAsync();
        }

        var items = events.Select(e => new UpcomingEventAgendaDto
        {
            Id = e.EventId,
            Tag = "SCHOOL EVENT",
            Source = "School Events Module",
            Title = e.Title,
            Description = !string.IsNullOrWhiteSpace(e.Description) ? $"{e.Description} • Venue: {e.Venue}" : $"Venue: {e.Venue}",
            Date = e.StartDate.ToString("yyyy-MM-dd"),
            TimeSlot = e.Time,
            Category = e.Category,
            Venue = e.Venue
        }).ToList();

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.ToLower().Trim();
            items = items.Where(i => i.Title.ToLower().Contains(s) || i.Description.ToLower().Contains(s) || i.Venue.ToLower().Contains(s)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(date))
        {
            items = items.Where(i => i.Date == date).ToList();
        }

        int totalCount = items.Count;
        int currentPage = page > 0 ? page : 1;
        int currentSize = pageSize > 0 ? pageSize : 10;

        var pagedData = items.Skip((currentPage - 1) * currentSize).Take(currentSize).ToList();

        return Ok(new
        {
            success = true,
            message = "Upcoming events retrieved successfully.",
            totalCount,
            totalEntries = totalCount,
            page = currentPage,
            pageSize = currentSize,
            totalPages = (int)Math.Ceiling((double)totalCount / currentSize),
            data = pagedData
        });
    }

    // =========================================================
    // 4. SCHOOL EVENTS CRUD
    // =========================================================

    [HttpGet("school-events")]
    public async Task<IActionResult> GetSchoolEventsList(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.SchoolEvents.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(e => e.Category != null && e.Category.ToLower().Contains(category.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.ToLower().Trim();
            query = query.Where(e => e.Title.ToLower().Contains(s) || e.Venue.ToLower().Contains(s) || (e.Description != null && e.Description.ToLower().Contains(s)));
        }

        var list = await query.OrderByDescending(e => e.StartDate).ToListAsync();

        if (!list.Any() && string.IsNullOrWhiteSpace(search) && (string.IsNullOrWhiteSpace(category) || category.Equals("All", StringComparison.OrdinalIgnoreCase)))
        {
            await SeedDefaultHolidaysAndEventsAsync();
            list = await _context.SchoolEvents.AsNoTracking().OrderByDescending(e => e.StartDate).ToListAsync();
        }

        var dtos = list.Select(MapSchoolEventToDto).ToList();
        int totalCount = dtos.Count;
        int currentPage = page > 0 ? page : 1;
        int currentSize = pageSize > 0 ? pageSize : 10;

        var pagedData = dtos.Skip((currentPage - 1) * currentSize).Take(currentSize).ToList();

        return Ok(new
        {
            success = true,
            message = "School events retrieved successfully.",
            totalCount,
            totalEntries = totalCount,
            page = currentPage,
            pageSize = currentSize,
            totalPages = (int)Math.Ceiling((double)totalCount / currentSize),
            data = pagedData
        });
    }

    [HttpGet("school-events/{id:int}")]
    public async Task<IActionResult> GetSchoolEventById(int id)
    {
        var e = await _context.SchoolEvents.FindAsync(id);
        if (e == null) return NotFound(new { success = false, message = "School event not found." });

        return Ok(new { success = true, data = MapSchoolEventToDto(e) });
    }

    [HttpPost("school-events")]
    public async Task<IActionResult> CreateSchoolEvent([FromBody] CreateSchoolEventDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest(new { success = false, message = "Event title is mandatory." });
        }

        DateTime sDate = DateTime.UtcNow;
        DateTime eDate = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dto.StartDate) && DateTime.TryParse(dto.StartDate, out var s)) sDate = s;
        if (!string.IsNullOrWhiteSpace(dto.EndDate) && DateTime.TryParse(dto.EndDate, out var end)) eDate = end;

        var entity = new SchoolEvent
        {
            Title = dto.Title.Trim(),
            Category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category.Trim() : "Sports Day",
            Venue = !string.IsNullOrWhiteSpace(dto.Venue) ? dto.Venue.Trim() : "Main Auditorium",
            StartDate = sDate,
            EndDate = eDate,
            Time = !string.IsNullOrWhiteSpace(dto.Time) ? dto.Time.Trim() : "08:30 AM",
            Organizer = !string.IsNullOrWhiteSpace(dto.Organizer) ? dto.Organizer.Trim() : "School Administration",
            Description = dto.Description?.Trim() ?? "",
            Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status.Trim() : "Published",
            ApplicableBranch = "Main Campus"
        };

        await _context.SchoolEvents.AddAsync(entity);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "School event published to calendar successfully.",
            data = MapSchoolEventToDto(entity)
        });
    }

    [HttpPut("school-events/{id:int}")]
    public async Task<IActionResult> UpdateSchoolEvent(int id, [FromBody] CreateSchoolEventDto dto)
    {
        var e = await _context.SchoolEvents.FindAsync(id);
        if (e == null) return NotFound(new { success = false, message = "School event not found." });

        if (!string.IsNullOrWhiteSpace(dto.Title)) e.Title = dto.Title.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Category)) e.Category = dto.Category.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Venue)) e.Venue = dto.Venue.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Time)) e.Time = dto.Time.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Organizer)) e.Organizer = dto.Organizer.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Description)) e.Description = dto.Description.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Status)) e.Status = dto.Status.Trim();
        if (!string.IsNullOrWhiteSpace(dto.StartDate) && DateTime.TryParse(dto.StartDate, out var s)) e.StartDate = s;
        if (!string.IsNullOrWhiteSpace(dto.EndDate) && DateTime.TryParse(dto.EndDate, out var end)) e.EndDate = end;

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "School event updated successfully in database.", data = MapSchoolEventToDto(e) });
    }

    [HttpDelete("school-events/{id:int}")]
    public async Task<IActionResult> DeleteSchoolEvent(int id)
    {
        var e = await _context.SchoolEvents.FindAsync(id);
        if (e != null)
        {
            _context.SchoolEvents.Remove(e);
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "School event deleted successfully from database." });
    }

    // =========================================================
    // 5. HOLIDAY LIST REGISTER (PAGINATED & FILTERED)
    // =========================================================

    [HttpGet("holidays")]
    [HttpGet("/api/holidays")]
    public async Task<IActionResult> GetSchoolHolidays(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.HolidayCalendars.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("All", StringComparison.OrdinalIgnoreCase) && !type.Equals("All Types", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(h => h.Type != null && h.Type.ToLower() == type.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.ToLower().Trim();
            query = query.Where(h => h.Name.ToLower().Contains(s) || (h.Description != null && h.Description.ToLower().Contains(s)));
        }

        var list = await query.OrderBy(h => h.FromDate).ToListAsync();

        if (!list.Any() && string.IsNullOrWhiteSpace(search) && (string.IsNullOrWhiteSpace(type) || type.Equals("All", StringComparison.OrdinalIgnoreCase) || type.Equals("All Types", StringComparison.OrdinalIgnoreCase)))
        {
            await SeedDefaultHolidaysAndEventsAsync();
            list = await _context.HolidayCalendars.AsNoTracking().OrderBy(h => h.FromDate).ToListAsync();
        }

        var holidays = list.Select(MapHolidayToDto).ToList();

        var metrics = new HolidayDashboardMetricsDto
        {
            TotalHolidays = holidays.Count,
            NationalHolidays = holidays.Count(h => h.HolidayType.Equals("NATIONAL", StringComparison.OrdinalIgnoreCase)),
            GazettedHolidays = holidays.Count(h => h.HolidayType.Equals("GAZETTED", StringComparison.OrdinalIgnoreCase)),
            FestivalsBreaks = holidays.Count(h => h.HolidayType.Equals("FESTIVAL", StringComparison.OrdinalIgnoreCase) || h.HolidayType.Equals("VACATION", StringComparison.OrdinalIgnoreCase))
        };

        int totalCount = holidays.Count;
        int currentPage = page > 0 ? page : 1;
        int currentSize = pageSize > 0 ? pageSize : 10;

        var pagedData = holidays.Skip((currentPage - 1) * currentSize).Take(currentSize).ToList();

        return Ok(new
        {
            success = true,
            message = "Holidays retrieved successfully.",
            totalCount,
            totalEntries = totalCount,
            page = currentPage,
            pageSize = currentSize,
            totalPages = (int)Math.Ceiling((double)totalCount / currentSize),
            metrics = metrics,
            data = pagedData
        });
    }

    [HttpGet("holidays/{id:int}")]
    [HttpGet("/api/holidays/{id:int}")]
    public async Task<IActionResult> GetHolidayById(int id)
    {
        var h = await _context.HolidayCalendars.FindAsync(id);
        if (h == null) return NotFound(new { success = false, message = "Holiday not found." });

        return Ok(new { success = true, data = MapHolidayToDto(h) });
    }

    [HttpPost("holidays")]
    [HttpPost("/api/holidays")]
    public async Task<IActionResult> CreateHoliday([FromBody] CreateHolidayDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.HolidayName))
        {
            return BadRequest(new { success = false, message = "Holiday name is mandatory." });
        }

        DateTime sDate = DateTime.UtcNow;
        DateTime eDate = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dto.StartDate) && DateTime.TryParse(dto.StartDate, out var s)) sDate = s;
        if (!string.IsNullOrWhiteSpace(dto.EndDate) && DateTime.TryParse(dto.EndDate, out var end)) eDate = end;

        var entity = new HolidayCalendar
        {
            Name = dto.HolidayName.Trim(),
            Type = !string.IsNullOrWhiteSpace(dto.HolidayType) ? dto.HolidayType.Trim().ToUpper() : "GAZETTED",
            FromDate = sDate,
            ToDate = eDate,
            Description = dto.Description?.Trim() ?? "",
            ApplicableBranch = "Main Campus"
        };

        await _context.HolidayCalendars.AddAsync(entity);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Official holiday created successfully and saved to database.",
            data = MapHolidayToDto(entity)
        });
    }

    [HttpPut("holidays/{id:int}")]
    [HttpPut("/api/holidays/{id:int}")]
    public async Task<IActionResult> UpdateHoliday(int id, [FromBody] CreateHolidayDto dto)
    {
        var h = await _context.HolidayCalendars.FindAsync(id);
        if (h == null) return NotFound(new { success = false, message = "Holiday not found." });

        if (!string.IsNullOrWhiteSpace(dto.HolidayName)) h.Name = dto.HolidayName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.HolidayType)) h.Type = dto.HolidayType.Trim().ToUpper();
        if (!string.IsNullOrWhiteSpace(dto.Description)) h.Description = dto.Description.Trim();
        if (!string.IsNullOrWhiteSpace(dto.StartDate) && DateTime.TryParse(dto.StartDate, out var s)) h.FromDate = s;
        if (!string.IsNullOrWhiteSpace(dto.EndDate) && DateTime.TryParse(dto.EndDate, out var end)) h.ToDate = end;

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Holiday updated successfully in database.", data = MapHolidayToDto(h) });
    }

    [HttpDelete("holidays/{id:int}")]
    [HttpDelete("/api/holidays/{id:int}")]
    public async Task<IActionResult> DeleteHoliday(int id)
    {
        var h = await _context.HolidayCalendars.FindAsync(id);
        if (h != null)
        {
            _context.HolidayCalendars.Remove(h);
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Holiday deleted successfully from database." });
    }

    // =========================================================
    // SEEDER HELPER
    // =========================================================

    private async Task SeedDefaultHolidaysAndEventsAsync()
    {
        if (!await _context.HolidayCalendars.AnyAsync())
        {
            var seedHolidays = new List<HolidayCalendar>
            {
                new HolidayCalendar { Name = "Rakhi", Type = "NATIONAL", FromDate = new DateTime(2026, 08, 19), ToDate = new DateTime(2026, 08, 19), Description = "Government gazetted holiday", ApplicableBranch = "Main Campus" },
                new HolidayCalendar { Name = "Home sick Holidays", Type = "OPTIONAL", FromDate = new DateTime(2026, 08, 25), ToDate = new DateTime(2026, 08, 31), Description = "Only for Hostellers", ApplicableBranch = "Main Campus" },
                new HolidayCalendar { Name = "Independence Day", Type = "NATIONAL", FromDate = new DateTime(2026, 08, 15), ToDate = new DateTime(2026, 08, 15), Description = "National Holiday celebrating Indian Independence Day", ApplicableBranch = "Main Campus" },
                new HolidayCalendar { Name = "Raksha Bandhan", Type = "FESTIVAL", FromDate = new DateTime(2026, 08, 28), ToDate = new DateTime(2026, 08, 28), Description = "Traditional Festival Holiday", ApplicableBranch = "Main Campus" },
                new HolidayCalendar { Name = "Sri Krishna Janmashtami", Type = "FESTIVAL", FromDate = new DateTime(2026, 09, 04), ToDate = new DateTime(2026, 09, 04), Description = "Lord Krishna Jayanti Festival", ApplicableBranch = "Main Campus" }
            };
            await _context.HolidayCalendars.AddRangeAsync(seedHolidays);
        }

        if (!await _context.SchoolEvents.AnyAsync())
        {
            var seedEvents = new List<SchoolEvent>
            {
                new SchoolEvent { Title = "Annual Sports Day & Athletic Meet 2026", Category = "SPORTS DAY", Venue = "Main Campus Stadium Ground", StartDate = new DateTime(2026, 08, 15), EndDate = new DateTime(2026, 08, 15), Time = "08:30 AM", Organizer = "Physical Education Dept", Description = "Grand Annual Sports Day featuring track & field competitions.", Status = "Published", ApplicableBranch = "Main Campus" },
                new SchoolEvent { Title = "[Workshop] Robotics and AIML", Category = "WORKSHOP & SEMINAR", Venue = "Main Auditorium", StartDate = new DateTime(2026, 08, 19), EndDate = new DateTime(2026, 08, 19), Time = "All Day", Organizer = "External Expert (Pirnav Schools Professional Cell)", Description = "Faculty Development Program (FDP)", Status = "Published", ApplicableBranch = "Main Campus" },
                new SchoolEvent { Title = "Inter-House Science & Robotics Exhibition", Category = "SCIENCE EXHIBITION", Venue = "Auditorium & STEM Lab 1", StartDate = new DateTime(2026, 08, 22), EndDate = new DateTime(2026, 08, 22), Time = "10:00 AM", Organizer = "Department of Science & Tech", Description = "Student project showcases in AI and Robotics.", Status = "Published", ApplicableBranch = "Main Campus" }
            };
            await _context.SchoolEvents.AddRangeAsync(seedEvents);
        }

        await _context.SaveChangesAsync();
    }

    // --- MAPPER HELPERS ---
    private static SchoolHolidayDto MapHolidayToDto(HolidayCalendar h)
    {
        int days = Math.Max(1, (int)(h.ToDate - h.FromDate).TotalDays + 1);
        return new SchoolHolidayDto
        {
            HolidayId = h.HolidayId,
            HolidayName = h.Name ?? "",
            HolidayType = (h.Type ?? "GAZETTED").ToUpper(),
            StartDate = h.FromDate.ToString("yyyy-MM-dd"),
            EndDate = h.ToDate.ToString("yyyy-MM-dd"),
            Duration = days == 1 ? "1 Day" : $"{days} Days",
            DayOfWeek = h.FromDate.DayOfWeek.ToString(),
            Description = h.Description ?? ""
        };
    }

    private static SchoolEventDto MapSchoolEventToDto(SchoolEvent e) => new()
    {
        EventId = e.EventId,
        Title = e.Title ?? "",
        Category = (e.Category ?? "SPORTS DAY").ToUpper(),
        Venue = e.Venue ?? "Main Campus Stadium Ground",
        StartDate = e.StartDate.ToString("yyyy-MM-dd"),
        EndDate = e.EndDate.ToString("yyyy-MM-dd"),
        Time = e.Time ?? "08:30 AM",
        Organizer = e.Organizer ?? "Physical Education Dept",
        Description = e.Description ?? "",
        Status = e.Status ?? "Published",
        ApplicableBranch = e.ApplicableBranch ?? "Main Campus"
    };
}
