namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces.StaffManagement;
using System.Threading.Tasks;

[ApiController]
[Route("api/teachers")]
[Authorize(Roles = "Admin,Teacher,Student,Parent")]
[Tags("Faculty & Staff Management")]
public class TeachersController : ControllerBase
{
    private readonly IStaffService _staffService;

    public TeachersController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    /// <summary>
    /// Get all teaching staff / teachers for display in options (Accessible by Student, Parent, Teacher, Admin).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllTeachers([FromQuery] string? search, [FromQuery] string? subject)
    {
        var teachers = await _staffService.GetAllTeachersAsync(search, subject);
        return Ok(new { success = true, data = teachers });
    }

    /// <summary>
    /// Get teacher details by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetTeacherById(int id)
    {
        var teacher = await _staffService.GetTeacherByIdAsync(id);
        if (teacher == null)
            return NotFound(new { success = false, message = "Teacher not found" });

        return Ok(new { success = true, data = teacher });
    }
}
