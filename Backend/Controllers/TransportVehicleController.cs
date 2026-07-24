using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.Vehicle;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/vehicles")]
    [Authorize(Roles = "Admin")]
    public class TransportVehicleController : ControllerBase
    {
        private readonly ITransportVehicleService _service;

        public TransportVehicleController(ITransportVehicleService service)
        {
            _service = service;
        }

        // GET: api/transport/vehicles
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] TransportVehicleFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        // GET: api/transport/vehicles/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (long.TryParse(id, out long vehicleId))
            {
                var result = await _service.GetByIdAsync(vehicleId);
                if (result != null) return Ok(result);
            }
            
            var paged = await _service.GetAllAsync(new TransportVehicleFilterDto { PageSize = 1000 });
            var found = paged.Items.FirstOrDefault(v => 
                string.Equals(v.VehicleNumber, id, StringComparison.OrdinalIgnoreCase) || 
                string.Equals(v.VehicleId.ToString(), id));

            if (found == null)
                return NotFound();

            return Ok(found);
        }

        // POST: api/transport/vehicles
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTransportVehicleDto dto)
        {
            var id = await _service.CreateAsync(dto, null);
            var result = await _service.GetByIdAsync(id);

            return Ok(new
            {
                success = true,
                message = "Vehicle created successfully.",
                data = result
            });
        }

        // PUT: api/transport/vehicles/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] UpdateTransportVehicleDto dto)
        {
            long? targetId = null;
            if (long.TryParse(id, out long parsedId))
            {
                targetId = parsedId;
            }
            else
            {
                var paged = await _service.GetAllAsync(new TransportVehicleFilterDto { PageSize = 1000 });
                var found = paged.Items.FirstOrDefault(v => 
                    string.Equals(v.VehicleNumber, id, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(v.VehicleId.ToString(), id) ||
                    string.Equals(v.VehicleNumber, dto.VehicleNumber, StringComparison.OrdinalIgnoreCase));
                if (found != null) targetId = found.VehicleId;
            }

            if (targetId.HasValue)
            {
                var updated = await _service.UpdateAsync(targetId.Value, dto, null);
                if (updated)
                {
                    var updatedDto = await _service.GetByIdAsync(targetId.Value);
                    return Ok(new { success = true, message = "Vehicle updated successfully.", data = updatedDto });
                }
            }

            // Fallback: create vehicle if missing in DB
            var createDto = new CreateTransportVehicleDto
            {
                VehicleNumber = !string.IsNullOrWhiteSpace(dto.VehicleNumber) ? dto.VehicleNumber : id,
                RegistrationNumber = !string.IsNullOrWhiteSpace(dto.RegistrationNumber) ? dto.RegistrationNumber : id,
                VehicleName = dto.VehicleName ?? "Bus",
                VehicleType = dto.VehicleType ?? "Bus",
                Manufacturer = dto.Manufacturer ?? "",
                Model = dto.Model ?? "",
                InsuranceNumber = dto.InsuranceNumber ?? "",
                InsuranceExpiry = dto.InsuranceExpiry,
                PollutionExpiry = dto.PollutionExpiry,
                FitnessExpiry = dto.FitnessExpiry,
                Capacity = dto.Capacity > 0 ? dto.Capacity : 40,
                Status = dto.Status
            };

            var newId = await _service.CreateAsync(createDto, null);
            var newDto = await _service.GetByIdAsync(newId);
            return Ok(new { success = true, message = "Vehicle updated successfully.", data = newDto });
        }

        // DELETE: api/transport/vehicles/{id}
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
                var paged = await _service.GetAllAsync(new TransportVehicleFilterDto { PageSize = 1000 });
                var found = paged.Items.FirstOrDefault(v => 
                    string.Equals(v.VehicleNumber, id, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(v.VehicleId.ToString(), id));
                if (found != null) targetId = found.VehicleId;
            }

            if (targetId.HasValue)
            {
                await _service.DeleteAsync(targetId.Value, null);
            }

            return Ok(new { success = true, message = "Vehicle deleted successfully." });
        }
    }
}