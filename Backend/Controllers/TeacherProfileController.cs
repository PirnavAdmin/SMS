using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Teacher;
using SMS.Api.Helpers;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers;

[ApiController]
[Route("api/v1/teacher/profile")]
[Authorize(Roles = "Teacher")]
[Tags("Teacher Self Profile")]
public class TeacherProfileController : ControllerBase
{
    private readonly ITeacherProfileService _profileService;

    public TeacherProfileController(ITeacherProfileService profileService)
    {
        _profileService = profileService;
    }

    private async Task<int?> GetLoggedInStaffIdAsync()
    {
        // 1. Try reading StaffId directly from JWT ClaimsPrincipal
        var staffId = User.GetStaffId();
        if (staffId.HasValue && staffId.Value > 0)
        {
            return staffId;
        }

        // 2. Resolve securely via UserId or Email from ClaimsPrincipal
        var userId = User.GetUserId();
        var email = User.GetEmail();
        return await _profileService.ResolveStaffIdAsync(userId, email);
    }

    /// <summary>
    /// GET /api/v1/teacher/profile/me - Returns authenticated teacher's own profile only.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Active teacher staff profile not found for authenticated account." });
        }

        var profile = await _profileService.GetMyProfileAsync(staffId.Value);
        if (profile == null)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found." });
        }

        return Ok(new { success = true, data = profile });
    }

    /// <summary>
    /// PUT /api/v1/teacher/profile/me - Updates permitted personal fields of authenticated teacher's own profile.
    /// </summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyTeacherProfileDto dto)
    {
        if (dto == null)
        {
            return BadRequest(new { success = false, message = "Invalid request payload." });
        }

        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Active teacher staff profile not found for authenticated account." });
        }

        var success = await _profileService.UpdateMyProfileAsync(staffId.Value, dto);
        if (!success)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found or inactive." });
        }

        var updatedProfile = await _profileService.GetMyProfileAsync(staffId.Value);
        return Ok(new
        {
            success = true,
            message = "Teacher profile updated successfully.",
            data = updatedProfile
        });
    }

    /// <summary>
    /// GET /api/v1/teacher/profile/me/assignments - Returns assigned classes, sections, and subjects for authenticated teacher.
    /// </summary>
    [HttpGet("me/assignments")]
    public async Task<IActionResult> GetMyAssignments([FromQuery] string? academicYear)
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Active teacher staff profile not found for authenticated account." });
        }

        var assignments = await _profileService.GetMyAssignmentsAsync(staffId.Value, academicYear);
        return Ok(new { success = true, data = assignments });
    }
}
