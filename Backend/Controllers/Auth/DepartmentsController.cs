namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;

[ApiController]
[Route("api/departments")]
[Authorize(Roles = "Admin")]
[Tags("Academic Departments")]
public class DepartmentsController : ControllerBase
{
    private readonly ISchoolService _schoolService;

    public DepartmentsController(ISchoolService schoolService)
    {
        _schoolService = schoolService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDepartments([FromQuery] string? search) =>
        Ok(new { success = true, data = await _schoolService.GetAllDepartmentsAsync(search) });

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDepartmentById(string id) =>
        Ok(new { success = true, data = await _schoolService.GetDepartmentByIdAsync(id) });

    [HttpGet("dropdown")]
    public async Task<IActionResult> GetDepartmentsDropdown([FromQuery] string? search) =>
        Ok(new { success = true, data = await _schoolService.GetActiveDepartmentsDropdownAsync(search) });

    [HttpGet("{id}/subjects")]
    public async Task<IActionResult> GetSubjectsByDepartment(string id) =>
        Ok(new { success = true, data = await _schoolService.GetSubjectsByDepartmentIdAsync(id) });

    [HttpPost]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentDto dto) =>
        Ok(new { success = true, message = "Department created successfully.", data = await _schoolService.CreateDepartmentAsync(dto) });

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDepartment(string id, [FromBody] CreateDepartmentDto dto) =>
        Ok(new { success = true, message = "Department updated successfully.", data = await _schoolService.UpdateDepartmentAsync(id, dto) });

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDepartment(string id)
    {
        await _schoolService.DeleteDepartmentAsync(id);
        return Ok(new { success = true, message = "Department deleted successfully." });
    }
}
