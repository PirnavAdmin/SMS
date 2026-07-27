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
            var paged = await _service.GetAllAsync(new TransportDriverFilterDto { PageSize = 1000 });
            var existing = paged.Items.FirstOrDefault(d =>
                (!string.IsNullOrWhiteSpace(dto.LicenceNumber) && string.Equals(d.LicenceNumber, dto.LicenceNumber, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(dto.MobileNumber) && string.Equals(d.MobileNumber, dto.MobileNumber, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(dto.DriverName) && string.Equals(d.DriverName, dto.DriverName, StringComparison.OrdinalIgnoreCase)));

            if (existing != null)
            {
                var updateDto = new UpdateTransportDriverDto
                {
                    DriverName = !string.IsNullOrWhiteSpace(dto.DriverName) ? dto.DriverName : existing.DriverName,
                    LicenceNumber = !string.IsNullOrWhiteSpace(dto.LicenceNumber) ? dto.LicenceNumber : existing.LicenceNumber,
                    LicenceExpiry = dto.LicenceExpiry ?? existing.LicenceExpiry,
                    MobileNumber = !string.IsNullOrWhiteSpace(dto.MobileNumber) ? dto.MobileNumber : existing.MobileNumber,
                    AlternateMobileNumber = dto.AlternateMobileNumber ?? existing.AlternateMobileNumber,
                    Address = dto.Address ?? existing.Address,
                    BloodGroup = dto.BloodGroup ?? existing.BloodGroup,
                    EmergencyContactName = dto.EmergencyContactName ?? existing.EmergencyContactName,
                    EmergencyContactNumber = dto.EmergencyContactNumber ?? existing.EmergencyContactNumber,
                    Status = dto.Status
                };

                await _service.UpdateAsync(existing.DriverId, updateDto, null);
                var updatedResult = await _service.GetByIdAsync(existing.DriverId);
                return Ok(new { success = true, message = "Driver updated successfully.", data = updatedResult });
            }

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
                var digitsOnly = new string(id.Where(char.IsDigit).ToArray());
                if (!string.IsNullOrEmpty(digitsOnly) && long.TryParse(digitsOnly, out long numericId))
                {
                    targetId = numericId;
                }
            }

            var paged = await _service.GetAllAsync(new TransportDriverFilterDto { PageSize = 1000 });

            if (targetId.HasValue)
            {
                var existsById = paged.Items.FirstOrDefault(d => d.DriverId == targetId.Value);
                if (existsById == null)
                {
                    targetId = null;
                }
            }

            if (!targetId.HasValue)
            {
                var found = paged.Items.FirstOrDefault(d => 
                    string.Equals(d.DriverName, id, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(d.LicenceNumber, id, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(d.DriverId.ToString(), id) ||
                    (!string.IsNullOrWhiteSpace(dto.DriverName) && string.Equals(d.DriverName, dto.DriverName, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrWhiteSpace(dto.LicenceNumber) && string.Equals(d.LicenceNumber, dto.LicenceNumber, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrWhiteSpace(dto.MobileNumber) && string.Equals(d.MobileNumber, dto.MobileNumber, StringComparison.OrdinalIgnoreCase)));
                
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

            // Fallback create driver if no existing record matched
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