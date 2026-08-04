namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;

[ApiController]
[Route("api/staff/attendance")]
[Authorize(Roles = "Admin")]
[Tags("Staff Attendance Management")]
public class StaffAttendanceController : ControllerBase
{
    private readonly ISchoolService _schoolService;

    public StaffAttendanceController(ISchoolService schoolService)
    {
        _schoolService = schoolService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDailyAttendance([FromQuery] string date, [FromQuery] string? department) =>
        Ok(new { success = true, data = await _schoolService.GetDailyAttendanceAsync(date, department) });

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthlyAttendance([FromQuery] int month, [FromQuery] int year, [FromQuery] string? department) =>
        Ok(new { success = true, data = await _schoolService.GetMonthlyAttendanceAsync(month, year, department) });

    [HttpGet("summary")]
    public async Task<IActionResult> GetDailyAttendanceSummary([FromQuery] string date, [FromQuery] string? department) =>
        Ok(new { success = true, data = await _schoolService.GetDailyAttendanceSummaryAsync(date, department) });

    [HttpPost("bulk")]
    public async Task<IActionResult> SaveBulkAttendance([FromBody] BulkAttendanceDto dto)
    {
        await _schoolService.SaveBulkAttendanceAsync(dto);
        return Ok(new { success = true, message = "Staff attendance saved successfully." });
    }
}
