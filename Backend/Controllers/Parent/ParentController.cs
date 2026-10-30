using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Parent;
using SMS.Api.Services.Interfaces.Parent;

namespace SMS.Api.Controllers.Parent
{
    [ApiController]
    [Route("api/parent")]
    [Authorize]
    [Tags("Parent Portal Operations")]
    public class ParentController : ControllerBase
    {
        private readonly IParentService _parentService;

        public ParentController(IParentService parentService)
        {
            _parentService = parentService;
        }

        private bool TryGetAuthenticatedUserId(out int userId)
        {
            userId = 0;
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("id")?.Value
                        ?? User.FindFirst("sub")?.Value;

            return int.TryParse(claim, out userId) && userId > 0;
        }

        private async Task<bool> ValidateParentAccessAsync(int studentId)
        {
            if (studentId <= 0)
                return false;

            if (!TryGetAuthenticatedUserId(out int userId))
                return false; // Fail closed if unauthenticated

            // Administrators have oversight access across all student profiles
            if (User.IsInRole("Admin") || User.IsInRole("Super Admin") || User.IsInRole("SuperAdmin"))
                return true;

            var isParent = User.IsInRole("Parent") || string.Equals(User.FindFirst(ClaimTypes.Role)?.Value, "Parent", StringComparison.OrdinalIgnoreCase);
            if (!isParent)
                return false; // Fail closed if role is neither Parent nor Admin

            // Authoritative ownership check against database-backed parent_student_mappings
            return await _parentService.IsStudentAssociatedWithParentAsync(userId, studentId);
        }

        [HttpGet("children")]
        public async Task<IActionResult> GetChildren([FromQuery] string? identifier)
        {
            if (!TryGetAuthenticatedUserId(out int userId))
                return Unauthorized(new { success = false, message = "User not authenticated." });

            var isParent = User.IsInRole("Parent") || string.Equals(User.FindFirst(ClaimTypes.Role)?.Value, "Parent", StringComparison.OrdinalIgnoreCase);

            if (isParent)
            {
                // Parent callers MUST strictly see only their own mapped students.
                // Request parameters or headers are strictly ignored to prevent authorization bypass.
                var children = await _parentService.GetChildrenByUserIdAsync(userId);
                return Ok(new { success = true, data = children });
            }

            if (User.IsInRole("Admin") || User.IsInRole("Super Admin") || User.IsInRole("SuperAdmin"))
            {
                // Administrative users can query on behalf of a parent using immutable ID, exact email, or exact mobile
                if (!string.IsNullOrWhiteSpace(identifier))
                {
                    var adminChildren = await _parentService.GetChildrenAsync(identifier);
                    return Ok(new { success = true, data = adminChildren });
                }

                var children = await _parentService.GetChildrenByUserIdAsync(userId);
                return Ok(new { success = true, data = children });
            }

            return StatusCode(403, new { success = false, message = "Access denied: insufficient permissions." });
        }

        [HttpGet("dashboard/{studentId:int}")]
        public async Task<IActionResult> GetDashboardSummary(int studentId)
        {
            if (!await ValidateParentAccessAsync(studentId))
                return StatusCode(403, new { success = false, message = "Access denied: student not associated with this parent account." });

            var summary = await _parentService.GetDashboardSummaryAsync(studentId);
            return Ok(new { success = true, data = summary });
        }

        [HttpGet("student/{studentId:int}")]
        public async Task<IActionResult> GetStudentDetails(int studentId)
        {
            if (!await ValidateParentAccessAsync(studentId))
                return StatusCode(403, new { success = false, message = "Access denied: student not associated with this parent account." });

            var details = await _parentService.GetStudentDetailsAsync(studentId);
            if (details == null)
                return NotFound(new { success = false, message = "Student not found." });

            return Ok(new { success = true, data = details });
        }

