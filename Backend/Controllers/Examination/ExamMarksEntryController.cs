namespace SMS.Api.Controllers.Examination;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Examination;
using SMS.Api.Services.Interfaces.Examination;
using System.Threading.Tasks;

[ApiController]
[Route("api/examination-new/marks-entry")]
[Authorize]
[Tags("Examination Module - Student Marks Entry")]
public class ExamMarksEntryController : ControllerBase
{
    private readonly IExamMarksEntryService _service;

    public ExamMarksEntryController(IExamMarksEntryService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get dropdown options for Marks Entry (Classes, Sections, Exam Subjects)
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetMarksEntryOptions()
    {
        var result = await _service.GetMarksEntryOptionsAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Student Marks Sheet for a selected Class, Section, and Exam Subject (Screenshots 1, 2, 3 & 4)
    /// </summary>
    [HttpGet("students")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetStudentMarksSheet(
        [FromQuery] string className = "Class 1",
        [FromQuery] string sectionName = "Section A",
        [FromQuery] string subjectCode = "MTH-101",
        [FromQuery] string? search = null)
    {
        var result = await _service.GetStudentMarksSheetAsync(className, sectionName, subjectCode, search);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Save Draft marks entry (Clicking "Save Draft")
    /// </summary>
    [HttpPost("save-draft")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> SaveDraft([FromBody] SaveMarksSheetRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ClassName) || string.IsNullOrWhiteSpace(request.SectionName) || string.IsNullOrWhiteSpace(request.SubjectCode))
            return BadRequest(new { success = false, message = "Class, Section, and Subject Code are required." });

        request.IsFinalSubmit = false;
        var success = await _service.SaveMarksSheetAsync(request);
        return Ok(new { 
            success = true, 
            message = "Student marks draft saved successfully.", 
            data = success 
        });
    }

    /// <summary>
    /// Submit Marks Entry final (Clicking "Submit Marks" -> Redirects to Results & Reports)
    /// </summary>
    [HttpPost("submit-marks")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> SubmitMarks([FromBody] SaveMarksSheetRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ClassName) || string.IsNullOrWhiteSpace(request.SectionName) || string.IsNullOrWhiteSpace(request.SubjectCode))
            return BadRequest(new { success = false, message = "Class, Section, and Subject Code are required." });

        request.IsFinalSubmit = true;
        var success = await _service.SaveMarksSheetAsync(request);
        return Ok(new { 
            success = true, 
            message = "Student marks submitted successfully. Proceeding to Results & Reports.", 
            redirectTo = "ResultsAndReports",
            data = success 
        });
    }

    /// <summary>
    /// Update Student Marks entry (PUT /api/examination-new/marks-entry/update-marks)
    /// </summary>
    [HttpPut("update-marks")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> UpdateMarks([FromBody] SaveMarksSheetRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ClassName) || string.IsNullOrWhiteSpace(request.SectionName) || string.IsNullOrWhiteSpace(request.SubjectCode))
            return BadRequest(new { success = false, message = "Class, Section, and Subject Code are required." });

        var success = await _service.SaveMarksSheetAsync(request);
        return Ok(new { 
            success = true, 
            message = "Student marks updated successfully.", 
            updated = success 
        });
    }

    /// <summary>
    /// Clear Marks Entry sheet for a Class, Section, and Subject (DELETE /api/examination-new/marks-entry/clear-marks)
    /// </summary>
    [HttpDelete("clear-marks")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> ClearMarksEntries(
        [FromQuery] string className,
        [FromQuery] string sectionName,
        [FromQuery] string subjectCode)
    {
        var success = await _service.ClearMarksEntriesAsync(className, sectionName, subjectCode);
        return Ok(new { 
            success = true, 
            message = $"Marks entries for {className} - {sectionName} ({subjectCode}) cleared successfully." 
        });
    }
}

