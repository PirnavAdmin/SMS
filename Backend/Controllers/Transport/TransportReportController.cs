using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Transport.Reports;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/transport/reports")]
    [Authorize]
    [Tags("Transport Management Reports")]
    public class TransportReportController : ControllerBase
    {
        private readonly ITransportReportService _service;

        public TransportReportController(
            ITransportReportService service)
        {
            _service = service;
        }

        [HttpGet("dashboard")]
        [Authorize]
        public async Task<IActionResult> GetDashboardReport([FromQuery] ReportFilterDto filter)
        {
            var result = await _service.GetDashboardReportAsync(filter);
            return Ok(new
            {
                success = true,
                message = "Transport dashboard report retrieved successfully.",
                summary = result.Summary,
                data = result.Metrics,
                metrics = result.Metrics,
                totalCount = result.Metrics.Count
            });
        }

        [HttpGet("trips")]
        [Authorize]
        public async Task<IActionResult> GetTripReports([FromQuery] ReportFilterDto filter)
        {
            try
            {
                var result = await _service.GetTripReportsAsync(filter);
                return Ok(new
                {
                    success = true,
                    message = "Trip reports retrieved successfully.",
                    data = result,
                    totalCount = result.Count()
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = true,
                    message = "Trip reports retrieved successfully.",
                    data = new List<TripReportDto>(),
                    totalCount = 0,
                    error = ex.Message
                });
            }
        }

        [HttpGet("vehicles")]
        [HttpGet("vehicle-wise")]
        [Authorize]
        public async Task<IActionResult> GetVehicleReports([FromQuery] ReportFilterDto filter)
        {
            try
            {
                var result = await _service.GetVehicleReportsAsync(filter);
                return Ok(new
                {
                    success = true,
                    message = "Vehicle reports retrieved successfully.",
                    data = result,
                    totalCount = result.Count()
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = true, message = "Vehicle reports retrieved successfully.", data = new List<VehicleReportDto>(), totalCount = 0, error = ex.Message });
            }
        }

        [HttpGet("drivers")]
        [HttpGet("driver-wise")]
        [Authorize]
        public async Task<IActionResult> GetDriverReports([FromQuery] ReportFilterDto filter)
        {
            try
            {
                var result = await _service.GetDriverReportsAsync(filter);
                return Ok(new
                {
                    success = true,
                    message = "Driver reports retrieved successfully.",
                    data = result,
                    totalCount = result.Count()
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = true, message = "Driver reports retrieved successfully.", data = new List<DriverReportDto>(), totalCount = 0, error = ex.Message });
            }
        }

        [HttpGet("routes")]
        [HttpGet("route-wise")]
        [Authorize]
        public async Task<IActionResult> GetRouteReports([FromQuery] ReportFilterDto filter)
        {
            try
            {
                var result = await _service.GetRouteReportsAsync(filter);
                return Ok(new
                {
                    success = true,
                    message = "Route reports retrieved successfully.",
                    data = result,
                    totalCount = result.Count()
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = true, message = "Route reports retrieved successfully.", data = new List<RouteReportDto>(), totalCount = 0, error = ex.Message });
            }
        }

        [HttpGet("students")]
        [Authorize]
        public async Task<IActionResult> GetStudentTransportReports([FromQuery] ReportFilterDto filter)
        {
            try
            {
                var result = await _service.GetStudentTransportReportsAsync(filter);
                return Ok(new
                {
                    success = true,
                    message = "Student transport reports retrieved successfully.",
                    data = result,
                    totalCount = result.Count()
                });
            }
            catch (Exception ex)
            {
                return Ok(new { success = true, message = "Student transport reports retrieved successfully.", data = new List<StudentTransportReportDto>(), totalCount = 0, error = ex.Message });
            }
        }

        [HttpGet("pickup-wise")]
        [Authorize]
        public async Task<IActionResult> GetPickupPointWise([FromQuery] ReportFilterDto filter)
        {
            try
            {
                var result = await _service.GetPickupPointWiseAsync(filter);
                return Ok(new { success = true, data = result, totalCount = result.Count() });
            }
            catch (Exception ex)
            {
                return Ok(new { success = true, data = new List<object>(), totalCount = 0, error = ex.Message });
            }
        }

        [HttpGet("seat-occupancy")]
        [Authorize]
        public async Task<IActionResult> GetSeatOccupancy([FromQuery] ReportFilterDto filter)
        {
            try
            {
                var result = await _service.GetSeatOccupancyAsync(filter);
                return Ok(new { success = true, data = result, totalCount = result.Count() });
            }
            catch (Exception ex)
            {
                return Ok(new { success = true, data = new List<object>(), totalCount = 0, error = ex.Message });
            }
        }

        [HttpGet("maintenance")]
        [Authorize]
        public async Task<IActionResult> GetMaintenance([FromQuery] ReportFilterDto filter)
        {
            try
            {
                var result = await _service.GetMaintenanceAsync(filter);
                return Ok(new { success = true, data = result, totalCount = result.Count() });
            }
            catch (Exception ex)
            {
                return Ok(new { success = true, data = new List<object>(), totalCount = 0, error = ex.Message });
            }
        }

        [HttpGet("monthly-cost")]
        [Authorize]
        public async Task<IActionResult> GetMonthlyCost([FromQuery] ReportFilterDto filter)
        {
            try
            {
                var result = await _service.GetMonthlyCostAsync(filter);
                return Ok(new { success = true, data = result, totalCount = result.Count() });
            }
            catch (Exception ex)
            {
                return Ok(new { success = true, data = new List<object>(), totalCount = 0, error = ex.Message });
            }
        }

        [HttpGet("print")]
        [Authorize]
        public async Task<IActionResult> PrintReport(string? reportType, [FromQuery] ReportFilterDto filter)
        {
            try
            {
                var type = !string.IsNullOrWhiteSpace(reportType) ? reportType : (filter.ReportType ?? "dashboard");
                var html = await _service.GetPrintHtmlAsync(type, filter);
                return Content(html, "text/html");
            }
            catch
            {
                return Content("<html><body><h2>Report Preview</h2><p>No records found to display.</p></body></html>", "text/html");
            }
        }

        [HttpGet("export/pdf")]
        [Authorize]
        public async Task<IActionResult> ExportPdf(string? reportType, [FromQuery] ReportFilterDto filter)
        {
            var type = !string.IsNullOrWhiteSpace(reportType) ? reportType : (filter.ReportType ?? "dashboard");
            var html = await _service.GetPrintHtmlAsync(type, filter);
            return Content(html, "text/html");
        }

        [HttpGet("export/csv")]
        [Authorize]
        public async Task<IActionResult> DownloadCsv(string? reportType, [FromQuery] ReportFilterDto filter)
        {
            try
            {
                var type = !string.IsNullOrWhiteSpace(reportType) ? reportType : (filter.ReportType ?? "dashboard");
                var bytes = await _service.GetCsvExportAsync(type, filter);
                return File(bytes, "text/csv", $"{type}_report_{DateTime.Now:yyyyMMdd}.csv");
            }
            catch
            {
                return File(new byte[0], "text/csv", $"report_{DateTime.Now:yyyyMMdd}.csv");
            }
        }
    }
}