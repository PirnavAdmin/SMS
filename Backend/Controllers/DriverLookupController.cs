using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/lookups")]
    [Authorize(Roles = "Admin")]
    public class DriverLookupController : ControllerBase
    {
        private readonly ITransportDriverService _service;

        public DriverLookupController(ITransportDriverService service)
        {
            _service = service;
        }

        [HttpGet("drivers")]
        public async Task<IActionResult> GetDrivers()
        {
            var result = await _service.GetLookupAsync();

            return Ok(result);
        }
    }
}