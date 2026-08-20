namespace SMS.Api.Controllers.TeacherScreens;

using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Helpers;
using SMS.Api.Services.Interfaces.TeacherScreens;

[ApiController]
[Route("api/v1/teacher/screens/review")]
[Authorize(Roles = "Teacher")]
[Tags("Teacher Screens - Review & Submit")]
public class TeacherReviewController : ControllerBase
{
    private readonly ITeacherReviewService _service;

    public TeacherReviewController(ITeacherReviewService service)
    {
        _service = service;
    }

    private async Task<int?> GetLoggedInStaffIdAsync()
    {
        var staffId = User.GetStaffId();
        if (staffId.HasValue && staffId.Value > 0)
        {
            return staffId;
        }

        var userId = User.GetUserId();
        var email = User.GetEmail();
        return await _service.ResolveStaffIdAsync(userId, email);
    }

    /// <summary>
    /// GET /api/v1/teacher/screens/review/me - Get full profile review summary (Personal, Address, Education, Experience, Bank, Documents).
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyReviewSummary()
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var summary = await _service.GetReviewSummaryAsync(staffId.Value);
        if (summary == null)
        {
            return NotFound(new { success = false, message = "Teacher review summary record not found." });
        }

        return Ok(new { success = true, data = summary });
    }

    /// <summary>
    /// POST /api/v1/teacher/screens/review/submit - Submit final teacher profile wizard (Submit Profile button).
    /// </summary>
    [HttpPost("submit")]
    public async Task<IActionResult> SubmitMyProfile([FromBody] SubmitTeacherProfileDto dto)
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var result = await _service.SubmitProfileAsync(staffId.Value, dto ?? new SubmitTeacherProfileDto());
        if (!result.Success)
        {
            return BadRequest(new { success = false, message = result.Message, data = result });
        }

        return Ok(new { success = true, message = result.Message, data = result });
    }
}
