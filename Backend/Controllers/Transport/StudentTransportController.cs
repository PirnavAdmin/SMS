namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Interfaces.Parent;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/transport/student")]
[Authorize]
[Tags("Transport Management")]
public class StudentTransportController : ControllerBase
{
    private readonly IStudentTransportService _transportService;
    private readonly IParentService _parentService;

    public StudentTransportController(IStudentTransportService transportService, IParentService parentService)
    {
        _transportService = transportService;
        _parentService = parentService;
    }

    /// <summary>
    /// Get dropdown options for Academic Years in Transport view
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetTransportDropdownOptions()
    {
        var result = await _transportService.GetTransportDropdownOptionsAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Student Transport details (Enforces rule: If student is Hosteller, she/he is excluded from transport tab)
    /// </summary>
    [HttpGet("details")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetStudentTransportDetails(
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

        var result = await _transportService.GetStudentTransportDetailsAsync(targetStudentId, academicYear);
        return Ok(new { success = true, data = result });
    }
}
