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
[Route("api/academic-calendar")]
[AllowAnonymous]
[Tags("Academic Calendar & Events")]
public class AcademicCalendarController : ControllerBase
{
    private readonly AppDbContext _context;

    public AcademicCalendarController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        int eventsCount = await _context.SchoolEvents.CountAsync();
        int holidaysCount = await _context.HolidayCalendars.CountAsync();

        var summary = new CalendarDashboardSummaryDto
        {
            TotalAcademicEvents = eventsCount + holidaysCount,
            GazettedSchoolHolidays = holidaysCount,
            PublishedSchoolEvents = eventsCount,
            BirthdayRadarCount = 1
        };

        return Ok(new { success = true, data = summary });
    }

    [HttpGet("events")]
    public async Task<IActionResult> GetAllEvents([FromQuery] string? category, [FromQuery] string? search)
    {
        var query = _context.SchoolEvents.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All Categories", StringComparison.OrdinalIgnoreCase) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(e => e.Category != null && e.Category.ToLower() == category.ToLower());

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.ToLower().Trim();
            query = query.Where(e => e.Title.ToLower().Contains(s) || (e.Description != null && e.Description.ToLower().Contains(s)));
        }

        var list = await query.OrderBy(e => e.StartDate).ToListAsync();

        var result = list.Select(e => new SchoolEventDto
        {
            EventId = e.EventId,
            Title = e.Title,
            Category = e.Category,
            Venue = e.Venue,
            StartDate = e.StartDate.ToString("yyyy-MM-dd"),
            EndDate = e.EndDate.ToString("yyyy-MM-dd"),
            Time = e.Time,
            Organizer = e.Organizer,
            Description = e.Description,
            Status = e.Status,
            ApplicableBranch = e.ApplicableBranch
        }).ToList();

        return Ok(new { success = true, data = result });
    }

    [HttpGet("events/{id:int}")]
    public async Task<IActionResult> GetEventById(int id)
    {
        var e = await _context.SchoolEvents.FindAsync(id);
        if (e == null) return NotFound(new { success = false, message = "Academic event not found." });

        var dto = new SchoolEventDto
        {
            EventId = e.EventId,
            Title = e.Title,
            Category = e.Category,
            Venue = e.Venue,
            StartDate = e.StartDate.ToString("yyyy-MM-dd"),
            EndDate = e.EndDate.ToString("yyyy-MM-dd"),
            Time = e.Time,
            Organizer = e.Organizer,
            Description = e.Description,
            Status = e.Status,
            ApplicableBranch = e.ApplicableBranch
        };

        return Ok(new { success = true, data = dto });
    }

    [HttpPost("events")]
    public async Task<IActionResult> CreateEvent([FromBody] SchoolEventDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) && string.IsNullOrWhiteSpace(dto.EventName))
        {
            return BadRequest(new { success = false, message = "Event title is mandatory." });
        }

        DateTime sDate = DateTime.TryParse(dto.StartDate, out var s) ? s : DateTime.UtcNow;
        DateTime eDate = DateTime.TryParse(dto.EndDate, out var e) ? e : sDate;

        var entity = new SchoolEvent
        {
            Title = !string.IsNullOrWhiteSpace(dto.Title) ? dto.Title.Trim() : dto.EventName!.Trim(),
            Category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category.Trim() : "Sports Day",
            Venue = !string.IsNullOrWhiteSpace(dto.Venue) ? dto.Venue.Trim() : "Main Auditorium",
            StartDate = sDate,
            EndDate = eDate,
            Time = !string.IsNullOrWhiteSpace(dto.Time) ? dto.Time.Trim() : "08:30 AM",
            Organizer = !string.IsNullOrWhiteSpace(dto.Organizer) ? dto.Organizer.Trim() : "School Administration",
            Description = dto.Description?.Trim(),
            Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status.Trim() : "Published",
            ApplicableBranch = !string.IsNullOrWhiteSpace(dto.ApplicableBranch) ? dto.ApplicableBranch.Trim() : "Main Campus"
        };

        await _context.SchoolEvents.AddAsync(entity);
        await _context.SaveChangesAsync();

        dto.EventId = entity.EventId;
        return Ok(new { success = true, message = "Academic event created successfully.", data = dto });
    }

    [HttpPut("events/{id:int}")]
    public async Task<IActionResult> UpdateEvent(int id, [FromBody] SchoolEventDto dto)
    {
        var entity = await _context.SchoolEvents.FindAsync(id);
        if (entity == null) return NotFound(new { success = false, message = "Academic event not found." });

        if (!string.IsNullOrWhiteSpace(dto.Title)) entity.Title = dto.Title.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Category)) entity.Category = dto.Category.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Venue)) entity.Venue = dto.Venue.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Time)) entity.Time = dto.Time.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Organizer)) entity.Organizer = dto.Organizer.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Description)) entity.Description = dto.Description.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Status)) entity.Status = dto.Status.Trim();
        if (!string.IsNullOrWhiteSpace(dto.ApplicableBranch)) entity.ApplicableBranch = dto.ApplicableBranch.Trim();
        if (DateTime.TryParse(dto.StartDate, out var s)) entity.StartDate = s;
        if (DateTime.TryParse(dto.EndDate, out var e)) entity.EndDate = e;

        await _context.SaveChangesAsync();
        dto.EventId = entity.EventId;
        return Ok(new { success = true, message = "Academic event updated successfully in database.", data = dto });
    }

    [HttpDelete("events/{id:int}")]
    public async Task<IActionResult> DeleteEvent(int id)
    {
        var entity = await _context.SchoolEvents.FindAsync(id);
        if (entity != null)
        {
            _context.SchoolEvents.Remove(entity);
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Academic event deleted successfully from database." });
    }

    [HttpGet("birthdays")]
    public IActionResult GetBirthdayRadar()
    {
        var list = new List<BirthdayRadarDto>
        {
            new BirthdayRadarDto
            {
                PersonName = "Alexander Wright",
                PersonType = "Student",
                ClassOrDepartment = "Class 10-A",
                DateOfBirth = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                IsToday = true
            }
        };

        return Ok(new { success = true, data = list });
    }
}
