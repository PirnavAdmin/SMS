namespace SMS.Api.Controllers;

using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class TimetableController : ControllerBase
{
    private readonly ITimetableService _timetableService;

    public TimetableController(ITimetableService timetableService)
    {
        _timetableService = timetableService;
    }

    // =========================================================
    // 1. CLASS TIMETABLE MATRIX GRID & SLOTS
    // =========================================================

    [HttpGet("class-grid")]
    public async Task<IActionResult> GetClassTimetableGrid([FromQuery] int classId, [FromQuery] int sectionId, [FromQuery] string academicYear = "2026-2027")
    {
        var result = await _timetableService.GetClassTimetableGridAsync(classId, sectionId, academicYear);
        return Ok(result);
    }

    [HttpPost("slots")]
    public async Task<IActionResult> SaveTimetableSlot([FromBody] SaveTimetableSlotDto dto)
    {
        var slot = await _timetableService.SaveTimetableSlotAsync(dto);
        return Ok(slot);
    }

    [HttpDelete("slots/{slotId}")]
    public async Task<IActionResult> DeleteTimetableSlot(int slotId)
    {
        var success = await _timetableService.DeleteTimetableSlotAsync(slotId);
        if (!success) return NotFound(new { message = $"Slot ID {slotId} not found." });
        return Ok(new { message = "Period slot deleted successfully." });
    }

    [HttpPut("publish")]
    public async Task<IActionResult> PublishTimetable([FromBody] PublishTimetableDto dto)
    {
        var result = await _timetableService.PublishTimetableAsync(dto);
        return Ok(result);
    }

    // =========================================================
    // 2. PERIOD SETTINGS MASTER
    // =========================================================

    [HttpGet("periods")]
    public async Task<IActionResult> GetPeriodSettings()
    {
        var periods = await _timetableService.GetPeriodSettingsAsync();
        return Ok(periods);
    }

    [HttpPost("periods")]
    public async Task<IActionResult> SavePeriodSetting([FromBody] SavePeriodSettingDto dto)
    {
        var result = await _timetableService.SavePeriodSettingAsync(dto);
        return Ok(result);
    }

    [HttpDelete("periods/{periodId}")]
    public async Task<IActionResult> DeletePeriodSetting(int periodId)
    {
        var success = await _timetableService.DeletePeriodSettingAsync(periodId);
        if (!success) return NotFound(new { message = $"Period setting ID {periodId} not found." });
        return Ok(new { message = "Period setting deleted successfully." });
    }

    // =========================================================
    // 3. AUTO-GENERATED TEACHER & STUDENT TIMETABLES
    // =========================================================

    [HttpGet("teacher/{teacherId}")]
    public async Task<IActionResult> GetTeacherTimetable(int teacherId, [FromQuery] string academicYear = "2026-2027")
    {
        var result = await _timetableService.GetTeacherTimetableAsync(teacherId, academicYear);
        return Ok(result);
    }

    [HttpGet("student")]
    public async Task<IActionResult> GetStudentTimetable([FromQuery] int classId, [FromQuery] int sectionId, [FromQuery] string academicYear = "2026-2027")
    {
        var result = await _timetableService.GetStudentTimetableAsync(classId, sectionId, academicYear);
        return Ok(result);
    }

    // =========================================================
    // 4. COPY CLASS TIMETABLE UTILITY
    // =========================================================

    [HttpPost("copy")]
    public async Task<IActionResult> CopyTimetable([FromBody] CopyTimetableDto dto)
    {
        var result = await _timetableService.CopyTimetableAsync(dto);
        return Ok(result);
    }

    // =========================================================
    // 5. HELPER ENDPOINTS
    // =========================================================

    [HttpGet("subjects-for-class")]
    public async Task<IActionResult> GetSubjectsForClass([FromQuery] int classId, [FromQuery] int sectionId)
    {
        var candidates = await _timetableService.GetClassSubjectsCandidatesAsync(classId, sectionId);
        return Ok(candidates);
    }
}
