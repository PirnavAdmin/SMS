namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;

[ApiController]
[Route("api/hostel/student")]
[Authorize]
[Tags("Hostel Accommodation")]
public class StudentHostelController : ControllerBase
{
    private readonly IStudentHostelService _hostelService;

    public StudentHostelController(IStudentHostelService hostelService)
    {
        _hostelService = hostelService;
    }

    /// <summary>
    /// Get dropdown options for Academic Years in Hostel view
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetHostelDropdownOptions()
    {
        var result = await _hostelService.GetHostelDropdownOptionsAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Student Hostel Accommodation details (Non-Residential banner or Room & Bed Allocation)
    /// </summary>
    [HttpGet("details")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetStudentHostelDetails(
        [FromQuery] int? studentId = 1,
        [FromQuery] string? academicYear = "2027-28")
    {
        var result = await _hostelService.GetStudentHostelDetailsAsync(studentId, academicYear);
        return Ok(new { success = true, data = result });
    }
}
