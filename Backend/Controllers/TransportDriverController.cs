using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.Driver;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/v1/transport/drivers")]
    public class TransportDriverController : ControllerBase
    {
        private readonly ITransportDriverService _service;

        public TransportDriverController(ITransportDriverService service)
        {
            _service = service;
        }

        //---------------------------------------------------------
        // GET ALL
        //---------------------------------------------------------

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] TransportDriverFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        //---------------------------------------------------------
        // GET BY ID
        //---------------------------------------------------------

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _service.GetByIdAsync(id);

            if (result == null)
                return NotFound(new
                {
                    Message = "Driver not found."
                });

            return Ok(result);
        }

        //---------------------------------------------------------
        // CREATE
        //---------------------------------------------------------

        [HttpPost]
        public async Task<IActionResult> Create(
            CreateTransportDriverDto dto)
        {
            var id = await _service.CreateAsync(dto, null);

            return CreatedAtAction(
                nameof(GetById),
                new { id },
                new
                {
                    DriverId = id,
                    Message = "Driver created successfully."
                });
        }

        //---------------------------------------------------------
        // UPDATE
        //---------------------------------------------------------

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(
            long id,
            UpdateTransportDriverDto dto)
        {
            var updated = await _service.UpdateAsync(
                id,
                dto,
                null);

            if (!updated)
                return NotFound(new
                {
                    Message = "Driver not found."
                });

            return Ok(new
            {
                Message = "Driver updated successfully."
            });
        }

        //---------------------------------------------------------
        // DELETE
        //---------------------------------------------------------

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var deleted = await _service.DeleteAsync(id, null);

            if (!deleted)
                return NotFound(new
                {
                    Message = "Driver not found."
                });

            return Ok(new
            {
                Message = "Driver deleted successfully."
            });
        }
    }
}