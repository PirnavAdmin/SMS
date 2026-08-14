namespace SMS.Api.Controllers.StaffManagement;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System.Security.Claims;

[ApiController]
[Route("api/teacher/student-attendance")]
[Authorize(Roles = "Teacher")]
public class TeacherStudentAttendanceController : ControllerBase
{
    private readonly ITeacherStudentAttendanceService _service;

    public TeacherStudentAttendanceController(
        ITeacherStudentAttendanceService service)
    {
        _service = service;
    }

    [HttpGet("options/branches")]
    public async Task<IActionResult> GetBranches() =>
        Ok(await _service.GetBranchesAsync(GetTeacherEmail()));

    [HttpGet("options/academic-years")]
    public async Task<IActionResult> GetAcademicYears() =>
        Ok(await _service.GetAcademicYearsAsync(GetTeacherEmail()));

    [HttpGet("options/classes")]
    public async Task<IActionResult> GetClasses(
        [FromQuery] int branchId,
        [FromQuery] int academicYearId) =>
        Ok(await _service.GetClassesAsync(
            GetTeacherEmail(), branchId, academicYearId));

    [HttpGet("options/sections")]
    public async Task<IActionResult> GetSections([FromQuery] int classId) =>
        Ok(await _service.GetSectionsAsync(GetTeacherEmail(), classId));

    [HttpGet("options/subjects")]
    public async Task<IActionResult> GetSubjects(
        [FromQuery] int classId,
        [FromQuery] int sectionId) =>
        Ok(await _service.GetSubjectsAsync(
            GetTeacherEmail(), classId, sectionId));

    [HttpGet("options/periods")]
    public async Task<IActionResult> GetPeriods(
        [FromQuery] DateTime date,
        [FromQuery] int classId,
        [FromQuery] int sectionId,
        [FromQuery] int subjectId) =>
        Ok(await _service.GetPeriodsAsync(
            GetTeacherEmail(), date, classId, sectionId, subjectId));

    [HttpGet("sheet")]
    public async Task<IActionResult> GetSheet(
        [FromQuery] TeacherAttendanceSheetQueryDto query) =>
        Ok(await _service.GetSheetAsync(GetTeacherEmail(), query));

    [HttpPut("sheet")]
    public async Task<IActionResult> SaveSheet(
        [FromBody] SaveTeacherAttendanceSheetDto dto) =>
        Ok(await _service.SaveSheetAsync(GetTeacherEmail(), dto));

    [HttpPut("sheet/{attendanceSessionId:int}/lock")]
    public async Task<IActionResult> Lock(int attendanceSessionId) =>
        Ok(await _service.LockAsync(GetTeacherEmail(), attendanceSessionId));

    [HttpPut("sheet/{attendanceSessionId:int}/unlock")]
    public async Task<IActionResult> Unlock(int attendanceSessionId) =>
        Ok(await _service.UnlockAsync(GetTeacherEmail(), attendanceSessionId));

    private string GetTeacherEmail()
    {
        return User.FindFirstValue(ClaimTypes.Email)
            ?? throw new UnauthorizedAccessException(
                "The logged-in token does not contain an email claim.");
    }
}

