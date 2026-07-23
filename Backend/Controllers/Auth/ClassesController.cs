namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/classes")]
[Authorize(Roles = "Admin")]
[Tags("Academic Classes & Sections")]
public class ClassesController : ControllerBase
{
    private readonly ISchoolService _schoolService;

    public ClassesController(ISchoolService schoolService)
    {
        _schoolService = schoolService;
    }

    [HttpGet]
    public async Task<IActionResult> GetClasses() =>
        Ok(new { success = true, data = await _schoolService.GetAllClassesAsync() });

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetClassById(int id) =>
        Ok(new { success = true, data = await _schoolService.GetClassByIdAsync(id) });

    [HttpPost]
    public async Task<IActionResult> CreateClassGrade([FromBody] CreateClassGradeDto dto)
    {
        await _schoolService.CreateClassGradeAsync(dto);
        return Ok(new { success = true, message = "Academic Class Grade created successfully." });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateClassGrade(int id, [FromBody] CreateClassGradeDto dto)
    {
        await _schoolService.UpdateClassGradeAsync(id, dto);
        return Ok(new { success = true, message = "Academic Class Grade updated successfully." });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteClassGrade(int id)
    {
        await _schoolService.DeleteClassGradeAsync(id);
        return Ok(new { success = true, message = "Academic Class Grade deleted successfully." });
    }
}