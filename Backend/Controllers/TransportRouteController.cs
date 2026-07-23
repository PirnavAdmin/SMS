using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/v1/transport/routes")]
    public class TransportRoutesController : ControllerBase
    {
        private readonly ITransportRouteService _service;

        public TransportRoutesController(
            ITransportRouteService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] TransportRouteFilterDto filter)
        {
            var result =
                await _service.GetAllAsync(filter);

            return Ok(new
            {
                success = true,
                message = "Transport routes retrieved successfully.",
                data = result
            });
        }

        [HttpGet("{routeId:long}")]
        public async Task<IActionResult> GetById(
            long routeId)
        {
            TransportRouteDto? result =
                await _service.GetByIdAsync(routeId);

            if (result is null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Transport route not found."
                });
            }

            return Ok(new
            {
                success = true,
                message = "Transport route retrieved successfully.",
                data = result
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateTransportRouteDto dto)
        {
            long routeId =
                await _service.CreateAsync(
                    dto,
                    userId: null);

            TransportRouteDto? result =
                await _service.GetByIdAsync(routeId);

            return CreatedAtAction(
                nameof(GetById),
                new { routeId },
                new
                {
                    success = true,
                    message = "Transport route created successfully.",
                    data = result
                });
        }

        [HttpPut("{routeId:long}")]
        public async Task<IActionResult> Update(
            long routeId,
            [FromBody] UpdateTransportRouteDto dto)
        {
            bool updated =
                await _service.UpdateAsync(
                    routeId,
                    dto,
                    userId: null);

            if (!updated)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Transport route not found."
                });
            }

            TransportRouteDto? result =
                await _service.GetByIdAsync(routeId);

            return Ok(new
            {
                success = true,
                message = "Transport route updated successfully.",
                data = result
            });
        }

        [HttpDelete("{routeId:long}")]
        public async Task<IActionResult> Delete(
            long routeId)
        {
            bool deleted =
                await _service.DeleteAsync(
                    routeId,
                    userId: null);

            if (!deleted)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Transport route not found."
                });
            }

            return Ok(new
            {
                success = true,
                message = "Transport route deleted successfully."
            });
        }
    }
}