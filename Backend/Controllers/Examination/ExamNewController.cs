namespace SMS.Api.Controllers.Examination;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Examination;
using SMS.Api.Services.Interfaces.Examination;
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
    /// Update existing Exam Details by Exam ID (PUT /api/examination-new/exams/{id})
    /// </summary>
    [HttpPut("exams/{id:int}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> UpdateExamDetails(int id, [FromBody] SaveExamDetailsRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ExamName))
            return BadRequest(new { success = false, message = "Examination Name is required." });

        request.ExamId = id;
        var result = await _service.SaveExamDetailsAsync(request);
        return Ok(new { 
            success = true, 
            message = $"Examination {id} updated successfully.", 
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

    /// <summary>
    /// Update Subjects & Marks configuration for an Exam (PUT /api/examination-new/subjects/{examId})
    /// </summary>
    [HttpPut("subjects/{examId:int}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> UpdateSubjects(int examId, [FromBody] SaveSubjectsAndMarksRequestDto request)
    {
        if (request == null)
            return BadRequest(new { success = false, message = "Invalid request payload." });

        request.ExamId = examId;
        var success = await _service.SaveSubjectsAndProceedAsync(request);
        return Ok(new { 
            success = true, 
            message = $"Subjects & Marks for examination {examId} updated successfully.", 
            updated = success 
        });
    }

    /// <summary>
    /// Delete Exam Configuration (Clicking the red trash icon button 🗑️)
    /// </summary>
    [HttpDelete("exams/{id:int}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> DeleteExam(int id)
    {
        var success = await _service.DeleteExamAsync(id);
        return Ok(new { 
            success = true, 
            message = $"Examination {id} deleted successfully." 
        });
    }
}

