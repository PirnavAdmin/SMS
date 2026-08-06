namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;

[ApiController]
[Route("api/events")]
[Authorize]
[Tags("Events & Holidays Calendar")]
public class EventsController : ControllerBase
{
    private readonly IEventsService _eventsService;

    public EventsController(IEventsService eventsService)
    {
        _eventsService = eventsService;
    }

    /// <summary>
    /// Get dropdown options and category legends for Events & Holidays
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetEventsOptions()
    {
        var result = await _eventsService.GetEventsOptionsAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get monthly calendar grid events (Calendar Sub-Tab)
    /// </summary>
    [HttpGet("calendar")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetCalendarEvents(
        [FromQuery] int? month = 7,
        [FromQuery] int? year = 2026,
        [FromQuery] string? academicYear = "2027-28")
    {
        var result = await _eventsService.GetCalendarEventsAsync(month, year, academicYear);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get upcoming schedules / comprehensive academic calendar agenda list (Upcoming Schedules View)
    /// </summary>
    [HttpGet("upcoming")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetUpcomingEvents(
        [FromQuery] string? search = null,
        [FromQuery] string? date = null,
        [FromQuery] string? category = "All",
        [FromQuery] string? academicYear = "2027-28")
    {
        var result = await _eventsService.GetUpcomingEventsAsync(search, date, category, academicYear);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get official school holidays list (Holidays Sub-Tab)
    /// </summary>
    [HttpGet("holidays")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetSchoolHolidays([FromQuery] string? academicYear = "2027-28")
    {
        var result = await _eventsService.GetSchoolHolidaysAsync(academicYear);
        return Ok(new { success = true, data = result });
    }
}
