namespace SMS.Api.Controllers.StaffManagement;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
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
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetStudentAttendanceRegister([FromQuery] StudentAttendanceRegisterQueryDto query)
    {
        var result = await _service.GetStudentAttendanceRegisterAsync(query);
        return Ok(new { success = true, data = result });
    }
}

