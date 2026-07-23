using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.PickupPoint;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/v1/transport/pickup-points")]
    public class PickupPointController : ControllerBase
    {
        private readonly IPickupPointService _service;

        public PickupPointController(IPickupPointService service)
        {
            _service = service;
        }

        // GET: api/v1/transport/pickup-points
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] PickupPointFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);

            return Ok(new
            {
                success = true,
                data = result
            });
        }

        // GET: api/v1/transport/pickup-points/5
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var pickupPoint = await _service.GetByIdAsync(id);

            if (pickupPoint == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Pickup Point not found."
                });
            }

            return Ok(new
            {
                success = true,
                data = pickupPoint
            });
        }

        // POST: api/v1/transport/pickup-points
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreatePickupPointDto dto)
        {
            var pickupPointId =
                await _service.CreateAsync(dto, null);

            var createdPickupPoint =
                await _service.GetByIdAsync(pickupPointId);

            return CreatedAtAction(
                nameof(GetById),
                new { id = pickupPointId },
                new
                {
                    success = true,
                    message = "Pickup Point created successfully.",
                    data = createdPickupPoint
                });
        }

        // PUT: api/v1/transport/pickup-points/5
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(
            long id,
            [FromBody] UpdatePickupPointDto dto)
        {
            var updated =
                await _service.UpdateAsync(id, dto, null);

            if (!updated)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Pickup Point not found."
                });
            }

            var updatedPickupPoint =
                await _service.GetByIdAsync(id);

            return Ok(new
            {
                success = true,
                message = "Pickup Point updated successfully.",
                data = updatedPickupPoint
            });
        }

        // DELETE: api/v1/transport/pickup-points/5
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var deleted =
                await _service.DeleteAsync(id, null);

            if (!deleted)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Pickup Point not found."
                });
            }

            return Ok(new
            {
                success = true,
                message = "Pickup Point deleted successfully."
            });
        }
    }
}