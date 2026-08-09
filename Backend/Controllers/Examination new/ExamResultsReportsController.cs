namespace SMS.Api.Controllers.ExaminationNew;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.ExaminationNew;
using SMS.Api.Services.Interfaces.ExaminationNew;
using System.Threading.Tasks;

[ApiController]
[Route("api/examination-new/results-reports")]
[Authorize]
[Tags("Examination Module - Results Verification & Report Cards")]
public class ExamResultsReportsController : ControllerBase
{
    private readonly IExamResultsReportsService _service;

    public ExamResultsReportsController(IExamResultsReportsService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get dropdown choices for Results & Reports (Classes, Sections, Result Statuses, Rank Orders)
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetOptions()
    {
        var result = await _service.GetOptionsAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Trigger Results Calculation for a Class & Section (Sub-Tab 1: Results & Ranking - Screenshots 1 & 2)
    /// </summary>
    [HttpPost("calculate")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> CalculateResults([FromBody] CalculateResultsRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ClassName) || string.IsNullOrWhiteSpace(request.SectionName))
            return BadRequest(new { success = false, message = "Class and Section are required to process results." });

        var result = await _service.CalculateResultsAsync(request);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Student Report Cards list (Sub-Tab 2: Report Cards & Print - Screenshots 3, 4 & 5)
    /// </summary>
    [HttpGet("report-cards")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetReportCards(
        [FromQuery] string className = "Class 1",
        [FromQuery] string sectionName = "Section A",
        [FromQuery] string? resultStatus = "All",
        [FromQuery] string? rankOrder = "Ascending",
        [FromQuery] string? search = null)
    {
        var result = await _service.GetReportCardsAsync(className, sectionName, resultStatus, rankOrder, search);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get detailed printable report card for a student (Clicking "Print Report Card" / Download PDF)
    /// </summary>
    [HttpGet("print-card/{studentId:int}")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetReportCardPrintDetail(
        int studentId,
        [FromQuery] string className = "Class 1",
        [FromQuery] string sectionName = "Section A")
    {
        var result = await _service.GetReportCardPrintDetailAsync(studentId, className, sectionName);
        if (result == null) return NotFound(new { success = false, message = "Report card not found for the specified student." });
        return Ok(new { success = true, data = result });
    }
}