        [HttpGet("attendance/{studentId:int}")]
        public async Task<IActionResult> GetAttendanceSummary(int studentId)
        {
            if (!await ValidateParentAccessAsync(studentId))
                return StatusCode(403, new { success = false, message = "Access denied: student not associated with this parent account." });

            var summary = await _parentService.GetAttendanceSummaryAsync(studentId);
            return Ok(new { success = true, data = summary });
        }

        [HttpGet("timetable/{studentId:int}")]
        public async Task<IActionResult> GetTimetable(int studentId)
        {
            if (!await ValidateParentAccessAsync(studentId))
                return StatusCode(403, new { success = false, message = "Access denied: student not associated with this parent account." });

            var timetable = await _parentService.GetTimetableAsync(studentId);
            return Ok(new { success = true, data = timetable });
        }

        [HttpGet("homework/{studentId:int}")]
        public async Task<IActionResult> GetHomework(int studentId)
        {
            if (!await ValidateParentAccessAsync(studentId))
                return StatusCode(403, new { success = false, message = "Access denied: student not associated with this parent account." });

            var homework = await _parentService.GetHomeworkAsync(studentId);
            return Ok(new { success = true, data = homework });
        }

        [HttpGet("report-cards/{studentId:int}")]
        [HttpGet("exam-results/{studentId:int}")]
        public async Task<IActionResult> GetExamResults(int studentId)
        {
            if (!await ValidateParentAccessAsync(studentId))
                return StatusCode(403, new { success = false, message = "Access denied: student not associated with this parent account." });

            var results = await _parentService.GetExamResultsAsync(studentId);
            return Ok(new { success = true, data = results });
        }

        [HttpGet("fee-details/{studentId:int}")]
        public async Task<IActionResult> GetFeeSummary(int studentId)
        {
            if (!await ValidateParentAccessAsync(studentId))
                return StatusCode(403, new { success = false, message = "Access denied: student not associated with this parent account." });

            var feeSummary = await _parentService.GetFeeSummaryAsync(studentId);
            return Ok(new { success = true, data = feeSummary });
        }

        [HttpPost("pay-fee")]
        public async Task<IActionResult> PayFee([FromBody] ParentFeePaymentRequestDto request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid payment request payload." });
            }
            if (!await ValidateParentAccessAsync(request.StudentId))
                return StatusCode(403, new { success = false, message = "Access denied: student not associated with this parent account." });

            var response = await _parentService.PayFeeAsync(request);
            return Ok(new { success = true, data = response });
        }

        [HttpGet("teachers/{studentId:int}")]
        public async Task<IActionResult> GetTeachers(int studentId)
        {
            if (!await ValidateParentAccessAsync(studentId))
                return StatusCode(403, new { success = false, message = "Access denied: student not associated with this parent account." });

            var teachers = await _parentService.GetTeachersAsync(studentId);
            return Ok(new { success = true, data = teachers });
        }

        [HttpGet("transport/{studentId:int}")]
        public async Task<IActionResult> GetTransportInfo(int studentId)
        {
            if (!await ValidateParentAccessAsync(studentId))
                return StatusCode(403, new { success = false, message = "Access denied: student not associated with this parent account." });

            var transport = await _parentService.GetTransportInfoAsync(studentId);
            return Ok(new { success = true, data = transport });
        }

        [HttpGet("hostel/{studentId:int}")]
        public async Task<IActionResult> GetHostelInfo(int studentId)
        {
            if (!await ValidateParentAccessAsync(studentId))
                return StatusCode(403, new { success = false, message = "Access denied: student not associated with this parent account." });

            var hostel = await _parentService.GetHostelInfoAsync(studentId);
            return Ok(new { success = true, data = hostel });
        }

        [HttpGet("events")]
        public async Task<IActionResult> GetUpcomingEvents()
        {
            var events = await _parentService.GetUpcomingEventsAsync();
            return Ok(new { success = true, data = events });
        }

        [HttpGet("communications")]
        public async Task<IActionResult> GetCommunications()
        {
            var communications = await _parentService.GetCommunicationsAsync();
            return Ok(new { success = true, data = communications });
        }
    }
}