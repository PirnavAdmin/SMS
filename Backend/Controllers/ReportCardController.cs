namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;

[ApiController]
[Route("api/reports")]
[Authorize]
[Tags("Report Cards & Examinations")]
public class ReportCardController : ControllerBase
{
    private readonly IReportCardService _reportCardService;

    public ReportCardController(IReportCardService reportCardService)
    {
        _reportCardService = reportCardService;
    }

    /// <summary>
    /// Get dropdown options for Assessment Exams and Academic Years
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetReportCardDropdownOptions([FromQuery] string? academicYear = "2026-27")
    {
        var result = await _reportCardService.GetReportCardDropdownOptionsAsync(academicYear);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Student Report Card details (overall %, scholastic grade, remarks, subject breakdown) based on selected Exam and Academic Year dropdowns
    /// </summary>
    [HttpGet("student/report-card")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetStudentReportCard(
        [FromQuery] int? studentId = 1,
        [FromQuery] string? examName = null,
        [FromQuery] string? academicYear = "2026-27")
    {
        var result = await _reportCardService.GetStudentReportCardAsync(studentId, examName, academicYear);
        return Ok(new { success = true, data = result });
    }
}
