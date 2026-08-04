namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;

[ApiController]
[Route("api/teachers")]
[Authorize(Roles = "Admin,Teacher,Student,Parent")]
[Tags("Faculty & Staff Management")]
public class TeachersController : ControllerBase
{
    private readonly ISchoolService _schoolService;

    public TeachersController(ISchoolService schoolService)
    {
        _schoolService = schoolService;
    }

    /// <summary>
    /// Get all teaching staff / teachers for display in options (Accessible by Student, Parent, Teacher, Admin).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllTeachers([FromQuery] string? search, [FromQuery] string? subject)
    {
        var teachers = await _schoolService.GetAllTeachersAsync(search, subject);
        return Ok(new { success = true, data = teachers });
    }

    /// <summary>
    /// Get teacher details by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetTeacherById(int id)
    {
        var teacher = await _schoolService.GetTeacherByIdAsync(id);
        if (teacher == null)
            return NotFound(new { success = false, message = "Teacher not found" });

        return Ok(new { success = true, data = teacher });
    }
}
