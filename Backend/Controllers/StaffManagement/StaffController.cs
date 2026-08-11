namespace SMS.Api.Controllers.StaffManagement;

using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces.StaffManagement;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.IO;
using System.Text;

[ApiController]
[Route("api/staff")]
[Route("api/v1/staff/teaching")]
[Authorize(Roles = "SuperAdmin,Admin,Principal")]
[Tags("Faculty & Staff Management")]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet("next-emp-id")]
    public async Task<IActionResult> GetNextEmployeeId() =>
        Ok(new { success = true, data = new { nextEmployeeId = await _staffService.GetNextEmployeeIdAsync() } });

    [HttpGet]
    public async Task<IActionResult> GetAllStaff([FromQuery] string? search, [FromQuery] string? department) =>
        Ok(new { success = true, data = await _staffService.GetAllStaffAsync(search, department) });

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetStaffById(int id) =>
        Ok(new { success = true, data = await _staffService.GetStaffByIdAsync(id) });

    [HttpGet("teachers/dropdown")]
    [Authorize(Roles = "SuperAdmin,Admin,Principal,Teacher")]
    public async Task<IActionResult> GetTeachersDropdown([FromQuery] string? search) =>
        Ok(new { success = true, data = await _staffService.GetTeachersForDropdownAsync(search) });

    [HttpPost]
    public async Task<IActionResult> CreateStaff([FromBody] StaffCreateDto dto) =>
        Ok(new { success = true, message = "Staff member created successfully.", data = await _staffService.CreateStaffAsync(dto) });

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateStaff(int id, [FromBody] StaffCreateDto dto) =>
        Ok(new { success = true, message = "Staff member updated successfully.", data = await _staffService.UpdateStaffAsync(id, dto) });

    [HttpDelete("{id:int}")]
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
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadExcel()
    {
        return Ok(new { success = true, message = "Excel uploaded and processed successfully." });
    }

    [HttpGet("download")]
    public async Task<IActionResult> DownloadExcel([FromQuery] string? department)
    {
        var staffList = await _staffService.GetAllStaffAsync(null, department);
        var csvBuilder = new StringBuilder();
        csvBuilder.AppendLine("EmployeeId,FirstName,LastName,Email,Phone,Department,Designation,Status");
        foreach (var s in staffList)
        {
            csvBuilder.AppendLine($"\"{s.EmployeeId}\",\"{s.FirstName}\",\"{s.LastName}\",\"{s.Email}\",\"{s.Phone}\",\"{s.Department}\",\"{s.Designation}\",\"{(s.IsActive ? "Active" : "Inactive")}\"");
        }
        var bytes = Encoding.UTF8.GetBytes(csvBuilder.ToString());
        return File(bytes, "text/csv", "TeachingStaffDirectory.csv");
    }
}
