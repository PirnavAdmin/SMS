namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/attendance/student")]
[Authorize]
[Tags("Attendance Register")]
public class StudentAttendanceController : ControllerBase
{
    private readonly IStudentAttendanceService _service;

    public StudentAttendanceController(IStudentAttendanceService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get Attendance Register with Summary Cards and Daily Records (accessible by Student, Parent, Teacher, Admin)
    /// </summary>
    [HttpGet("register")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent,Staff")]
    public async Task<IActionResult> GetStudentAttendanceRegister([FromQuery] StudentAttendanceRegisterQueryDto query)
    {
        var result = await _service.GetStudentAttendanceRegisterAsync(query);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get all student attendance records matching optional filters
    /// </summary>
    [HttpGet("all")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent,Staff")]
    public async Task<IActionResult> GetAllStudentAttendanceRecords([FromQuery] StudentAttendanceUniversalQueryDto query)
    {
        var result = await _service.GetAllAttendanceRecordsAsync(query);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Alias endpoint for fetching records
    /// </summary>
    [HttpGet("records")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent,Staff")]
    public async Task<IActionResult> GetRecords([FromQuery] StudentAttendanceUniversalQueryDto query)
    {
        var result = await _service.GetAllAttendanceRecordsAsync(query);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Bulk save / update student attendance records (accessible by Admin, Teacher, Staff)
    /// </summary>
    [HttpPost("bulk")]
    [Authorize(Roles = "Admin,Teacher,Staff")]
    public async Task<IActionResult> BulkSaveStudentAttendance([FromBody] BulkSaveStudentAttendanceDto dto)
    {
        int? staffId = null;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdClaim, out int parsedId))
        {
            staffId = parsedId;
        }

        var result = await _service.BulkSaveStudentAttendanceAsync(dto, staffId);
        return Ok(result);
    }

    /// <summary>
    /// Mark single student attendance
    /// </summary>
    [HttpPost("mark")]
    [Authorize(Roles = "Admin,Teacher,Staff")]
    public async Task<IActionResult> MarkStudentAttendance([FromBody] MarkStudentAttendanceDto dto)
    {
        var result = await _service.MarkStudentAttendanceAsync(dto);
        return Ok(new { success = result, message = "Attendance marked successfully." });
    }
}
