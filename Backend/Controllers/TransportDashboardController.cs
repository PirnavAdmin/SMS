using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers.Transport
{
    [ApiController]
    [Route("api/transport/dashboard")]
    [Authorize(Roles = "Admin")]
    public class TransportDashboardController : ControllerBase
    {
        private readonly ITransportDashboardService _service;

        public TransportDashboardController(
            ITransportDashboardService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var result = await _service.GetDashboardAsync();

            return Ok(new
            {
                success = true,
                data = result
            });
        }
    }
}