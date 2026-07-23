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
        public async Task<IActionResult> GetAll([FromQuery] PickupPointFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        // GET: api/v1/transport/pickup-points/5
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _service.GetByIdAsync(id);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        // POST: api/v1/transport/pickup-points
        [HttpPost]
        public async Task<IActionResult> Create(CreatePickupPointDto dto)
        {
            var id = await _service.CreateAsync(dto, null);

            return CreatedAtAction(
                nameof(GetById),
                new { id },
                new { PickupPointId = id });
        }

        // PUT: api/v1/transport/pickup-points/5
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(
            long id,
            UpdatePickupPointDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto, null);

            if (!updated)
                return NotFound();

            return Ok(new
            {
                Message = "Pickup Point updated successfully."
            });
        }

        // DELETE: api/v1/transport/pickup-points/5
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var deleted = await _service.DeleteAsync(id, null);

            if (!deleted)
                return NotFound();

            return Ok(new
            {
                Message = "Pickup Point deleted successfully."
            });
        }
    }
}