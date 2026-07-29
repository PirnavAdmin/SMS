namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;

[ApiController]
[Route("api/hr")]
[Authorize(Roles = "Admin")]
[Tags("Leave & HR Management")]
public class LeaveManagementController : ControllerBase
{
    private readonly ISchoolService _schoolService;

    public LeaveManagementController(ISchoolService schoolService)
    {
        _schoolService = schoolService;
    }

    // Leave Types
    [HttpGet("leave-types")]
    public async Task<IActionResult> GetAllLeaveTypes() =>
        Ok(new { success = true, data = await _schoolService.GetAllLeaveTypesAsync() });

    [HttpPost("leave-types")]
    public async Task<IActionResult> CreateLeaveType([FromBody] LeaveTypeConfigDto dto) =>
        Ok(new { success = true, message = "Leave type configured successfully.", data = await _schoolService.CreateLeaveTypeAsync(dto) });

    // Leave Applications
    [HttpGet("leave-applications")]
    public async Task<IActionResult> GetAllLeaveApplications([FromQuery] string? status) =>
        Ok(new { success = true, data = await _schoolService.GetAllLeaveApplicationsAsync(status) });

    [HttpPost("leave-applications")]
    public async Task<IActionResult> SubmitLeaveApplication([FromBody] LeaveApplicationCreateDto dto) =>
        Ok(new { success = true, message = "Leave application submitted successfully.", data = await _schoolService.SubmitLeaveApplicationAsync(dto) });

    [HttpPut("leave-applications/{id:int}/status")]
    public async Task<IActionResult> UpdateLeaveStatus(int id, [FromBody] string status) =>
        Ok(new { success = true, message = $"Leave application {status.ToLower()} successfully.", data = await _schoolService.UpdateLeaveStatusAsync(id, status) });

    // Leave Balances
    [HttpGet("leave-balances")]
    public async Task<IActionResult> GetLeaveBalances() =>
        Ok(new { success = true, data = await _schoolService.GetLeaveBalancesAsync() });

    // Holidays
    [HttpGet("holidays")]
    public async Task<IActionResult> GetAllHolidays() =>
        Ok(new { success = true, data = await _schoolService.GetAllHolidaysAsync() });

    [HttpPost("holidays")]
    public async Task<IActionResult> CreateHoliday([FromBody] HolidayCalendarDto dto) =>
        Ok(new { success = true, message = "Holiday added successfully.", data = await _schoolService.CreateHolidayAsync(dto) });

    [HttpDelete("holidays/{id:int}")]
    public async Task<IActionResult> DeleteHoliday(int id)
    {
        await _schoolService.DeleteHolidayAsync(id);
        return Ok(new { success = true, message = "Holiday deleted successfully." });
    }
}
