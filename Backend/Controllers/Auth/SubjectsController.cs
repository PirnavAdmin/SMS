namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/subjects")]
[Authorize(Roles = "Admin")]
[Tags("Academic Subjects")]
public class SubjectsController : ControllerBase
{
    private readonly ISchoolService _schoolService;

    public SubjectsController(ISchoolService schoolService)
    {
        _schoolService = schoolService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSubjects([FromQuery] string? search) =>
        Ok(new { success = true, data = await _schoolService.GetAllSubjectsAsync(search) });

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetSubjectById(int id) =>
        Ok(new { success = true, data = await _schoolService.GetSubjectByIdAsync(id) });

    [HttpGet("dropdown")]
    public async Task<IActionResult> GetSubjectsDropdown([FromQuery] string? search) =>
        Ok(new { success = true, data = await _schoolService.GetSubjectsDropdownAsync(search) });

    [HttpPost]
    public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectDto dto) =>
        Ok(new { success = true, message = "Subject created successfully.", data = await _schoolService.CreateSubjectAsync(dto) });

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateSubject(int id, [FromBody] CreateSubjectDto dto) =>
        Ok(new { success = true, message = "Subject updated successfully.", data = await _schoolService.UpdateSubjectAsync(id, dto) });

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteSubject(int id)
    {
        await _schoolService.DeleteSubjectAsync(id);
        return Ok(new { success = true, message = "Subject deleted successfully." });
    }
}