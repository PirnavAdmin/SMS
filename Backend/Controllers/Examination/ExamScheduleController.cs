namespace SMS.Api.Controllers.Examination;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Examination;
using SMS.Api.Services.Interfaces.Examination;
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
        try
        {
            var result = await _service.GetScheduleOptionsAsync();
            return Ok(new { success = true, data = result });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to load schedule options.", error = ex.Message });
        }
    }

    /// <summary>
    /// Get Timetable for a specific Class & Section (Edit Mode - Screenshots 1 & 2)
    /// </summary>
    [HttpGet("timetable")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetTimetableForClassSection(
        [FromQuery] int? examId,
        [FromQuery] string className = "",
        [FromQuery] string sectionName = "")
    {
        try
        {
            var result = await _service.GetTimetableForClassSectionAsync(examId, className, sectionName);
            return Ok(new { success = true, data = result });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to fetch timetable.", error = ex.Message });
        }
    }

    /// <summary>
    /// Save or Edit Timetable slots for a Class & Section (Clicking "Edit Timetable" -> Save)
    /// </summary>
    [HttpPost("save-timetable")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> SaveTimetable([FromBody] SaveTimetableRequestDto request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ClassName) || string.IsNullOrWhiteSpace(request.SectionName))
                return BadRequest(new { success = false, message = "Class and Section are required." });

            var success = await _service.SaveTimetableAsync(request);
            return Ok(new
            {
                success = true,
                message = "Examination Timetable & Invigilation saved successfully.",
                redirectTo = "MarksEntry",
                data = success
            });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to save timetable.", error = ex.Message });
        }
    }

    /// <summary>
    /// Update Timetable slots for a Class & Section (PUT /api/examination-new/schedule/timetable)
    /// </summary>
    [HttpPut("timetable")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> UpdateTimetable([FromBody] SaveTimetableRequestDto request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ClassName) || string.IsNullOrWhiteSpace(request.SectionName))
                return BadRequest(new { success = false, message = "Class and Section are required." });

            var success = await _service.SaveTimetableAsync(request);
            return Ok(new
            {
                success = true,
                message = "Examination Timetable & Invigilation updated successfully.",
                updated = success
            });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to update timetable.", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete an individual Timetable Slot by Slot ID (DELETE /api/examination-new/schedule/slot/{slotId})
    /// </summary>
    [HttpDelete("slot/{slotId:int}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> DeleteSlot(int slotId)
    {
        try
        {
            var success = await _service.DeleteSlotAsync(slotId);
            return Ok(new
            {
                success = true,
                message = $"Timetable slot {slotId} deleted successfully."
            });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to delete slot.", error = ex.Message });
        }
    }

    /// <summary>
    /// Clear entire Timetable for a Class & Section (DELETE /api/examination-new/schedule/clear-timetable)
    /// </summary>
    [HttpDelete("clear-timetable")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> ClearTimetable([FromQuery] int? examId, [FromQuery] string className, [FromQuery] string sectionName)
    {
        try
        {
            var success = await _service.ClearTimetableAsync(examId, className, sectionName);
            return Ok(new
            {
                success = true,
                message = $"Timetable for {className} - {sectionName} cleared successfully."
            });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to clear timetable.", error = ex.Message });
        }
    }

    /// <summary>
    /// Get Schedule Preview across All Classes & Sections (Timetable Preview Mode - Screenshots 3, 4 & 5)
    /// </summary>
    [HttpGet("preview")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetSchedulePreview(
        [FromQuery] int? examId,
        [FromQuery] string? academicYear = "",
        [FromQuery] string? className = "All",
        [FromQuery] string? sectionName = "All")
    {
        try
        {
            var result = await _service.GetSchedulePreviewAsync(examId, academicYear, className, sectionName);
            return Ok(new { success = true, data = result });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to fetch preview.", error = ex.Message });
        }
    }
}

