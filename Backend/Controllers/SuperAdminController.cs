using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Dtos.Auth;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers;

[ApiController]
[Route("api/superadmin")]
public class SuperAdminController : ControllerBase
{
    private readonly ISuperAdminService _saService;

    public SuperAdminController(ISuperAdminService saService)
    {
        _saService = saService;
    }

    // =========================================================
    // 1. AUTHENTICATION ENDPOINTS
    // =========================================================

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _saService.SuperAdminLoginAsync(dto);
        return Ok(result);
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] TokenRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token)) return BadRequest("Token is required.");
        var result = await _saService.RefreshTokenAsync(dto.Token);
        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var userId = GetCurrentUserId();
        await _saService.LogoutAsync(userId);
        return Ok(new { message = "Logged out successfully." });
    }

    [HttpGet("current-user")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        var name = User.FindFirst(ClaimTypes.Name)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var mobile = User.FindFirst(ClaimTypes.MobilePhone)?.Value;
        var schoolIdStr = User.FindFirst("schoolId")?.Value;
        
        var roles = new List<string>();
        foreach (var claim in User.FindAll(ClaimTypes.Role))
        {
            roles.Add(claim.Value);
        }

        return Ok(new
        {
            userId,
            fullName = name,
            email,
            mobileNumber = mobile,
            schoolId = string.IsNullOrEmpty(schoolIdStr) ? null : (int?)int.Parse(schoolIdStr),
            roles
        });
    }

    // =========================================================
    // 2. DASHBOARD ENDPOINTS
    // =========================================================

    [HttpGet("dashboard/summary")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<SuperAdminDashboardSummaryDto>> GetDashboardSummary()
    {
        var summary = await _saService.GetDashboardSummaryAsync();
        return Ok(summary);
    }

    // =========================================================
    // 3. SCHOOL MANAGEMENT ENDPOINTS
    // =========================================================

    [HttpGet("schools")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<List<SchoolResponseDto>>> GetAllSchools([FromQuery] string? search)
    {
        var schools = await _saService.GetAllSchoolsAsync(search);
        return Ok(schools);
    }

    [HttpGet("schools/{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<SchoolResponseDto>> GetSchoolById(int id)
    {
        var school = await _saService.GetSchoolByIdAsync(id);
        return Ok(school);
    }

    [HttpPost("schools")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<SchoolResponseDto>> CreateSchool([FromBody] SchoolCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userId = GetCurrentUserId();
        var school = await _saService.CreateSchoolAsync(dto, userId);
        return CreatedAtAction(nameof(GetSchoolById), new { id = school.SchoolId }, school);
    }

    [HttpPut("schools/{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<SchoolResponseDto>> UpdateSchool(int id, [FromBody] SchoolUpdateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userId = GetCurrentUserId();
        var school = await _saService.UpdateSchoolAsync(id, dto, userId);
        return Ok(school);
    }

    [HttpDelete("schools/{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> DeleteSchool(int id)
    {
        var userId = GetCurrentUserId();
        await _saService.DeleteSchoolAsync(id, userId);
        return NoContent();
    }

    [HttpPatch("schools/{id:int}/status")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<SchoolResponseDto>> ToggleSchoolStatus(int id, [FromQuery] string status)
    {
        if (string.IsNullOrWhiteSpace(status)) return BadRequest("Status is required.");
        if (status != "Active" && status != "Inactive") return BadRequest("Invalid status. Allowed values are: Active, Inactive.");
        
        var userId = GetCurrentUserId();
        var school = await _saService.ToggleSchoolStatusAsync(id, status, userId);
        return Ok(school);
    }

    [HttpGet("schools/{id:int}/users-summary")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<SchoolUsersSummaryDto>> GetSchoolUsersSummary(int id)
    {
        var summary = await _saService.GetSchoolUsersSummaryAsync(id);
        return Ok(summary);
    }

    // =========================================================
    // 4. ADMIN MANAGEMENT ENDPOINTS
    // =========================================================

    [HttpGet("admins")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<List<AdminResponseDto>>> GetAdmins([FromQuery] string? search)
    {
        var admins = await _saService.GetAdminsAsync(search);
        return Ok(admins);
    }

    [HttpPost("admins")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<AdminResponseDto>> CreateAdmin([FromBody] AdminCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userId = GetCurrentUserId();
        var admin = await _saService.CreateAdminAsync(dto, userId);
        return Ok(admin);
    }

    [HttpPut("admins/{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<AdminResponseDto>> UpdateAdmin(int id, [FromBody] AdminUpdateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userId = GetCurrentUserId();
        var admin = await _saService.UpdateAdminAsync(id, dto, userId);
        return Ok(admin);
    }

    [HttpPost("admins/{id:int}/reset-password")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ResetAdminPassword(int id, [FromBody] ResetPasswordBodyDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword)) return BadRequest("New password is required.");
        if (dto.NewPassword.Length < 6) return BadRequest("Password must be at least 6 characters.");
        
        var userId = GetCurrentUserId();
        await _saService.ResetAdminPasswordAsync(id, dto.NewPassword, userId);
        return Ok(new { message = "Admin password has been reset successfully." });
    }

    // =========================================================
    // 5. STATISTICS & AUDIT MONITORING ENDPOINTS
    // =========================================================

    [HttpGet("statistics/users")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<UserStatisticsDto>> GetUserStatistics()
    {
        var stats = await _saService.GetUserStatisticsAsync();
        return Ok(stats);
    }

    [HttpGet("audit-logs")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<List<AuditLogResponseDto>>> GetAuditLogs([FromQuery] int? schoolId, [FromQuery] int limit = 100)
    {
        var logs = await _saService.GetAuditLogsAsync(schoolId, limit);
        return Ok(logs);
    }

    [HttpGet("notifications")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<List<SystemNotificationResponseDto>>> GetNotifications([FromQuery] int? schoolId)
    {
        var notifications = await _saService.GetNotificationsAsync(schoolId);
        return Ok(notifications);
    }

    // =========================================================
    // HELPER METHODS
    // =========================================================

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && int.TryParse(claim.Value, out var userId) ? userId : 0;
    }
}

// Helper inline records for simple request models
public record TokenRequestDto(string Token);
public record ResetPasswordBodyDto(string NewPassword);
