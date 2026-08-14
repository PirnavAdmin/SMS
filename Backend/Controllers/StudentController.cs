using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers;

[ApiController]
[Route("api/v1/students")]
public class StudentController : ControllerBase
{
    private readonly ISchoolService _schoolService;

    public StudentController(ISchoolService schoolService)
    {
        _schoolService = schoolService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedStudentResponseDto>> GetAllStudents(
        [FromQuery] StudentFilterDto filter)
    {
        var result = await _schoolService.GetAllStudentsAsync(filter);
        return Ok(result);
    }

    [HttpGet("{studentId:int}")]
    public async Task<ActionResult<StudentDetailsDto>> GetStudentById(int studentId)
    {
        var result = await _schoolService.GetStudentByIdAsync(studentId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<StudentDetailsDto>> CreateStudent(
        [FromBody] CreateStudentDto dto)
    {
        var result = await _schoolService.CreateStudentAsync(dto);

        return CreatedAtAction(
            nameof(GetStudentById),
            new { studentId = result.StudentId },
            result);
    }

    [HttpPut("{studentId:int}")]
    public async Task<ActionResult<StudentDetailsDto>> UpdateStudent(
        int studentId,
        [FromBody] UpdateStudentDto dto)
    {
        var result = await _schoolService.UpdateStudentAsync(studentId, dto);
        return Ok(result);
    }

    [HttpPatch("{studentId:int}/status")]
    public async Task<IActionResult> UpdateStudentStatus(
        int studentId,
        [FromBody] UpdateStudentStatusDto dto)
    {
        await _schoolService.UpdateStudentStatusAsync(studentId, dto);

        return Ok(new
        {
            message = "Student status updated successfully."
        });
    }

    [HttpDelete("{studentId:int}")]
    public async Task<IActionResult> DeleteStudent(int studentId)
    {
        await _schoolService.DeleteStudentAsync(studentId);

        return Ok(new
        {
            message = "Student deleted successfully."
        });
    }

    [HttpGet("dropdowns/academic-years")]
    public async Task<ActionResult<List<StudentDropdownDto>>> GetAcademicYears(
        [FromQuery] string? search)
    {
        var result = await _schoolService.GetAcademicYearDropdownAsync(search);
        return Ok(result);
    }

    [HttpGet("dropdowns/classes")]
    public async Task<ActionResult<List<StudentDropdownDto>>> GetClasses(
        [FromQuery] string? search)
    {
        var result = await _schoolService.GetClassDropdownAsync(search);
        return Ok(result);
    }

    [HttpGet("dropdowns/sections")]
    public async Task<ActionResult<List<StudentDropdownDto>>> GetSections(
        [FromQuery] int classId,
        [FromQuery] string? search)
    {
        var result = await _schoolService.GetSectionDropdownAsync(classId, search);
        return Ok(result);
    }
}