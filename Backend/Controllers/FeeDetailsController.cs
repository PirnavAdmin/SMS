namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Interfaces.Parent;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/fees")]
[Authorize]
[Tags("Finance & Fee Management")]
public class FeeDetailsController : ControllerBase
{
    private readonly IFeeService _feeService;
    private readonly IParentService _parentService;

    public FeeDetailsController(IFeeService feeService, IParentService parentService)
    {
        _feeService = feeService;
        _parentService = parentService;
    }

    private async Task<(bool allowed, int? resolvedStudentId)> AuthorizeStudentAccessAsync(int? requestedStudentId)
    {
        if (User.IsInRole("Admin") || User.IsInRole("Super Admin") || User.IsInRole("SuperAdmin") || User.IsInRole("Teacher") || User.IsInRole("Accountant"))
            return (true, requestedStudentId);

        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!int.TryParse(idClaim, out int userId) || userId <= 0)
            return (false, null);

        if (User.IsInRole("Student"))
        {
            var ownId = await _parentService.GetStudentIdForUserAsync(userId);
            if (!ownId.HasValue) return (false, null);
            if (requestedStudentId.HasValue && requestedStudentId.Value > 0 && requestedStudentId.Value != ownId.Value)
                return (false, null);
            return (true, ownId.Value);
        }

        if (User.IsInRole("Parent"))
        {
            if (!requestedStudentId.HasValue || requestedStudentId.Value <= 0) return (false, null);
            var ok = await _parentService.IsStudentAssociatedWithParentAsync(userId, requestedStudentId.Value);
            return (ok, requestedStudentId);
        }

        return (false, null);
    }

    /// <summary>
    /// Get dropdown options for Academic Years in Fee Details and Receipt Register
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetFeeDropdownOptions()
    {
        var result = await _feeService.GetFeeDropdownOptionsAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Student Outstanding Fee Details & Breakdown (Fee Details Tab)
    /// </summary>
    [HttpGet("student/details")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetStudentFeeDetails(
        [FromQuery] int? studentId = null,
        [FromQuery] string? academicYear = null)
    {
        var (allowed, targetId) = await AuthorizeStudentAccessAsync(studentId);
        if (!allowed) return Forbid();

        var result = await _feeService.GetStudentFeeDetailsAsync(targetId, academicYear);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Student Receipt Register / Payment History (Receipt Register Tab)
    /// </summary>
    [HttpGet("student/receipts")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetStudentReceiptRegister(
        [FromQuery] int? studentId = null,
        [FromQuery] string? academicYear = "All Academic Years")
    {
        var (allowed, targetId) = await AuthorizeStudentAccessAsync(studentId);
        if (!allowed) return Forbid();

        var result = await _feeService.GetStudentReceiptRegisterAsync(targetId, academicYear);
        return Ok(new { success = true, data = result });
    }
}
