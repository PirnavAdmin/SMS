namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;

[ApiController]
[Route("api/fees")]
[Authorize]
[Tags("Finance & Fee Management")]
public class FeeDetailsController : ControllerBase
{
    private readonly IFeeService _feeService;

    public FeeDetailsController(IFeeService feeService)
    {
        _feeService = feeService;
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
        [FromQuery] int? studentId = 1,
        [FromQuery] string? academicYear = "2027-28")
    {
        var result = await _feeService.GetStudentFeeDetailsAsync(studentId, academicYear);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Student Receipt Register / Payment History (Receipt Register Tab)
    /// </summary>
    [HttpGet("student/receipts")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetStudentReceiptRegister(
        [FromQuery] int? studentId = 1,
        [FromQuery] string? academicYear = "All Academic Years")
    {
        var result = await _feeService.GetStudentReceiptRegisterAsync(studentId, academicYear);
        return Ok(new { success = true, data = result });
    }
}
