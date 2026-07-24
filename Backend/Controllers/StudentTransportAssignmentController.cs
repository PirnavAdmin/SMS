using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.StudentTransportAssignment;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/student-assignments")]
    [Authorize(Roles = "Admin")]
    public class StudentTransportAssignmentController : ControllerBase
    {
        private readonly IStudentTransportAssignmentService _service;

        public StudentTransportAssignmentController(
            IStudentTransportAssignmentService service)
        {
            _service = service;
        }

        //---------------------------------------------------------
        // GET ALL
        //---------------------------------------------------------

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] StudentTransportAssignmentFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        //---------------------------------------------------------
        // GET BY ID
        //---------------------------------------------------------

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _service.GetByIdAsync(id);

            if (result == null)
            {
                return NotFound(new
                {
                    Message = "Student transport assignment not found."
                });
            }

            return Ok(result);
        }

        //---------------------------------------------------------
        // CREATE
        //---------------------------------------------------------

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateStudentTransportAssignmentDto dto)
        {
            var id = await _service.CreateAsync(dto, null);

            return CreatedAtAction(
                nameof(GetById),
                new { id },
                new
                {
                    StudentTransportAssignmentId = id,
                    Message = "Student transport assigned successfully."
                });
        }

        //---------------------------------------------------------
        // UPDATE
        //---------------------------------------------------------

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(
            long id,
            [FromBody] UpdateStudentTransportAssignmentDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto, null);

            if (!updated)
            {
                return NotFound(new
                {
                    Message = "Student transport assignment not found."
                });
            }

            return Ok(new
            {
                Message = "Student transport assignment updated successfully."
            });
        }

        //---------------------------------------------------------
        // DELETE
        //---------------------------------------------------------

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var deleted = await _service.DeleteAsync(id, null);

            if (!deleted)
            {
                return NotFound(new
                {
                    Message = "Student transport assignment not found."
                });
            }

            return Ok(new
            {
                Message = "Student transport assignment deleted successfully."
            });
        }
    }
}