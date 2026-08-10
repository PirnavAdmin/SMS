namespace SMS.Api.Controllers.AcademicManagement
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using SMS.Api.Dtos.AcademicManagement;
    using SMS.Api.Services.Interfaces;
    using System.Threading.Tasks;

    [ApiController]
    [Route("api/subjects")]
    [Authorize]
    [Tags("Academic Subjects")]
    public class SubjectsController : ControllerBase
    {
        private readonly ISchoolService _schoolService;

        public SubjectsController(ISchoolService schoolService)
        {
            _schoolService = schoolService;
        }

        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetSubjects([FromQuery] string? search) =>
            Ok(new { success = true, data = await _schoolService.GetAllSubjectsAsync(search) });

        [HttpGet("{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetSubjectById(int id) =>
            Ok(new { success = true, data = await _schoolService.GetSubjectByIdAsync(id) });

        [HttpGet("dropdown")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetSubjectsDropdown([FromQuery] string? search) =>
            Ok(new { success = true, data = await _schoolService.GetSubjectsDropdownAsync(search) });

        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectDto dto) =>
            Ok(new { success = true, message = "Subject created successfully.", data = await _schoolService.CreateSubjectAsync(dto) });

        [HttpPut("{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> UpdateSubject(int id, [FromBody] CreateSubjectDto dto) =>
            Ok(new { success = true, message = "Subject updated successfully.", data = await _schoolService.UpdateSubjectAsync(id, dto) });

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> DeleteSubject(int id)
        {
            try
            {
                await _schoolService.DeleteSubjectAsync(id);
                return Ok(new { success = true, message = "Subject deleted successfully." });
            }
            catch (SMS.Api.Exceptions.NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return BadRequest(new { success = false, message = "Cannot delete subject. It is currently assigned to teachers, classes, timetables, or has associated homework/exams." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
