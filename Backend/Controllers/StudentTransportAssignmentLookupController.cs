using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/lookups")]
    [Authorize(Roles = "Admin")]
    public class StudentTransportAssignmentLookupController : ControllerBase
    {
        private readonly IStudentTransportAssignmentService _service;

        public StudentTransportAssignmentLookupController(
            IStudentTransportAssignmentService service)
        {
            _service = service;
        }

        [HttpGet("student-assignments")]
        public async Task<IActionResult> GetLookup()
        {
            var result = await _service.GetLookupAsync();
            return Ok(result);
        }
    }
}