namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/staff")]
[Authorize(Roles = "Admin")]
[Tags("Faculty & Staff Management")]
public class StaffController : ControllerBase
{
    private readonly ISchoolService _schoolService;

    public StaffController(ISchoolService schoolService)
    {
        _schoolService = schoolService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllStaff([FromQuery] string? search, [FromQuery] string? department) =>
        Ok(new { success = true, data = await _schoolService.GetAllStaffAsync(search, department) });

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetStaffById(int id) =>
        Ok(new { success = true, data = await _schoolService.GetStaffByIdAsync(id) });

    [HttpGet("teachers/dropdown")]
    public async Task<IActionResult> GetTeachersDropdown([FromQuery] string? search) =>
        Ok(new { success = true, data = await _schoolService.GetTeachersForDropdownAsync(search) });

    [HttpPost]
    public async Task<IActionResult> CreateStaff([FromBody] StaffCreateDto dto) =>
        Ok(new { success = true, message = "Staff member created successfully.", data = await _schoolService.CreateStaffAsync(dto) });

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateStaff(int id, [FromBody] StaffCreateDto dto) =>
        Ok(new { success = true, message = "Staff member updated successfully.", data = await _schoolService.UpdateStaffAsync(id, dto) });

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteStaff(int id)
    {
        await _schoolService.DeleteStaffAsync(id);
        return Ok(new { success = true, message = "Staff member deleted successfully." });
    }
}