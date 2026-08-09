namespace SMS.Api.Controllers.ExaminationNew;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.ExaminationNew;
using SMS.Api.Services.Interfaces.ExaminationNew;
using System.Threading.Tasks;

[ApiController]
[Route("api/examination-new/schedule")]
[Authorize]
[Tags("Examination Module - Exam Schedule & Timetable")]
public class ExamScheduleController : ControllerBase
{
    private readonly IExamScheduleService _service;

    public ExamScheduleController(IExamScheduleService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get dropdown options for Exam Schedule (Classes, Sections, Rooms/Halls, Invigilators)
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetScheduleOptions()
    {
        var result = await _service.GetScheduleOptionsAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Timetable for a specific Class & Section (Edit Mode - Screenshots 1 & 2)
    /// </summary>
    [HttpGet("timetable")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetTimetableForClassSection(
        [FromQuery] string className = "Class 1",
        [FromQuery] string sectionName = "Section A")
    {
        var result = await _service.GetTimetableForClassSectionAsync(className, sectionName);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Save or Edit Timetable slots for a Class & Section (Clicking "Edit Timetable" -> Save)
    /// </summary>
    [HttpPost("save-timetable")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> SaveTimetable([FromBody] SaveTimetableRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ClassName) || string.IsNullOrWhiteSpace(request.SectionName))
            return BadRequest(new { success = false, message = "Class and Section are required." });

        var success = await _service.SaveTimetableAsync(request);
        return Ok(new { 
            success = true, 
            message = "Examination Timetable & Invigilation saved successfully.", 
            redirectTo = "MarksEntry",
            data = success 
        });
    }

    /// <summary>
    /// Get Schedule Preview across All Classes & Sections (Timetable Preview Mode - Screenshots 3, 4 & 5)
    /// </summary>
    [HttpGet("preview")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetSchedulePreview(
        [FromQuery] string? academicYear = "2026-27",
        [FromQuery] string? className = "All",
        [FromQuery] string? sectionName = "All")
    {
        var result = await _service.GetSchedulePreviewAsync(academicYear, className, sectionName);
        return Ok(new { success = true, data = result });
    }
}
