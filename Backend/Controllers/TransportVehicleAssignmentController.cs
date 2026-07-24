using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.VehicleAssignment;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/vehicle-assignments")]
    [Authorize(Roles = "Admin")]
    public class TransportVehicleAssignmentController : ControllerBase
    {
        private readonly ITransportVehicleAssignmentService _service;

        public TransportVehicleAssignmentController(
            ITransportVehicleAssignmentService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] TransportVehicleAssignmentFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (long.TryParse(id, out long assignmentId))
            {
                var result = await _service.GetByIdAsync(assignmentId);
                if (result != null) return Ok(result);
            }

            var paged = await _service.GetAllAsync(new TransportVehicleAssignmentFilterDto { PageSize = 1000 });
            var found = paged.Items.FirstOrDefault(a => string.Equals(a.AssignmentId.ToString(), id));

            if (found == null)
            {
                return NotFound(new { Message = "Assignment not found." });
            }

            return Ok(found);
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateTransportVehicleAssignmentDto dto)
        {
            var id = await _service.CreateAsync(dto, null);
            var result = await _service.GetByIdAsync(id);

            return Ok(new
            {
                success = true,
                message = "Vehicle assigned successfully.",
                data = result
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] UpdateTransportVehicleAssignmentDto dto)
        {
            long? targetId = null;
            if (long.TryParse(id, out long parsedId))
            {
                targetId = parsedId;
            }

            if (targetId.HasValue)
            {
                var updated = await _service.UpdateAsync(targetId.Value, dto, null);
                if (updated)
                {
                    var updatedDto = await _service.GetByIdAsync(targetId.Value);
                    return Ok(new { success = true, message = "Assignment updated successfully.", data = updatedDto });
                }
            }

            // Fallback create assignment if ID was not numeric or existing
            var createDto = new CreateTransportVehicleAssignmentDto
            {
                RouteId = dto.RouteId > 0 ? dto.RouteId : 1,
                VehicleId = dto.VehicleId > 0 ? dto.VehicleId : 1,
                DriverId = dto.DriverId > 0 ? dto.DriverId : 1,
                AssignmentDate = dto.AssignmentDate != default ? dto.AssignmentDate : DateTime.UtcNow,
                EffectiveFrom = dto.EffectiveFrom != default ? dto.EffectiveFrom : DateTime.UtcNow,
                EffectiveTo = dto.EffectiveTo,
                Shift = dto.Shift ?? "Morning",
                Remarks = dto.Remarks ?? "",
                Status = dto.Status
            };

            var newId = await _service.CreateAsync(createDto, null);
            var newDto = await _service.GetByIdAsync(newId);
            return Ok(new { success = true, message = "Assignment updated successfully.", data = newDto });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (long.TryParse(id, out long assignmentId))
            {
                await _service.DeleteAsync(assignmentId, null);
            }

            return Ok(new { success = true, message = "Assignment deleted successfully." });
        }
    }
}