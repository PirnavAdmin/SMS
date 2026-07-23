using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/v1/transport/lookups")]
    public class VehicleAssignmentLookupController : ControllerBase
    {
        private readonly ITransportVehicleAssignmentService _service;

        public VehicleAssignmentLookupController(
            ITransportVehicleAssignmentService service)
        {
            _service = service;
        }

        [HttpGet("vehicle-assignments")]
        public async Task<IActionResult> GetAssignments()
        {
            var result = await _service.GetLookupAsync();

            return Ok(result);
        }
    }
}