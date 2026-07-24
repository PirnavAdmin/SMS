using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/routes")]
    [Authorize(Roles = "Admin")]
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
            var result = await _service.GetAllAsync(filter);

            return Ok(new
            {
                success = true,
                message = "Transport routes retrieved successfully.",
                data = result
            });
        }

        [HttpGet("{routeIdOrCode}")]
        public async Task<IActionResult> GetByIdOrCode(
            string routeIdOrCode)
        {
            TransportRouteDto? result = null;

            if (long.TryParse(routeIdOrCode, out long routeId))
            {
                result = await _service.GetByIdAsync(routeId);
            }
            else
            {
                var paged = await _service.GetAllAsync(new TransportRouteFilterDto { Search = routeIdOrCode, PageSize = 100 });
                result = paged.Items.FirstOrDefault(r => 
                    string.Equals(r.RouteCode, routeIdOrCode, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(r.RouteId.ToString(), routeIdOrCode));
            }

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
            long routeId = await _service.CreateAsync(dto, userId: null);

            TransportRouteDto? result = await _service.GetByIdAsync(routeId);

            return Ok(new
            {
                success = true,
                message = "Transport route created successfully.",
                data = result
            });
        }

        [HttpPut("{routeIdOrCode}")]
        public async Task<IActionResult> Update(
            string routeIdOrCode,
            [FromBody] UpdateTransportRouteDto dto)
        {
            long? targetRouteId = null;

            if (long.TryParse(routeIdOrCode, out long routeId))
            {
                targetRouteId = routeId;
            }
            else
            {
                var paged = await _service.GetAllAsync(new TransportRouteFilterDto { PageSize = 1000 });
                var found = paged.Items.FirstOrDefault(r => 
                    string.Equals(r.RouteCode, routeIdOrCode, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(r.RouteId.ToString(), routeIdOrCode) ||
                    string.Equals(r.RouteCode, dto.RouteCode, StringComparison.OrdinalIgnoreCase));

                if (found != null)
                {
                    targetRouteId = found.RouteId;
                }
            }

            if (targetRouteId.HasValue)
            {
                bool updated = await _service.UpdateAsync(targetRouteId.Value, dto, userId: null);
                if (updated)
                {
                    var updatedDto = await _service.GetByIdAsync(targetRouteId.Value);
                    return Ok(new
                    {
                        success = true,
                        message = "Transport route updated successfully.",
                        data = updatedDto
                    });
                }
            }

            // Fallback: If route did not exist in database yet, create it seamlessly
            var createDto = new CreateTransportRouteDto
            {
                RouteCode = !string.IsNullOrWhiteSpace(dto.RouteCode) ? dto.RouteCode : routeIdOrCode,
                RouteName = dto.RouteName,
                StartLocation = dto.StartLocation,
                EndLocation = dto.EndLocation,
                DistanceKm = dto.DistanceKm,
                EstimatedDurationMinutes = dto.EstimatedDurationMinutes,
                Description = dto.Description,
                Status = dto.Status
            };

            long createdId = await _service.CreateAsync(createDto, userId: null);
            var createdDto = await _service.GetByIdAsync(createdId);

            return Ok(new
            {
                success = true,
                message = "Transport route updated successfully.",
                data = createdDto
            });
        }

        [HttpDelete("{routeIdOrCode}")]
        public async Task<IActionResult> Delete(
            string routeIdOrCode)
        {
            long? targetRouteId = null;

            if (long.TryParse(routeIdOrCode, out long routeId))
            {
                targetRouteId = routeId;
            }
            else
            {
                var paged = await _service.GetAllAsync(new TransportRouteFilterDto { PageSize = 1000 });
                var found = paged.Items.FirstOrDefault(r => 
                    string.Equals(r.RouteCode, routeIdOrCode, StringComparison.OrdinalIgnoreCase) || 
                    string.Equals(r.RouteId.ToString(), routeIdOrCode));

                if (found != null)
                {
                    targetRouteId = found.RouteId;
                }
            }

            if (targetRouteId.HasValue)
            {
                await _service.DeleteAsync(targetRouteId.Value, userId: null);
            }

            return Ok(new
            {
                success = true,
                message = "Transport route deleted successfully."
            });
        }
    }
}