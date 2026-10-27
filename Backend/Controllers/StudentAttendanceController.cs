namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Repositories.Interfaces.Parent;
using SMS.Api.Services.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/attendance/student")]
[Authorize]
[Tags("Attendance Register")]
public class StudentAttendanceController : ControllerBase
{
    private readonly IStudentAttendanceService _service;
    private readonly IParentRepository _parentRepository;
    private readonly AppDbContext _context;

    public StudentAttendanceController(
        IStudentAttendanceService service,
        IParentRepository parentRepository,
        AppDbContext context)
    {
        _service = service;
        _parentRepository = parentRepository;
        _context = context;
    }

    /// <summary>
    /// Get Attendance Register with Summary Cards and Daily Records (accessible by Student, Parent, Teacher, Admin)
    /// </summary>
    [HttpGet("register")]
    [Authorize]
    public async Task<IActionResult> GetStudentAttendanceRegister([FromQuery] StudentAttendanceRegisterQueryDto query)
    {
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "";
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "";
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        if (string.Equals(userRole, "Parent", StringComparison.OrdinalIgnoreCase))
        {
            var children = await _parentRepository.GetChildrenByParentIdentifierAsync(userEmail.Length > 0 ? userEmail : userId);
            var childIds = children.Select(c => c.StudentId).Distinct().ToList();
            if (query.StudentId.HasValue && query.StudentId.Value > 0)
            {
                if (!childIds.Contains(query.StudentId.Value))
                {
                    return Ok(new { success = true, data = new StudentAttendanceRegisterResponseDto { Records = new List<StudentAttendanceRecordDto>() } });
                }
            }
            else if (childIds.Count > 0)
            {
                query.StudentId = childIds.First();
            }
            else
            {
                return Ok(new { success = true, data = new StudentAttendanceRegisterResponseDto { Records = new List<StudentAttendanceRecordDto>() } });
            }
        }
        else if (string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            int? studentId = null;
            if (int.TryParse(userId, out int parsedStuId))
            {
                studentId = parsedStuId;
            }
            else if (!string.IsNullOrWhiteSpace(userEmail))
            {
                var stu = await _context.Students.AsNoTracking().FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == userEmail.ToLower());
                if (stu != null) studentId = stu.StudentId;
            }

            if (studentId.HasValue)
            {
                query.StudentId = studentId.Value;
            }
            else
            {
                return Ok(new { success = true, data = new StudentAttendanceRegisterResponseDto { Records = new List<StudentAttendanceRecordDto>() } });
            }
        }

        var result = await _service.GetStudentAttendanceRegisterAsync(query);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get all student attendance records matching optional filters
    /// </summary>
    [HttpGet("all")]
    [Authorize]
    public async Task<IActionResult> GetAllStudentAttendanceRecords([FromQuery] StudentAttendanceUniversalQueryDto query)
    {
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "";
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "";
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        // If parent, restrict to their children
        if (string.Equals(userRole, "Parent", StringComparison.OrdinalIgnoreCase))
        {
            var children = await _parentRepository.GetChildrenByParentIdentifierAsync(userEmail.Length > 0 ? userEmail : userId);
            var childIds = children.Select(c => c.StudentId).Distinct().ToList();
            if (childIds.Count == 0)
            {
                return Ok(new { success = true, data = new List<StudentAttendanceUniversalDto>() });
            }

            if (query.StudentId.HasValue && query.StudentId.Value > 0)
            {
                if (!childIds.Contains(query.StudentId.Value))
                {
                    return Ok(new { success = true, data = new List<StudentAttendanceUniversalDto>() });
                }
            }
            else
            {
                query.StudentIds = childIds;
            }
        }
        // If student, restrict to their own records
        else if (string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            int? studentId = null;
            if (int.TryParse(userId, out int parsedStuId))
            {
                studentId = parsedStuId;
            }
            else if (!string.IsNullOrWhiteSpace(userEmail))
            {
                var stu = await _context.Students.AsNoTracking().FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == userEmail.ToLower());
                if (stu != null) studentId = stu.StudentId;
            }

            if (studentId.HasValue)
            {
                query.StudentId = studentId.Value;
            }
            else
            {
                return Ok(new { success = true, data = new List<StudentAttendanceUniversalDto>() });
            }
        }

        var result = await _service.GetAllAttendanceRecordsAsync(query);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Alias endpoint for fetching records
    /// </summary>
    [HttpGet("records")]
    [Authorize]
    public async Task<IActionResult> GetRecords([FromQuery] StudentAttendanceUniversalQueryDto query)
    {
        return await GetAllStudentAttendanceRecords(query);
    }

    /// <summary>
    /// Bulk save / update student attendance records (accessible by Admin, Teacher, Staff, SuperAdmin)
    /// </summary>
    [HttpPost("bulk")]
    [Authorize]
    public async Task<IActionResult> BulkSaveStudentAttendance([FromBody] BulkSaveStudentAttendanceDto dto)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "";
        if (string.Equals(role, "Student", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "Parent", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        int? staffId = null;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdClaim, out int parsedId))
        {
            staffId = parsedId;
        }

        var result = await _service.BulkSaveStudentAttendanceAsync(dto, staffId);
        return Ok(result);
    }

    /// <summary>
    /// Mark single student attendance
    /// </summary>
    [HttpPost("mark")]
    [Authorize]
    public async Task<IActionResult> MarkStudentAttendance([FromBody] MarkStudentAttendanceDto dto)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "";
        if (string.Equals(role, "Student", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "Parent", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var result = await _service.MarkStudentAttendanceAsync(dto);
        return Ok(new { success = result, message = "Attendance marked successfully." });
    }
}
