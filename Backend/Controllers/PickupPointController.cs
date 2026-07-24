using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.PickupPoint;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/pickup-points")]
    [Authorize(Roles = "Admin")]
    public class PickupPointController : ControllerBase
    {
        private readonly IPickupPointService _service;

        public PickupPointController(IPickupPointService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] PickupPointFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (long.TryParse(id, out long pickupId))
            {
                var result = await _service.GetByIdAsync(pickupId);
                if (result != null) return Ok(result);
            }

            var paged = await _service.GetAllAsync(new PickupPointFilterDto { PageSize = 1000 });
            var found = paged.Items.FirstOrDefault(p => 
                string.Equals(p.PickupPointName, id, StringComparison.OrdinalIgnoreCase) || 
                string.Equals(p.PickupPointId.ToString(), id));

            if (found == null) return NotFound();
            return Ok(found);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePickupPointDto dto)
        {
            var id = await _service.CreateAsync(dto, null);
            var result = await _service.GetByIdAsync(id);

            return Ok(new
            {
                success = true,
                message = "Pickup Point created successfully.",
                data = result
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] UpdatePickupPointDto dto)
        {
            long? targetId = null;
            if (long.TryParse(id, out long parsedId))
            {
                targetId = parsedId;
            }
            else
            {
                var paged = await _service.GetAllAsync(new PickupPointFilterDto { PageSize = 1000 });
                var found = paged.Items.FirstOrDefault(p => 
                    string.Equals(p.PickupPointName, id, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(p.PickupPointId.ToString(), id) ||
                    string.Equals(p.PickupPointName, dto.PickupPointName, StringComparison.OrdinalIgnoreCase));
                if (found != null) targetId = found.PickupPointId;
            }

            if (targetId.HasValue)
            {
                var updated = await _service.UpdateAsync(targetId.Value, dto, null);
                if (updated)
                {
                    var updatedDto = await _service.GetByIdAsync(targetId.Value);
                    return Ok(new { success = true, message = "Pickup Point updated successfully.", data = updatedDto });
                }
            }

            // Fallback create pickup point
            var createDto = new CreatePickupPointDto
            {
                RouteId = dto.RouteId > 0 ? dto.RouteId : 1,
                PickupPointName = !string.IsNullOrWhiteSpace(dto.PickupPointName) ? dto.PickupPointName : id,
                Landmark = dto.Landmark ?? "",
                SequenceNo = dto.SequenceNo > 0 ? dto.SequenceNo : 1,
                PickupTime = dto.PickupTime,
                DistanceFromStart = dto.DistanceFromStart,
                Status = dto.Status
            };

            var newId = await _service.CreateAsync(createDto, null);
            var newDto = await _service.GetByIdAsync(newId);
            return Ok(new { success = true, message = "Pickup Point updated successfully.", data = newDto });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            long? targetId = null;
            if (long.TryParse(id, out long parsedId))
            {
                targetId = parsedId;
            }
            else
            {
                var paged = await _service.GetAllAsync(new PickupPointFilterDto { PageSize = 1000 });
                var found = paged.Items.FirstOrDefault(p => 
                    string.Equals(p.PickupPointName, id, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(p.PickupPointId.ToString(), id));
                if (found != null) targetId = found.PickupPointId;
            }

            if (targetId.HasValue)
            {
                await _service.DeleteAsync(targetId.Value, null);
            }

            return Ok(new { success = true, message = "Pickup Point deleted successfully." });
        }
    }
}
