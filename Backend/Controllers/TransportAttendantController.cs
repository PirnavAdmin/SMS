using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.Attendant;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/bus-attendants")]
    [Route("api/transport/attendants")]
    [Authorize(Roles = "Admin")]
    public class TransportAttendantController : ControllerBase
    {
        private readonly ITransportAttendantService _service;

        public TransportAttendantController(ITransportAttendantService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] TransportAttendantFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (long.TryParse(id, out long attendantId))
            {
                var result = await _service.GetByIdAsync(attendantId);
                if (result != null) return Ok(result);
            }

            var paged = await _service.GetAllAsync(new TransportAttendantFilterDto { PageSize = 1000 });
            var found = paged.Items.FirstOrDefault(a =>
                string.Equals(a.AttendantName, id, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(a.MobileNumber, id, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(a.AttendantId.ToString(), id));

            if (found == null)
                return NotFound(new { message = "Bus attendant not found." });

            return Ok(found);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTransportAttendantDto dto)
        {
            var id = await _service.CreateAsync(dto, null);
            var result = await _service.GetByIdAsync(id);

            return Ok(new
            {
                success = true,
                message = "Bus attendant created successfully.",
                data = result
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateTransportAttendantDto dto)
        {
            long? targetId = null;
            if (long.TryParse(id, out long parsedId))
            {
                targetId = parsedId;
            }
            else
            {
                var paged = await _service.GetAllAsync(new TransportAttendantFilterDto { PageSize = 1000 });
                var found = paged.Items.FirstOrDefault(a =>
                    string.Equals(a.AttendantName, id, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(a.MobileNumber, id, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(a.AttendantId.ToString(), id) ||
                    (!string.IsNullOrWhiteSpace(dto.AttendantName) && string.Equals(a.AttendantName, dto.AttendantName, StringComparison.OrdinalIgnoreCase)));
                if (found != null) targetId = found.AttendantId;
            }

            if (targetId.HasValue)
            {
                var updated = await _service.UpdateAsync(targetId.Value, dto, null);
                if (updated)
                {
                    var updatedDto = await _service.GetByIdAsync(targetId.Value);
                    return Ok(new { success = true, message = "Bus attendant updated successfully.", data = updatedDto });
                }
            }

            var createDto = new CreateTransportAttendantDto
            {
                AttendantName = !string.IsNullOrWhiteSpace(dto.AttendantName) ? dto.AttendantName : id,
                MobileNumber = !string.IsNullOrWhiteSpace(dto.MobileNumber) ? dto.MobileNumber : "0000000000",
                AlternateMobileNumber = dto.AlternateMobileNumber,
                Address = dto.Address,
                BloodGroup = dto.BloodGroup,
                EmergencyContactName = dto.EmergencyContactName,
                EmergencyContactNumber = dto.EmergencyContactNumber,
                AssignedVehicleId = dto.AssignedVehicleId,
                Status = dto.Status
            };

            var newId = await _service.CreateAsync(createDto, null);
            var newDto = await _service.GetByIdAsync(newId);
            return Ok(new { success = true, message = "Bus attendant updated successfully.", data = newDto });
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
                var paged = await _service.GetAllAsync(new TransportAttendantFilterDto { PageSize = 1000 });
                var found = paged.Items.FirstOrDefault(a =>
                    string.Equals(a.AttendantName, id, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(a.AttendantId.ToString(), id));
                if (found != null) targetId = found.AttendantId;
            }

            if (targetId.HasValue)
            {
                await _service.DeleteAsync(targetId.Value, null);
            }

            return Ok(new { success = true, message = "Bus attendant deleted successfully." });
        }
    }
}
