namespace SMS.Api.Controllers.TeacherScreens;

using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Helpers;
using SMS.Api.Services.Interfaces.TeacherScreens;

[ApiController]
[Route("api/v1/teacher/screens/education")]
[Authorize(Roles = "Teacher")]
[Tags("Teacher Screens - Education & Qualifications")]
public class TeacherEducationController : ControllerBase
{
    private readonly ITeacherEducationService _service;

    public TeacherEducationController(ITeacherEducationService service)
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
    /// GET /api/v1/teacher/screens/education/me - Get all qualification records of authenticated teacher.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyQualifications()
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var qualifications = await _service.GetQualificationsAsync(staffId.Value);
        return Ok(new { success = true, count = qualifications.Count, data = qualifications });
    }

    /// <summary>
    /// POST /api/v1/teacher/screens/education/me - Add a new qualification record (+ Add Qualification button).
    /// </summary>
    [HttpPost("me")]
    public async Task<IActionResult> AddMyQualification([FromBody] CreateTeacherEducationDto dto)
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

        var created = await _service.AddQualificationAsync(staffId.Value, dto);
        if (created == null)
        {
            return BadRequest(new { success = false, message = "Failed to add qualification record." });
        }

        return CreatedAtAction(nameof(GetMyQualifications), new { success = true, message = "Qualification added successfully.", data = created });
    }

    /// <summary>
    /// PUT /api/v1/teacher/screens/education/me - Bulk update / replace all qualifications for authenticated teacher.
    /// </summary>
    [HttpPut("me")]
    public async Task<IActionResult> BulkUpdateMyQualifications([FromBody] BulkUpdateTeacherEducationDto dto)
    {
        if (dto == null || dto.Qualifications == null)
        {
            return BadRequest(new { success = false, message = "Invalid request payload." });
        }

        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var updatedList = await _service.BulkUpdateQualificationsAsync(staffId.Value, dto.Qualifications);
        return Ok(new { success = true, message = "Qualifications list updated successfully.", count = updatedList.Count, data = updatedList });
    }

    /// <summary>
    /// PUT /api/v1/teacher/screens/education/me/{id} - Update a specific qualification record by ID.
    /// </summary>
    [HttpPut("me/{id:int}")]
    public async Task<IActionResult> UpdateMyQualification(int id, [FromBody] UpdateTeacherEducationDto dto)
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

        var updated = await _service.UpdateQualificationAsync(staffId.Value, id, dto);
        if (updated == null)
        {
            return NotFound(new { success = false, message = "Qualification record not found or unauthorized." });
        }

        return Ok(new { success = true, message = "Qualification record updated successfully.", data = updated });
    }

    /// <summary>
    /// DELETE /api/v1/teacher/screens/education/me/{id} - Delete a specific qualification record by ID (Remove button).
    /// </summary>
    [HttpDelete("me/{id:int}")]
    public async Task<IActionResult> DeleteMyQualification(int id)
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var deleted = await _service.DeleteQualificationAsync(staffId.Value, id);
        if (!deleted)
        {
            return NotFound(new { success = false, message = "Qualification record not found." });
        }

        return Ok(new { success = true, message = "Qualification record deleted successfully." });
    }
}
