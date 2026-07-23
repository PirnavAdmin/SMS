using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Admission;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/admissions")]
    public class AdmissionController : ControllerBase
    {
        private readonly IAdmissionService _service;

        public AdmissionController(IAdmissionService service)
        {
            _service = service;
        }

        //---------------------------------------------------
        // Get All
        //---------------------------------------------------

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] AdmissionFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        //---------------------------------------------------
        // Get By Id
        //---------------------------------------------------

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _service.GetByIdAsync(id);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        //---------------------------------------------------
        // Create Admission
        //---------------------------------------------------

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAdmissionDto dto)
        {
            var userId = Convert.ToInt64(User.FindFirst("UserId")?.Value);

            var admissionId = await _service.CreateAsync(dto, userId);

            return Ok(new
            {
                Success = true,
                Message = "Admission created successfully.",
                AdmissionId = admissionId
            });
        }

        //---------------------------------------------------
        // Update Admission
        //---------------------------------------------------

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateAdmissionDto dto)
        {
            var userId = Convert.ToInt64(User.FindFirst("UserId")?.Value);

            var result = await _service.UpdateAsync(id, dto, userId);

            return Ok(new
            {
                Success = result,
                Message = "Admission updated successfully."
            });
        }

        //---------------------------------------------------
        // Update Status
        //---------------------------------------------------

        [HttpPut("status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateAdmissionStatusDto dto)
        {
            var userId = Convert.ToInt64(User.FindFirst("UserId")?.Value);

            var result = await _service.UpdateStatusAsync(dto, userId);

            return Ok(new
            {
                Success = result,
                Message = "Admission status updated successfully."
            });
        }

        //---------------------------------------------------
        // Delete
        //---------------------------------------------------

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var userId = Convert.ToInt64(User.FindFirst("UserId")?.Value);

            var result = await _service.DeleteAsync(id, userId);

            return Ok(new
            {
                Success = result,
                Message = "Admission deleted successfully."
            });
        }
    }
}