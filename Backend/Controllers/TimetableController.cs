namespace SMS.Api.Controllers;

using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Timetable & Class Schedule")]
public class TimetableController : ControllerBase
{
    private readonly ITimetableService _timetableService;

    public TimetableController(ITimetableService timetableService)
    {
        _timetableService = timetableService;
    }

    /// <summary>
    /// Get dropdown options for Academic Years and Days of the Week
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public IActionResult GetTimetableDropdownOptions()
    {
        var academicYears = new[] { "2026-27", "2027-28", "2025-26" };
        var days = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };

        return Ok(new
        {
            success = true,
            data = new
            {
                academicYears,
                days
            }
        });
    }

    /// <summary>
    /// Get Student Class Schedule Timetable (supports Academic Year & Day Filter: Monday, Tuesday, etc.)
    /// </summary>
    [HttpGet("student")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetStudentTimetable(
        [FromQuery] int classId = 0,
        [FromQuery] int sectionId = 0,
        [FromQuery] string academicYear = "2026-2027",
        [FromQuery] string? dayOfWeek = null)
    {
        var result = await _timetableService.GetStudentTimetableAsync(classId, sectionId, academicYear);

        if (!string.IsNullOrWhiteSpace(dayOfWeek) && !dayOfWeek.Equals("All", System.StringComparison.OrdinalIgnoreCase))
        {
            var filteredDays = result.Days
                .Where(d => d.DayOfWeek.Equals(dayOfWeek, System.StringComparison.OrdinalIgnoreCase))
                .ToList();

            return Ok(new
            {
                success = true,
                data = new
                {
                    result.ClassId,
                    result.ClassName,
                    result.SectionId,
                    result.SectionName,
                    result.AcademicYear,
                    dayFilter = dayOfWeek,
                    days = filteredDays
                }
            });
        }

        return Ok(new { success = true, data = result });
    }

    [HttpGet("class-grid")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetClassTimetableGrid([FromQuery] int classId = 0, [FromQuery] int sectionId = 0, [FromQuery] string academicYear = "2026-2027")
    {
        var result = await _timetableService.GetClassTimetableGridAsync(classId, sectionId, academicYear);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("periods")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetPeriodSettings()
    {
        var periods = await _timetableService.GetPeriodSettingsAsync();
        return Ok(new { success = true, data = periods });
    }

    [HttpGet("teacher/{teacherId}")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetTeacherTimetable(int teacherId, [FromQuery] string academicYear = "2026-2027")
    {
        var result = await _timetableService.GetTeacherTimetableAsync(teacherId, academicYear);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("subjects-for-class")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetSubjectsForClass([FromQuery] int classId, [FromQuery] int sectionId)
    {
        var candidates = await _timetableService.GetClassSubjectsCandidatesAsync(classId, sectionId);
        return Ok(new { success = true, data = candidates });
    }
}
