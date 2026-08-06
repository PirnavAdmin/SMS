namespace SMS.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;

[ApiController]
[Route("api/teacher/attendance")]
[Authorize(Roles = "Teacher")]
public class TeacherAttendanceController : ControllerBase
{
    private readonly ITeacherAttendanceService _service;

    public TeacherAttendanceController(
        ITeacherAttendanceService service)
    {
        _service = service;
    }

    // GET: api/teacher/attendance/today
    [HttpGet("today")]
    public async Task<IActionResult> GetTodayAttendance()
    {
        var email = GetTeacherEmail();

        var attendance =
            await _service.GetTodayAttendanceAsync(email);

        if (attendance == null)
        {
            return Ok(new
            {
                message = "Attendance has not been marked today.",
                attendance = (object?)null
            });
        }

        return Ok(attendance);
    }

    // GET: api/teacher/attendance/history
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(
        [FromQuery] TeacherAttendanceFilterDto filter)
    {
        var email = GetTeacherEmail();

        var result = await _service.GetHistoryAsync(
            email,
            filter);

        return Ok(result);
    }

    // POST: api/teacher/attendance/check-in
    [HttpPost("check-in")]
    public async Task<IActionResult> CheckIn(
        [FromBody] TeacherCheckInDto dto)
    {
        var email = GetTeacherEmail();

        var result = await _service.CheckInAsync(
            email,
            dto);

        return Ok(new
        {
            message = "Check-in completed successfully.",
            attendance = result
        });
    }

    // POST: api/teacher/attendance/check-out
    [HttpPost("check-out")]
    public async Task<IActionResult> CheckOut(
        [FromBody] TeacherCheckOutDto dto)
    {
        var email = GetTeacherEmail();

        var result = await _service.CheckOutAsync(
            email,
            dto);

        return Ok(new
        {
            message = "Check-out completed successfully.",
            attendance = result
        });
    }

    // POST: api/teacher/attendance/corrections
    [HttpPost("corrections")]
    public async Task<IActionResult> CreateCorrection(
        [FromBody] CreateAttendanceCorrectionDto dto)
    {
        var email = GetTeacherEmail();

        var result =
            await _service.CreateCorrectionAsync(
                email,
                dto);

        return StatusCode(
            StatusCodes.Status201Created,
            new
            {
                message =
                    "Attendance correction request submitted successfully.",
                correction = result
            });
    }

    // GET: api/teacher/attendance/corrections
    [HttpGet("corrections")]
    public async Task<IActionResult> GetCorrections()
    {
        var email = GetTeacherEmail();

        var result =
            await _service.GetCorrectionsAsync(email);

        return Ok(result);
    }

    private string GetTeacherEmail()
    {
        var email =
            User.FindFirstValue(ClaimTypes.Email) ??
            User.FindFirstValue("email") ??
            User.FindFirstValue(ClaimTypes.Name);

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new UnauthorizedAccessException(
                "Teacher email is missing from the login token.");
        }

        return email;
    }
}