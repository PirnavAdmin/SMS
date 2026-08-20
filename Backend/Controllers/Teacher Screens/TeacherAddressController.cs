namespace SMS.Api.Controllers.TeacherScreens;

using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Helpers;
using SMS.Api.Services.Interfaces.TeacherScreens;

[ApiController]
[Route("api/v1/teacher/screens/address")]
[Authorize(Roles = "Teacher")]
[Tags("Teacher Screens - Address Information")]
public class TeacherAddressController : ControllerBase
{
    private readonly ITeacherAddressService _service;

    public TeacherAddressController(ITeacherAddressService service)
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
    /// GET /api/v1/teacher/screens/address/me - Get Address Information of authenticated teacher.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyAddressInfo()
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var addressInfo = await _service.GetAddressAsync(staffId.Value);
        if (addressInfo == null)
        {
            return NotFound(new { success = false, message = "Address information record not found." });
        }

        return Ok(new { success = true, data = addressInfo });
    }

    /// <summary>
    /// POST /api/v1/teacher/screens/address/me - Create or initialize Address Information for authenticated teacher.
    /// </summary>
    [HttpPost("me")]
    public async Task<IActionResult> CreateMyAddressInfo([FromBody] CreateTeacherAddressDto dto)
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

        var created = await _service.CreateAddressAsync(staffId.Value, dto);
        if (created == null)
        {
            return BadRequest(new { success = false, message = "Failed to create address information record." });
        }

        return CreatedAtAction(nameof(GetMyAddressInfo), new { success = true, message = "Address information created successfully.", data = created });
    }

    /// <summary>
    /// PUT /api/v1/teacher/screens/address/me - Update Address Information for authenticated teacher.
    /// </summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyAddressInfo([FromBody] UpdateTeacherAddressDto dto)
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

        var updated = await _service.UpdateAddressAsync(staffId.Value, dto);
        if (updated == null)
        {
            return NotFound(new { success = false, message = "Teacher address information record not found or inactive." });
        }

        return Ok(new { success = true, message = "Address information updated successfully.", data = updated });
    }

    /// <summary>
    /// DELETE /api/v1/teacher/screens/address/me - Clear address fields for authenticated teacher.
    /// </summary>
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMyAddressInfo()
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var deleted = await _service.DeleteAddressAsync(staffId.Value);
        if (!deleted)
        {
            return NotFound(new { success = false, message = "Teacher address information record not found." });
        }

        return Ok(new { success = true, message = "Address information cleared successfully." });
    }
}
