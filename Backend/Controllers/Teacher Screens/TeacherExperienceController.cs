namespace SMS.Api.Controllers.TeacherScreens;

using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Helpers;
using SMS.Api.Services.Interfaces.TeacherScreens;

[ApiController]
[Route("api/v1/teacher/screens/experience")]
[Authorize(Roles = "Teacher")]
[Tags("Teacher Screens - Experience Records")]
public class TeacherExperienceController : ControllerBase
{
    private readonly ITeacherExperienceService _service;

    public TeacherExperienceController(ITeacherExperienceService service)
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
    /// GET /api/v1/teacher/screens/experience/me - Get all experience records of authenticated teacher.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyExperiences()
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var experiences = await _service.GetExperiencesAsync(staffId.Value);
        return Ok(new { success = true, count = experiences.Count, data = experiences });
    }

    /// <summary>
    /// POST /api/v1/teacher/screens/experience/me - Add a new experience record (+ Add Experience button).
    /// </summary>
    [HttpPost("me")]
    public async Task<IActionResult> AddMyExperience([FromBody] CreateTeacherExperienceDto dto)
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

        var created = await _service.AddExperienceAsync(staffId.Value, dto);
        if (created == null)
        {
            return BadRequest(new { success = false, message = "Failed to add experience record." });
        }

        return CreatedAtAction(nameof(GetMyExperiences), new { success = true, message = "Experience record added successfully.", data = created });
    }

    /// <summary>
    /// PUT /api/v1/teacher/screens/experience/me - Bulk update / replace all experience records for authenticated teacher.
    /// </summary>
    [HttpPut("me")]
    public async Task<IActionResult> BulkUpdateMyExperiences([FromBody] BulkUpdateTeacherExperienceDto dto)
    {
        if (dto == null || dto.Experiences == null)
        {
            return BadRequest(new { success = false, message = "Invalid request payload." });
        }

        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var updatedList = await _service.BulkUpdateExperiencesAsync(staffId.Value, dto.Experiences);
        return Ok(new { success = true, message = "Experience records list updated successfully.", count = updatedList.Count, data = updatedList });
    }

    /// <summary>
    /// PUT /api/v1/teacher/screens/experience/me/{id} - Update a specific experience record by ID.
    /// </summary>
    [HttpPut("me/{id:int}")]
    public async Task<IActionResult> UpdateMyExperience(int id, [FromBody] UpdateTeacherExperienceDto dto)
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

        var updated = await _service.UpdateExperienceAsync(staffId.Value, id, dto);
        if (updated == null)
        {
            return NotFound(new { success = false, message = "Experience record not found or unauthorized." });
        }

        return Ok(new { success = true, message = "Experience record updated successfully.", data = updated });
    }

    /// <summary>
    /// DELETE /api/v1/teacher/screens/experience/me/{id} - Delete a specific experience record by ID (Remove button).
    /// </summary>
    [HttpDelete("me/{id:int}")]
    public async Task<IActionResult> DeleteMyExperience(int id)
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var deleted = await _service.DeleteExperienceAsync(staffId.Value, id);
        if (!deleted)
        {
            return NotFound(new { success = false, message = "Experience record not found." });
        }

        return Ok(new { success = true, message = "Experience record deleted successfully." });
    }
}
