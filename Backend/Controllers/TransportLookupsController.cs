using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/lookups")]
    [Authorize(Roles = "Admin")]
    public class TransportLookupsController : ControllerBase
    {
        private readonly ITransportRouteService _routeService;
        private readonly ITransportVehicleService _vehicleService;
        private readonly ITransportDriverService _driverService;
        private readonly IPickupPointService _pickupPointService;
        private readonly ITransportAttendantService _attendantService;
        private readonly ITransportVehicleAssignmentService _vehicleAssignmentService;
        private readonly IStudentTransportAssignmentService _studentAssignmentService;

        public TransportLookupsController(
            ITransportRouteService routeService,
            ITransportVehicleService vehicleService,
            ITransportDriverService driverService,
            IPickupPointService pickupPointService,
            ITransportAttendantService attendantService,
            ITransportVehicleAssignmentService vehicleAssignmentService,
            IStudentTransportAssignmentService studentAssignmentService)
        {
            _routeService = routeService;
            _vehicleService = vehicleService;
            _driverService = driverService;
            _pickupPointService = pickupPointService;
            _attendantService = attendantService;
            _vehicleAssignmentService = vehicleAssignmentService;
            _studentAssignmentService = studentAssignmentService;
        }

        [HttpGet("routes")]
        public async Task<IActionResult> GetRoutes([FromQuery] string? search, [FromQuery] int limit = 100)
        {
            var result = await _routeService.GetLookupAsync(search, limit);
            return Ok(result);
        }

        [HttpGet("vehicles")]
        public async Task<IActionResult> GetVehicles()
        {
            var result = await _vehicleService.GetLookupAsync();
            return Ok(result);
        }

        [HttpGet("drivers")]
        public async Task<IActionResult> GetDrivers()
        {
            var result = await _driverService.GetLookupAsync();
            return Ok(result);
        }

        [HttpGet("pickup-points")]
        public async Task<IActionResult> GetPickupPoints([FromQuery] long? routeId)
        {
            var result = await _pickupPointService.GetLookupAsync(routeId);
            return Ok(result);
        }

        [HttpGet("bus-attendants")]
        [HttpGet("attendants")]
        public async Task<IActionResult> GetAttendants()
        {
            var result = await _attendantService.GetLookupAsync();
            return Ok(result);
        }

        [HttpGet("vehicle-assignments")]
        public async Task<IActionResult> GetVehicleAssignments()
        {
            var result = await _vehicleAssignmentService.GetLookupAsync();
            return Ok(result);
        }

        [HttpGet("student-assignments")]
        public async Task<IActionResult> GetStudentAssignments()
        {
            var result = await _studentAssignmentService.GetLookupAsync();
            return Ok(result);
        }
    }
}