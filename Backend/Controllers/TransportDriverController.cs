using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.Driver;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/drivers")]
    [Authorize(Roles = "Admin")]
    public class TransportDriverController : ControllerBase
    {
        private readonly ITransportDriverService _service;

        public TransportDriverController(ITransportDriverService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] TransportDriverFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (long.TryParse(id, out long driverId))
            {
                var result = await _service.GetByIdAsync(driverId);
                if (result != null) return Ok(result);
            }

            var paged = await _service.GetAllAsync(new TransportDriverFilterDto { PageSize = 1000 });
            var found = paged.Items.FirstOrDefault(d => 
                string.Equals(d.DriverName, id, StringComparison.OrdinalIgnoreCase) || 
                string.Equals(d.LicenceNumber, id, StringComparison.OrdinalIgnoreCase) || 
                string.Equals(d.DriverId.ToString(), id));

            if (found == null)
                return NotFound(new { Message = "Driver not found." });

            return Ok(found);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTransportDriverDto dto)
        {
            var id = await _service.CreateAsync(dto, null);
            var result = await _service.GetByIdAsync(id);

            return Ok(new
            {
                success = true,
                message = "Driver created successfully.",
                data = result
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] UpdateTransportDriverDto dto)
        {
            long? targetId = null;
            if (long.TryParse(id, out long parsedId))
            {
                targetId = parsedId;
            }
            else
            {
                var paged = await _service.GetAllAsync(new TransportDriverFilterDto { PageSize = 1000 });
                var found = paged.Items.FirstOrDefault(d => 
                    string.Equals(d.DriverName, id, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(d.LicenceNumber, id, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(d.DriverId.ToString(), id) ||
                    string.Equals(d.DriverName, dto.DriverName, StringComparison.OrdinalIgnoreCase));
                if (found != null) targetId = found.DriverId;
            }

            if (targetId.HasValue)
            {
                var updated = await _service.UpdateAsync(targetId.Value, dto, null);
                if (updated)
                {
                    var updatedDto = await _service.GetByIdAsync(targetId.Value);
                    return Ok(new { success = true, message = "Driver updated successfully.", data = updatedDto });
                }
            }

            // Fallback create driver
            var createDto = new CreateTransportDriverDto
            {
                DriverName = !string.IsNullOrWhiteSpace(dto.DriverName) ? dto.DriverName : id,
                LicenceNumber = !string.IsNullOrWhiteSpace(dto.LicenceNumber) ? dto.LicenceNumber : $"LIC-{Random.Shared.Next(1000,9999)}",
                LicenceExpiry = dto.LicenceExpiry,
                MobileNumber = !string.IsNullOrWhiteSpace(dto.MobileNumber) ? dto.MobileNumber : "0000000000",
                AlternateMobileNumber = dto.AlternateMobileNumber ?? "",
                Address = dto.Address ?? "",
                BloodGroup = dto.BloodGroup ?? "",
                EmergencyContactName = dto.EmergencyContactName ?? "",
                EmergencyContactNumber = dto.EmergencyContactNumber ?? "",
                Status = dto.Status
            };

            var newId = await _service.CreateAsync(createDto, null);
            var newDto = await _service.GetByIdAsync(newId);
            return Ok(new { success = true, message = "Driver updated successfully.", data = newDto });
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
                var paged = await _service.GetAllAsync(new TransportDriverFilterDto { PageSize = 1000 });
                var found = paged.Items.FirstOrDefault(d => 
                    string.Equals(d.DriverName, id, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(d.LicenceNumber, id, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(d.DriverId.ToString(), id));
                if (found != null) targetId = found.DriverId;
            }

            if (targetId.HasValue)
            {
                await _service.DeleteAsync(targetId.Value, null);
            }

            return Ok(new { success = true, message = "Driver deleted successfully." });
        }
    }
}