namespace SMS.Api.Controllers.AcademicManagement
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using SMS.Api.Dtos.AcademicManagement;
    using SMS.Api.Services.Interfaces;
    using System.Threading.Tasks;

    [ApiController]
    [Route("api/departments")]
    [Authorize]
    [Tags("Academic Departments")]
    public class DepartmentsController : ControllerBase
    {
        private readonly ISchoolService _schoolService;

        public DepartmentsController(ISchoolService schoolService)
        {
            _schoolService = schoolService;
        }

        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetDepartments([FromQuery] string? search) =>
            Ok(new { success = true, data = await _schoolService.GetAllDepartmentsAsync(search) });

        [HttpGet("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetDepartmentById(string id) =>
            Ok(new { success = true, data = await _schoolService.GetDepartmentByIdAsync(id) });

        [HttpGet("dropdown")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetDepartmentsDropdown([FromQuery] string? search) =>
            Ok(new { success = true, data = await _schoolService.GetActiveDepartmentsDropdownAsync(search) });

        [HttpGet("{id}/subjects")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetSubjectsByDepartment(string id) =>
            Ok(new { success = true, data = await _schoolService.GetSubjectsByDepartmentIdAsync(id) });

        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentDto dto) =>
            Ok(new { success = true, message = "Department created successfully.", data = await _schoolService.CreateDepartmentAsync(dto) });

        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> UpdateDepartment(string id, [FromBody] CreateDepartmentDto dto) =>
            Ok(new { success = true, message = "Department updated successfully.", data = await _schoolService.UpdateDepartmentAsync(id, dto) });

        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> DeleteDepartment(string id)
        {
            try
            {
                await _schoolService.DeleteDepartmentAsync(id);
                return Ok(new { success = true, message = "Department deleted successfully." });
            }
            catch (SMS.Api.Exceptions.NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return BadRequest(new { success = false, message = "Cannot delete department. It is currently referenced by other records (e.g., staff or subject records) in the database." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
