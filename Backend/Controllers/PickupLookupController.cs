using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/v1/transport/lookups")]
    public class PickupLookupController : ControllerBase
    {
        private readonly IPickupPointService _service;

        public PickupLookupController(IPickupPointService service)
        {
            _service = service;
        }

        [HttpGet("pickup-points")]
        public async Task<IActionResult> GetPickupPoints([FromQuery] long? routeId)
        {
            var result = await _service.GetLookupAsync(routeId);
            return Ok(result);
        }
    }
}