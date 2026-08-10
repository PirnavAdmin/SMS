namespace SMS.Api.Controllers.AcademicManagement
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using SMS.Api.Dtos.AcademicManagement;
    using SMS.Api.Services.Interfaces;
    using SMS.Api.Exceptions;
    using System.Threading.Tasks;
    using System;

    [ApiController]
    [Route("api/designations")]
    [Authorize]
    [Tags("Designation Masters")]
    public class DesignationsController : ControllerBase
    {
        private readonly ISchoolService _schoolService;

        public DesignationsController(ISchoolService schoolService)
        {
            _schoolService = schoolService;
        }

        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetDesignations([FromQuery] string? search)
        {
            try
            {
                var result = await _schoolService.GetAllDesignationsAsync(search);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetDesignationById(int id)
        {
            try
            {
                var result = await _schoolService.GetDesignationByIdAsync(id);
                return Ok(new { success = true, data = result });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> CreateDesignation([FromBody] CreateDesignationMasterDto dto)
        {
            try
            {
                var result = await _schoolService.CreateDesignationAsync(dto);
                return Ok(new { success = true, message = "Designation created successfully.", data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> UpdateDesignation(int id, [FromBody] CreateDesignationMasterDto dto)
        {
            try
            {
                var result = await _schoolService.UpdateDesignationAsync(id, dto);
                return Ok(new { success = true, message = "Designation updated successfully.", data = result });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> DeleteDesignation(int id)
        {
            try
            {
                await _schoolService.DeleteDesignationAsync(id);
                return Ok(new { success = true, message = "Designation deleted successfully." });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return BadRequest(new { success = false, message = "Cannot delete designation. It is currently referenced by staff records in the database." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
