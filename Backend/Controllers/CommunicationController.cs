namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;

[ApiController]
[Route("api/communications")]
[Authorize]
[Tags("Communication Hub & Meetings")]
public class CommunicationController : ControllerBase
{
    private readonly ICommunicationService _communicationService;

    public CommunicationController(ICommunicationService communicationService)
    {
        _communicationService = communicationService;
    }

    /// <summary>
    /// Get dropdown options for Academic Years, Audiences, Modes, and Statuses in Communication Hub
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetCommunicationOptions()
    {
        var result = await _communicationService.GetCommunicationOptionsAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Broadcast Notifications list (Broadcast Notifications Sub-Tab)
    /// </summary>
    [HttpGet("notifications")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetBroadcastNotifications(
        [FromQuery] string? academicYear = "2027-28",
        [FromQuery] string? category = "All")
    {
        var result = await _communicationService.GetBroadcastNotificationsAsync(academicYear, category);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Meetings and Schedules list with Audience, Mode, Status, and Search filters (Meetings & Schedules Sub-Tab)
    /// </summary>
    [HttpGet("meetings")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetMeetings(
        [FromQuery] string? audience = "All Audiences",
        [FromQuery] string? mode = "All Modes",
        [FromQuery] string? status = "All Statuses",
        [FromQuery] string? search = null,
        [FromQuery] string? academicYear = "2027-28")
    {
        var result = await _communicationService.GetMeetingsAsync(audience, mode, status, search, academicYear);
        return Ok(new { success = true, data = result });
    }
}
