namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Interfaces.Parent;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/hostel/student")]
[Authorize]
[Tags("Hostel Accommodation")]
public class StudentHostelController : ControllerBase
{
    private readonly IStudentHostelService _hostelService;
    private readonly IParentService _parentService;

    public StudentHostelController(IStudentHostelService hostelService, IParentService parentService)
    {
        _hostelService = hostelService;
        _parentService = parentService;
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
        [FromQuery] int? studentId = null,
        [FromQuery] string? academicYear = null)
    {
        int? targetStudentId = studentId;
        if (User.IsInRole("Student") || User.IsInRole("Parent"))
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (!int.TryParse(idClaim, out int userId) || userId <= 0) return Forbid();

            if (User.IsInRole("Student"))
            {
                var ownId = await _parentService.GetStudentIdForUserAsync(userId);
                if (!ownId.HasValue) return Forbid();
                if (studentId.HasValue && studentId.Value > 0 && studentId.Value != ownId.Value) return Forbid();
                targetStudentId = ownId.Value;
            }
            else
            {
                if (!studentId.HasValue || studentId.Value <= 0) return Forbid();
                if (!await _parentService.IsStudentAssociatedWithParentAsync(userId, studentId.Value)) return Forbid();
            }
        }

        var result = await _hostelService.GetStudentHostelDetailsAsync(targetStudentId, academicYear);
        return Ok(new { success = true, data = result });
    }
}
