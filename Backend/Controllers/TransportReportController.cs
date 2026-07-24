using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.Reports;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/reports")]
    [Authorize(Roles = "Admin")]
    public class TransportReportController : ControllerBase
    {
        private readonly ITransportReportService _service;

        public TransportReportController(
            ITransportReportService service)
        {
            _service = service;
        }

        // -------------------------------------------------------
        // Vehicle-wise Student Report
        // GET:
        // api/v1/transport-reports/vehicle-wise
        // -------------------------------------------------------

        [HttpGet("vehicle-wise")]
        public async Task<IActionResult> GetVehicleWise(
            [FromQuery] ReportFilterDto filter)
        {
            var result = await _service
                .GetVehicleWiseAsync(filter);

            return Ok(new
            {
                success = true,
                message = "Vehicle-wise transport report retrieved successfully.",
                data = result
            });
        }

        // -------------------------------------------------------
        // Route-wise Student Report
        // GET:
        // api/v1/transport-reports/route-wise
        // -------------------------------------------------------

        [HttpGet("route-wise")]
        public async Task<IActionResult> GetRouteWise(
            [FromQuery] ReportFilterDto filter)
        {
            var result = await _service
                .GetRouteWiseAsync(filter);

            return Ok(new
            {
                success = true,
                message = "Route-wise transport report retrieved successfully.",
                data = result
            });
        }

        // -------------------------------------------------------
        // Pickup-point-wise Student Report
        // GET:
        // api/v1/transport-reports/pickup-wise
        // -------------------------------------------------------

        [HttpGet("pickup-wise")]
        public async Task<IActionResult> GetPickupPointWise(
            [FromQuery] ReportFilterDto filter)
        {
            var result = await _service
                .GetPickupPointWiseAsync(filter);

            return Ok(new
            {
                success = true,
                message = "Pickup-point-wise transport report retrieved successfully.",
                data = result
            });
        }

        // -------------------------------------------------------
        // Driver-wise Vehicle Report
        // GET:
        // api/v1/transport-reports/driver-wise
        // -------------------------------------------------------

        [HttpGet("driver-wise")]
        public async Task<IActionResult> GetDriverWise(
            [FromQuery] ReportFilterDto filter)
        {
            var result = await _service
                .GetDriverWiseAsync(filter);

            return Ok(new
            {
                success = true,
                message = "Driver-wise transport report retrieved successfully.",
                data = result
            });
        }

        // -------------------------------------------------------
        // Seat Occupancy Report
        // GET:
        // api/v1/transport-reports/seat-occupancy
        // -------------------------------------------------------

        [HttpGet("seat-occupancy")]
        public async Task<IActionResult> GetSeatOccupancy(
            [FromQuery] ReportFilterDto filter)
        {
            var result = await _service
                .GetSeatOccupancyAsync(filter);

            return Ok(new
            {
                success = true,
                message = "Seat occupancy report retrieved successfully.",
                data = result
            });
        }

        // -------------------------------------------------------
        // Vehicle Maintenance Report
        // GET:
        // api/v1/transport-reports/maintenance
        // -------------------------------------------------------

        [HttpGet("maintenance")]
        public async Task<IActionResult> GetMaintenance(
            [FromQuery] ReportFilterDto filter)
        {
            var result = await _service
                .GetMaintenanceAsync(filter);

            return Ok(new
            {
                success = true,
                message = "Vehicle maintenance report retrieved successfully.",
                data = result
            });
        }

        // -------------------------------------------------------
        // Monthly Maintenance Cost Report
        // GET:
        // api/v1/transport-reports/monthly-cost
        // -------------------------------------------------------

        [HttpGet("monthly-cost")]
        public async Task<IActionResult> GetMonthlyCost(
            [FromQuery] ReportFilterDto filter)
        {
            var result = await _service
                .GetMonthlyCostAsync(filter);

            return Ok(new
            {
                success = true,
                message = "Monthly maintenance cost report retrieved successfully.",
                data = result
            });
        }
    }
}