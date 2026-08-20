namespace SMS.Api.Controllers.TeacherScreens;

using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Helpers;
using SMS.Api.Services.Interfaces.TeacherScreens;

[ApiController]
[Route("api/v1/teacher/screens/bank")]
[Authorize(Roles = "Teacher")]
[Tags("Teacher Screens - Bank Details")]
public class TeacherBankController : ControllerBase
{
    private readonly ITeacherBankService _service;

    public TeacherBankController(ITeacherBankService service)
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
    /// GET /api/v1/teacher/screens/bank/me - Get Bank Details of authenticated teacher.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyBankDetails()
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var bankDetails = await _service.GetBankDetailsAsync(staffId.Value);
        if (bankDetails == null)
        {
            return NotFound(new { success = false, message = "Bank details record not found." });
        }

        return Ok(new { success = true, data = bankDetails });
    }

    /// <summary>
    /// POST /api/v1/teacher/screens/bank/me - Create or initialize Bank Details for authenticated teacher.
    /// </summary>
    [HttpPost("me")]
    public async Task<IActionResult> CreateMyBankDetails([FromBody] CreateTeacherBankDto dto)
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

        var created = await _service.CreateBankDetailsAsync(staffId.Value, dto);
        if (created == null)
        {
            return BadRequest(new { success = false, message = "Failed to create bank details record." });
        }

        return CreatedAtAction(nameof(GetMyBankDetails), new { success = true, message = "Bank details created successfully.", data = created });
    }

    /// <summary>
    /// PUT /api/v1/teacher/screens/bank/me - Update Bank Details for authenticated teacher.
    /// </summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyBankDetails([FromBody] UpdateTeacherBankDto dto)
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

        var updated = await _service.UpdateBankDetailsAsync(staffId.Value, dto);
        if (updated == null)
        {
            return NotFound(new { success = false, message = "Teacher bank details record not found or inactive." });
        }

        return Ok(new { success = true, message = "Bank details updated successfully.", data = updated });
    }

    /// <summary>
    /// DELETE /api/v1/teacher/screens/bank/me - Clear bank details fields for authenticated teacher.
    /// </summary>
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMyBankDetails()
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var deleted = await _service.DeleteBankDetailsAsync(staffId.Value);
        if (!deleted)
        {
            return NotFound(new { success = false, message = "Teacher bank details record not found." });
        }

        return Ok(new { success = true, message = "Bank details cleared successfully." });
    }
}
