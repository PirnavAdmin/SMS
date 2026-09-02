namespace SMS.Api.Controllers.Examination;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Examination;
using SMS.Api.Services.Interfaces.Examination;
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
    /// Get dropdown options for Results & Reports (Classes, Sections, Exams, Status Filters)
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetOptions()
    {
        try
        {
            var result = await _service.GetOptionsAsync();
            return Ok(new { success = true, data = result });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to load options.", error = ex.Message });
        }
    }

    /// <summary>
    /// Sub-tab 1: Calculate Results for a Class, Section & Exam (Clicking "Calculate Results" button - Screenshot 1 & 2)
    /// </summary>
    [HttpPost("calculate")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> CalculateResults([FromBody] CalculateResultsRequestDto request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ClassName) || string.IsNullOrWhiteSpace(request.SectionName))
                return BadRequest(new { success = false, message = "Class and Section are required." });

            var result = await _service.CalculateResultsAsync(request);
            return Ok(new { 
                success = true, 
                message = "Results calculated, ranks assigned, and grades verified successfully.", 
                data = result 
            });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to calculate results.", error = ex.Message });
        }
    }

    /// <summary>
    /// Update calculated result details for a student (PUT /api/examination-new/results-reports/update-results)
    /// </summary>
    [HttpPut("update-results")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> UpdateResult(
        [FromBody] StudentReportCardRowDto request,
        [FromQuery] string className = "",
        [FromQuery] string sectionName = "")
    {
        try
        {
            if (request == null)
                return BadRequest(new { success = false, message = "Result row payload is required." });

            var success = await _service.UpdateExamResultAsync(request, className, sectionName);
            return Ok(new { 
                success = true, 
                message = "Student result record updated successfully.", 
                updated = success 
            });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to update result.", error = ex.Message });
        }
    }

    /// <summary>
    /// Sub-tab 2: Get Student Report Cards List (Report Cards tab - Screenshot 3 & 4)
    /// </summary>
    [HttpGet("report-cards")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetReportCardsList(
        [FromQuery] string className = "",
        [FromQuery] string sectionName = "",
        [FromQuery] string? search = null,
        [FromQuery] string? statusFilter = "All")
    {
        try
        {
            var result = await _service.GetReportCardsListAsync(className, sectionName, search, statusFilter);
            return Ok(new { success = true, data = result });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to load report cards.", error = ex.Message });
        }
    }

    /// <summary>
    /// Get Printable Individual Report Card by Student ID (Clicking "View / Print Card" - Screenshot 5)
    /// </summary>
    [HttpGet("print-card/{studentId:int}")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetPrintableReportCard(
        int studentId,
        [FromQuery] string? className = "",
        [FromQuery] string? sectionName = "")
    {
        try
        {
            var result = await _service.GetPrintableReportCardAsync(studentId, className, sectionName);
            if (result == null) return NotFound(new { success = false, message = "Report card not found for the specified student." });
            return Ok(new { success = true, data = result });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to fetch printable report card.", error = ex.Message });
        }
    }

    /// <summary>
    /// Clear calculated results for a Class & Section (DELETE /api/examination-new/results-reports/clear-results)
    /// </summary>
    [HttpDelete("clear-results")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> ClearResults([FromQuery] string className, [FromQuery] string sectionName)
    {
        try
        {
            var success = await _service.ClearExamResultsAsync(className, sectionName);
            return Ok(new { 
                success = true, 
                message = $"Calculated results for {className} - {sectionName} cleared successfully." 
            });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to clear results.", error = ex.Message });
        }
    }
}

