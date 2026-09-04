namespace SMS.Api.Controllers.StaffManagement;

using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces.StaffManagement;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/staff")]
[Authorize]
[Tags("Faculty & Staff Management")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet("next-emp-id")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNextEmployeeId([FromQuery] string? category) =>
        Ok(new { success = true, data = new { nextEmployeeId = await _staffService.GetNextEmployeeIdAsync(category) } });

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Principal,Teacher")]
    public async Task<IActionResult> GetAllStaff([FromQuery] string? search, [FromQuery] string? department) =>
        Ok(new { success = true, data = await _staffService.GetAllStaffAsync(search, department) });

    [HttpGet("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Principal,Teacher")]
    public async Task<IActionResult> GetStaffById(int id) =>
        Ok(new { success = true, data = await _staffService.GetStaffByIdAsync(id) });

    [HttpGet("teachers/dropdown")]
    [Authorize(Roles = "SuperAdmin,Admin,Principal,Teacher")]
    public async Task<IActionResult> GetTeachersDropdown([FromQuery] string? search) =>
        Ok(new { success = true, data = await _staffService.GetTeachersForDropdownAsync(search) });

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Principal")]
    public async Task<IActionResult> CreateStaff([FromBody] StaffCreateDto dto) =>
        Ok(new { success = true, message = "Staff member created successfully.", data = await _staffService.CreateStaffAsync(dto) });

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Principal")]
    public async Task<IActionResult> UpdateStaff(int id, [FromBody] StaffCreateDto dto) =>
        Ok(new { success = true, message = "Staff member updated successfully.", data = await _staffService.UpdateStaffAsync(id, dto) });

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Principal")]
    public async Task<IActionResult> DeleteStaff(int id)
    {
        try
        {
            await _staffService.DeleteStaffAsync(id);
            return Ok(new { success = true, message = "Staff member deleted successfully." });
        }
        catch (DbUpdateException)
        {
            return BadRequest(new
            {
                success = false,
                message = "Cannot delete this staff member. They are currently assigned to active classes, timetable slots, or other records. Please remove those assignments first."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}
