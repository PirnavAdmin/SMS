namespace SMS.Api.Controllers.TeacherScreens;

using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Helpers;
using SMS.Api.Services.Interfaces.TeacherScreens;

[ApiController]
[Route("api/v1/teacher/screens/personal")]
[Authorize(Roles = "Teacher")]
[Tags("Teacher Screens - Personal Information")]
public class TeacherPersonalController : ControllerBase
{
    private readonly ITeacherPersonalService _service;

    public TeacherPersonalController(ITeacherPersonalService service)
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
    /// GET /api/v1/teacher/screens/personal/me - Get Personal Information of authenticated teacher.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyPersonalInfo()
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var personalInfo = await _service.GetPersonalInfoAsync(staffId.Value);
        if (personalInfo == null)
        {
            return NotFound(new { success = false, message = "Personal information record not found." });
        }

        return Ok(new { success = true, data = personalInfo });
    }

    /// <summary>
    /// POST /api/v1/teacher/screens/personal/me - Create or initialize Personal Information for authenticated teacher.
    /// </summary>
    [HttpPost("me")]
    public async Task<IActionResult> CreateMyPersonalInfo([FromBody] CreateTeacherPersonalInfoDto dto)
    {
        if (dto == null || !ModelState.IsValid)
        {
            return BadRequest(new { success = false, message = "Invalid request payload.", errors = ModelState });
        }

        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var created = await _service.CreatePersonalInfoAsync(staffId.Value, dto);
        if (created == null)
        {
            return BadRequest(new { success = false, message = "Failed to create personal information record." });
        }

        return CreatedAtAction(nameof(GetMyPersonalInfo), new { success = true, message = "Personal information created successfully.", data = created });
    }

    /// <summary>
    /// PUT /api/v1/teacher/screens/personal/me - Update Personal Information for authenticated teacher.
    /// </summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyPersonalInfo([FromBody] UpdateTeacherPersonalInfoDto dto)
    {
        if (dto == null)
        {
            return BadRequest(new { success = false, message = "Invalid request payload." });
        }

        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var updated = await _service.UpdatePersonalInfoAsync(staffId.Value, dto);
        if (updated == null)
        {
            return NotFound(new { success = false, message = "Teacher personal information record not found or inactive." });
        }

        return Ok(new { success = true, message = "Personal information updated successfully.", data = updated });
    }

    /// <summary>
    /// DELETE /api/v1/teacher/screens/personal/me - Reset optional personal fields for authenticated teacher.
    /// </summary>
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMyPersonalInfo()
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var deleted = await _service.DeletePersonalInfoAsync(staffId.Value);
        if (!deleted)
        {
            return NotFound(new { success = false, message = "Teacher personal information record not found." });
        }

        return Ok(new { success = true, message = "Personal information optional fields cleared successfully." });
    }
}
