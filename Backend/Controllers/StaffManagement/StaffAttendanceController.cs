namespace SMS.Api.Controllers.StaffManagement;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces.StaffManagement;
using System.Threading.Tasks;

[ApiController]
[Route("api/staff/attendance")]
[Authorize(Roles = "Admin,Teacher")]
[Tags("Staff Attendance Management")]
public class StaffAttendanceController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffAttendanceController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDailyAttendance([FromQuery] string date, [FromQuery] string? department) =>
        Ok(new { success = true, data = await _staffService.GetDailyAttendanceAsync(date, department) });

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthlyAttendance([FromQuery] int month, [FromQuery] int year, [FromQuery] string? department) =>
        Ok(new { success = true, data = await _staffService.GetMonthlyAttendanceAsync(month, year, department) });

    [HttpGet("summary")]
    public async Task<IActionResult> GetDailyAttendanceSummary([FromQuery] string date, [FromQuery] string? department) =>
        Ok(new { success = true, data = await _staffService.GetDailyAttendanceSummaryAsync(date, department) });

    [HttpPost("bulk")]
    public async Task<IActionResult> SaveBulkAttendance([FromBody] BulkAttendanceDto dto)
    {
        await _staffService.SaveBulkAttendanceAsync(dto);
        return Ok(new { success = true, message = "Staff attendance saved successfully." });
    }
}

