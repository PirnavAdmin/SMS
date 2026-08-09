namespace SMS.Api.Controllers.ExaminationNew;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.ExaminationNew;
using SMS.Api.Services.Interfaces.ExaminationNew;
using System.Threading.Tasks;

[ApiController]
[Route("api/examination-new")]
[Authorize]
[Tags("Examination Module - New Setup")]
public class ExamNewController : ControllerBase
{
    private readonly IExamNewService _service;

    public ExamNewController(IExamNewService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get dropdown options for Exam Configuration (Assessment Types, Academic Terms, Classes, Existing Exams)
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetExamOptions()
    {
        var result = await _service.GetExamOptionsAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get exam details by Exam ID (Screen 1: Exam Details Tab)
    /// </summary>
    [HttpGet("exams/{id:int}")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetExamDetails(int id)
    {
        var result = await _service.GetExamDetailsByIdAsync(id);
        if (result == null) return NotFound(new { success = false, message = "Examination not found." });
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Step 1: Create or Save Exam Details (Clicking "Save & Continue" redirects to Step 2: Subjects & Marks)
    /// </summary>
    [HttpPost("save-details")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> SaveExamDetails([FromBody] SaveExamDetailsRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ExamName))
            return BadRequest(new { success = false, message = "Examination Name is required." });

        var result = await _service.SaveExamDetailsAsync(request);
        return Ok(new { 
            success = true, 
            message = "Exam details saved successfully. Proceeding to Subjects & Marks.", 
            redirectTo = "SubjectsAndMarks",
            data = result 
        });
    }

    /// <summary>
    /// Step 2: Get Subjects and Marks configuration for an Exam (Screen 2: Subjects & Marks Tab)
    /// </summary>
    [HttpGet("subjects/{examId:int}")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetSubjectsForExam(int examId, [FromQuery] string? className = "Class 1")
    {
        var result = await _service.GetSubjectsForExamAsync(examId, className);
        if (result == null) return NotFound(new { success = false, message = "Examination not found." });
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Step 2: Save Subjects & Marks and Proceed to Schedule (Clicking "Save & Proceed to Schedule")
    /// </summary>
    [HttpPost("save-subjects")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> SaveSubjectsAndProceed([FromBody] SaveSubjectsAndMarksRequestDto request)
    {
        if (request == null || request.ExamId <= 0)
            return BadRequest(new { success = false, message = "Invalid Examination ID." });

        var success = await _service.SaveSubjectsAndProceedAsync(request);
        return Ok(new { 
            success = true, 
            message = "Subjects & Marks saved successfully. Exam scheduled.", 
            redirectTo = "ExamSchedule",
            scheduled = success 
        });
    }
}
