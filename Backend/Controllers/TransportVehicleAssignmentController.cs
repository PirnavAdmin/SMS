using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.VehicleAssignment;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/v1/transport/vehicle-assignments")]
    public class TransportVehicleAssignmentController : ControllerBase
    {
        private readonly ITransportVehicleAssignmentService _service;

        public TransportVehicleAssignmentController(
            ITransportVehicleAssignmentService service)
        {
            _service = service;
        }

        //-------------------------------------------------------
        // GET ALL
        //-------------------------------------------------------

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] TransportVehicleAssignmentFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        //-------------------------------------------------------
        // GET BY ID
        //-------------------------------------------------------

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _service.GetByIdAsync(id);

            if (result == null)
            {
                return NotFound(new
                {
                    Message = "Assignment not found."
                });
            }

            return Ok(result);
        }

        //-------------------------------------------------------
        // CREATE
        //-------------------------------------------------------

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateTransportVehicleAssignmentDto dto)
        {
            var id = await _service.CreateAsync(dto, null);

            return CreatedAtAction(
                nameof(GetById),
                new { id },
                new
                {
                    AssignmentId = id,
                    Message = "Vehicle assigned successfully."
                });
        }

        //-------------------------------------------------------
        // UPDATE
        //-------------------------------------------------------

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(
            long id,
            [FromBody] UpdateTransportVehicleAssignmentDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto, null);

            if (!updated)
            {
                return NotFound(new
                {
                    Message = "Assignment not found."
                });
            }

            return Ok(new
            {
                Message = "Assignment updated successfully."
            });
        }

        //-------------------------------------------------------
        // DELETE
        //-------------------------------------------------------

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var deleted = await _service.DeleteAsync(id, null);

            if (!deleted)
            {
                return NotFound(new
                {
                    Message = "Assignment not found."
                });
            }

            return Ok(new
            {
                Message = "Assignment deleted successfully."
            });
        }
    }
}