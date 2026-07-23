using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.Vehicle;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/v1/transport/vehicles")]
    public class TransportVehicleController : ControllerBase
    {
        private readonly ITransportVehicleService _service;

        public TransportVehicleController(ITransportVehicleService service)
        {
            _service = service;
        }

        // GET: api/v1/transport/vehicles
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] TransportVehicleFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        // GET: api/v1/transport/vehicles/{id}
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _service.GetByIdAsync(id);

            if (result == null)
                return NotFound();

            return Ok(result);
        }

        // POST: api/v1/transport/vehicles
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTransportVehicleDto dto)
        {
            var id = await _service.CreateAsync(dto, null);

            return CreatedAtAction(
                nameof(GetById),
                new { id },
                new { VehicleId = id });
        }

        // PUT: api/v1/transport/vehicles/{id}
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(
            long id,
            [FromBody] UpdateTransportVehicleDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto, null);

            if (!updated)
                return NotFound();

            return Ok(new
            {
                Message = "Vehicle updated successfully."
            });
        }

        // DELETE: api/v1/transport/vehicles/{id}
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var deleted = await _service.DeleteAsync(id, null);

            if (!deleted)
                return NotFound();

            return Ok(new
            {
                Message = "Vehicle deleted successfully."
            });
        }
    }
}