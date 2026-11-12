namespace SMS.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;

[ApiController]
[Route("api/teacher/attendance")]
[Authorize(Roles = "SuperAdmin,Super Admin,Admin,Principal,Teacher,Hostel Warden,Driver,Librarian,Staff,Accountant,Receptionist,HR")]
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
        try
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
        catch (Exception)
        {
            return Ok(new
            {
                message = "Attendance has not been marked today.",
                attendance = (object?)null
            });
        }
    }

    // GET: api/teacher/attendance/history
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(
        [FromQuery] TeacherAttendanceFilterDto filter)
    {
        try
        {
            var email = GetTeacherEmail();
            if (string.IsNullOrWhiteSpace(email))
            {
                return Ok(new TeacherAttendancePagedResultDto());
            }

            var result = await _service.GetHistoryAsync(
                email,
                filter);

            return Ok(result ?? new TeacherAttendancePagedResultDto());
        }
        catch (KeyNotFoundException)
        {
            return Ok(new TeacherAttendancePagedResultDto());
        }
        catch (UnauthorizedAccessException)
        {
            return Ok(new TeacherAttendancePagedResultDto());
        }
        catch (Exception)
        {
            return Ok(new TeacherAttendancePagedResultDto());
        }
    }

    // POST: api/teacher/attendance/check-in
    [HttpPost("check-in")]
    public async Task<IActionResult> CheckIn(
        [FromBody] TeacherCheckInDto dto)
    {
        try
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
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    // POST: api/teacher/attendance/check-out
    [HttpPost("check-out")]
    public async Task<IActionResult> CheckOut(
        [FromBody] TeacherCheckOutDto dto)
    {
        try
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
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    // POST: api/teacher/attendance/corrections
    [HttpPost("corrections")]
    public async Task<IActionResult> CreateCorrection(
        [FromBody] CreateAttendanceCorrectionDto dto)
    {
        try
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
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    // GET: api/teacher/attendance/corrections
    [HttpGet("corrections")]
    public async Task<IActionResult> GetCorrections()
    {
        try
        {
            var email = GetTeacherEmail();
            if (string.IsNullOrWhiteSpace(email))
            {
                return Ok(new List<AttendanceCorrectionDto>());
            }

            var result =
                await _service.GetCorrectionsAsync(email);

            return Ok(result ?? new List<AttendanceCorrectionDto>());
        }
        catch (KeyNotFoundException)
        {
            return Ok(new List<AttendanceCorrectionDto>());
        }
        catch (UnauthorizedAccessException)
        {
            return Ok(new List<AttendanceCorrectionDto>());
        }
        catch (Exception)
        {
            return Ok(new List<AttendanceCorrectionDto>());
        }
    }

    private string GetTeacherEmail()
    {
        var staffId = User.FindFirstValue("StaffId") ?? User.FindFirstValue("staff_id");
        if (!string.IsNullOrWhiteSpace(staffId)) return staffId;

        var email =
            User.FindFirstValue(ClaimTypes.Email) ??
            User.FindFirstValue("email");
        if (!string.IsNullOrWhiteSpace(email)) return email;

        var empId = User.FindFirstValue("EmployeeId") ?? User.FindFirstValue("employee_id");
        if (!string.IsNullOrWhiteSpace(empId)) return empId;

        var nameId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return nameId ?? string.Empty;
    }
}
