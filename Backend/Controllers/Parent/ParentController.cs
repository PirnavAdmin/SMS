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
    [AllowAnonymous]
    [Tags("Parent Portal Operations")]
    public class ParentController : ControllerBase
    {
        private readonly IParentService _parentService;

        public ParentController(IParentService parentService)
        {
            _parentService = parentService;
        }

        private string GetParentIdentifier()
        {
            var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
            var mobileClaim = User.FindFirst(ClaimTypes.MobilePhone)?.Value;
            var nameClaim = User.FindFirst(ClaimTypes.Name)?.Value;

            var headerIdentifier = Request.Headers["X-Parent-Identifier"].ToString();
            if (!string.IsNullOrWhiteSpace(headerIdentifier))
                return headerIdentifier;

            return emailClaim ?? mobileClaim ?? nameClaim ?? "parent@pirnavschools.edu";
        }

        [HttpGet("children")]
        public async Task<IActionResult> GetChildren([FromQuery] string? identifier)
        {
            var parentId = !string.IsNullOrWhiteSpace(identifier) ? identifier : GetParentIdentifier();
            var children = await _parentService.GetChildrenAsync(parentId);
            return Ok(new { success = true, data = children });
        }

        [HttpGet("dashboard/{studentId:int}")]
        public async Task<IActionResult> GetDashboardSummary(int studentId)
        {
            var summary = await _parentService.GetDashboardSummaryAsync(studentId);
            return Ok(new { success = true, data = summary });
        }

        [HttpGet("student/{studentId:int}")]
        public async Task<IActionResult> GetStudentDetails(int studentId)
        {
            var details = await _parentService.GetStudentDetailsAsync(studentId);
            if (details == null)
                return NotFound(new { success = false, message = "Student not found." });

            return Ok(new { success = true, data = details });
        }

        [HttpGet("attendance/{studentId:int}")]
        public async Task<IActionResult> GetAttendanceSummary(int studentId)
        {
            var summary = await _parentService.GetAttendanceSummaryAsync(studentId);
            return Ok(new { success = true, data = summary });
        }

        [HttpGet("timetable/{studentId:int}")]
        public async Task<IActionResult> GetTimetable(int studentId)
        {
            var timetable = await _parentService.GetTimetableAsync(studentId);
            return Ok(new { success = true, data = timetable });
        }

        [HttpGet("homework/{studentId:int}")]
        public async Task<IActionResult> GetHomework(int studentId)
        {
            var homework = await _parentService.GetHomeworkAsync(studentId);
            return Ok(new { success = true, data = homework });
        }

        [HttpGet("report-cards/{studentId:int}")]
        [HttpGet("exam-results/{studentId:int}")]
        public async Task<IActionResult> GetExamResults(int studentId)
        {
            var results = await _parentService.GetExamResultsAsync(studentId);
            return Ok(new { success = true, data = results });
        }

        [HttpGet("fee-details/{studentId:int}")]
        public async Task<IActionResult> GetFeeSummary(int studentId)
        {
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
            var response = await _parentService.PayFeeAsync(request);
            return Ok(new { success = true, data = response });
        }

        [HttpGet("teachers/{studentId:int}")]
        public async Task<IActionResult> GetTeachers(int studentId)
        {
            var teachers = await _parentService.GetTeachersAsync(studentId);
            return Ok(new { success = true, data = teachers });
        }

        [HttpGet("transport/{studentId:int}")]
        public async Task<IActionResult> GetTransportInfo(int studentId)
        {
            var transport = await _parentService.GetTransportInfoAsync(studentId);
            return Ok(new { success = true, data = transport });
        }

        [HttpGet("hostel/{studentId:int}")]
        public async Task<IActionResult> GetHostelInfo(int studentId)
        {
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
