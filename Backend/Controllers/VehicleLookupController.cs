using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/lookups")]
    [Authorize(Roles = "Admin")]
    public class VehicleLookupController : ControllerBase
    {
        private readonly ITransportVehicleService _service;

        public VehicleLookupController(ITransportVehicleService service)
        {
            _service = service;
        }

        [HttpGet("vehicles")]
        public async Task<IActionResult> GetVehicles()
        {
            var result = await _service.GetLookupAsync();
            return Ok(result);
        }
    }
}