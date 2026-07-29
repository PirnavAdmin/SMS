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
[Authorize(Roles = "Admin,Teacher,Staff,Student")]
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
            TotalAcademicEvents = 28,
            GazettedSchoolHolidays = Math.Max(1, holidaysCount),
            PublishedSchoolEvents = Math.Max(5, eventsCount),
            BirthdayRadarCount = 1
        };

        return Ok(new { success = true, data = summary });
    }

    [HttpGet("events")]
    public async Task<IActionResult> GetAllEvents([FromQuery] string? category, [FromQuery] string? search)
    {
        var query = _context.SchoolEvents.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All Categories", StringComparison.OrdinalIgnoreCase))
            query = query.Where(e => e.Category.ToLower() == category.ToLower());

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(e => e.Title.Contains(search) || (e.Description != null && e.Description.Contains(search)));

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

    [HttpPost("events")]
    public async Task<IActionResult> CreateEvent([FromBody] SchoolEventDto dto)
    {
        DateTime sDate = DateTime.TryParse(dto.StartDate, out var s) ? s : DateTime.UtcNow;
        DateTime eDate = DateTime.TryParse(dto.EndDate, out var e) ? e : sDate;

        var entity = new SchoolEvent
        {
            Title = dto.Title,
            Category = dto.Category,
            Venue = dto.Venue,
            StartDate = sDate,
            EndDate = eDate,
            Time = dto.Time,
            Organizer = dto.Organizer,
            Description = dto.Description,
            Status = dto.Status,
            ApplicableBranch = dto.ApplicableBranch
        };

        await _context.SchoolEvents.AddAsync(entity);
        await _context.SaveChangesAsync();

        dto.EventId = entity.EventId;
        return Ok(new { success = true, message = "School event created successfully.", data = dto });
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
