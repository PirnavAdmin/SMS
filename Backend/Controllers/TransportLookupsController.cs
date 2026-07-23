using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/v1/transport/lookups")]
    public class TransportLookupsController : ControllerBase
    {
        private readonly ITransportRouteService _routeService;

        public TransportLookupsController(
            ITransportRouteService routeService)
        {
            _routeService = routeService;
        }

        [HttpGet("routes")]
        public async Task<IActionResult> GetRoutes(
            [FromQuery] string? search,
            [FromQuery] int limit = 20)
        {
            var result =
                await _routeService.GetLookupAsync(
                    search,
                    limit);

            return Ok(new
            {
                success = true,
                message = "Route lookup retrieved successfully.",
                data = result
            });
        }
    }
}