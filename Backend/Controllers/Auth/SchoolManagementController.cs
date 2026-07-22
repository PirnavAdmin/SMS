using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SchoolManagementController : ControllerBase
    {
        private readonly ISchoolService _schoolService;

        public SchoolManagementController(ISchoolService schoolService)
        {
            _schoolService = schoolService;
        }

        [HttpGet("subjects")]
        public async Task<IActionResult> GetSubjects()
        {
            var data = await _schoolService.GetAllSubjectsAsync();
            return Ok(new { success = true, data });
        }

        [HttpPost("subjects")]
        public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectDto dto)
        {
            await _schoolService.CreateSubjectAsync(dto);
            return Ok(new { success = true, message = "Subject created successfully." });
        }

        [HttpPut("subjects/{id}")]
        public async Task<IActionResult> UpdateSubject(string id, [FromBody] UpdateSubjectDto dto)
        {
            await _schoolService.UpdateSubjectAsync(id, dto);
            return Ok(new { success = true, message = "Subject updated successfully." });
        }

        [HttpGet("staff")]
        public async Task<IActionResult> GetStaff([FromQuery] string? search, [FromQuery] string? department)
        {
            var data = await _schoolService.GetStaffDirectoryAsync(search, department);
            return Ok(new { success = true, data });
        }

        [HttpPost("staff")]
        public async Task<IActionResult> RegisterStaff([FromBody] RegisterStaffDto dto)
        {
            await _schoolService.RegisterStaffAsync(dto);
            return Ok(new { success = true, message = "Staff registered successfully." });
        }

        [HttpGet("classes")]
        public async Task<IActionResult> GetClasses()
        {
            var data = await _schoolService.GetClassesOverviewAsync();
            return Ok(new { success = true, data });
        }

        [HttpPost("classes")]
        public async Task<IActionResult> CreateClass([FromBody] CreateClassDto dto)
        {
            var classId = await _schoolService.CreateClassGradeAsync(dto);
            return Ok(new { success = true, message = "Class created successfully.", classId });
        }

        [HttpGet("admissions")]
        public async Task<IActionResult> GetAdmissions([FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? appliedClass)
        {
            var data = await _schoolService.GetAdmissionsAsync(search, status, appliedClass);
            return Ok(new { success = true, data });
        }

        [HttpPost("admissions")]
        public async Task<IActionResult> CreateAdmission([FromBody] CreateAdmissionDto dto)
        {
            var registrationNo = await _schoolService.SubmitAdmissionAsync(dto);
            return Ok(new { success = true, message = "Application submitted successfully.", registrationNo });
        }

        [HttpPatch("admissions/{registrationNo}/status")]
        public async Task<IActionResult> UpdateAdmissionStatus(string registrationNo, [FromBody] UpdateStatusDto dto)
        {
            await _schoolService.UpdateAdmissionStatusAsync(registrationNo, dto.Status);
            return Ok(new { success = true, message = $"Status updated to {dto.Status}." });
        }
    }
}