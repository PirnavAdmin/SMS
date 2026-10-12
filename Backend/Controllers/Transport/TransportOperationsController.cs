using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.Operations;

using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers.Transport
{
    [ApiController]
    [Route("api/transport")]
    [AllowAnonymous]
    [Tags("Transport Operations")]
    public class TransportOperationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITransportDashboardService _dashboardService;

        public TransportOperationsController(
            AppDbContext context,
            ITransportDashboardService dashboardService)
        {
            _context = context;
            _dashboardService = dashboardService;
        }

        [HttpGet("operations/{assignmentId}")]
        [HttpGet("operations/{assignmentId}/details")]
        [AllowAnonymous]
        public async Task<IActionResult> GetOperationDetails(long assignmentId)
        {
            try
            {
                var result = await _dashboardService.GetOperationDetailsAsync(assignmentId);
                if (result == null)
                {
                    return NotFound(new { success = false, message = "Operation details not found." });
                }

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = false,
                    message = "Failed to retrieve operation details.",
                    error = ex.Message
                });
            }
        }

        [HttpGet("vehicle-trips")]
        [AllowAnonymous]
        public async Task<IActionResult> GetVehicleTrips(
            [FromQuery] string? search,
            [FromQuery] long? routeId,
            [FromQuery] long? driverId,
            [FromQuery] long? vehicleId,
            [FromQuery] string? status)
        {
            try
            {
                var assignmentsQuery = _context.TransportVehicleAssignments
                    .Include(x => x.Route)
                    .Include(x => x.Vehicle)
                    .Include(x => x.Driver)
                    .Where(x => !x.IsDeleted);

                if (routeId.HasValue) assignmentsQuery = assignmentsQuery.Where(x => x.RouteId == routeId.Value);
                if (driverId.HasValue) assignmentsQuery = assignmentsQuery.Where(x => x.DriverId == driverId.Value);
                if (vehicleId.HasValue) assignmentsQuery = assignmentsQuery.Where(x => x.VehicleId == vehicleId.Value);

                var assignments = await assignmentsQuery.ToListAsync();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var q = search.Trim().ToLower();
                    assignments = assignments.Where(x =>
                        (x.Route != null && x.Route.RouteName != null && x.Route.RouteName.ToLower().Contains(q)) ||
                        (x.Vehicle != null && x.Vehicle.VehicleNumber != null && x.Vehicle.VehicleNumber.ToLower().Contains(q)) ||
                        (x.Driver != null && x.Driver.DriverName != null && x.Driver.DriverName.ToLower().Contains(q)) ||
                        (x.Attendant != null && x.Attendant.AttendantName != null && x.Attendant.AttendantName.ToLower().Contains(q))).ToList();
                }

                var routeIds = assignments.Select(x => x.RouteId).Distinct().ToList();
                var studentCounts = await _context.StudentTransportAssignments
                    .AsNoTracking()
                    .Where(s => !s.IsDeleted && s.Status && routeIds.Contains(s.RouteId))
                    .GroupBy(s => s.RouteId)
                    .Select(g => new { RouteId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.RouteId, x => x.Count);

                var tripCards = assignments.Select(a => new VehicleTripCardDto
                {
                    TripId = a.AssignmentId,
                    VehicleId = a.VehicleId,
                    VehicleNumber = a.Vehicle?.VehicleNumber ?? $"VH-{a.VehicleId}",
                    RegistrationNumber = a.Vehicle?.RegistrationNumber ?? $"REG-{a.VehicleId}",
                    RouteId = a.RouteId,
                    RouteName = a.Route?.RouteName ?? $"Route-{a.RouteId}",
                    DriverId = a.DriverId,
                    DriverName = a.Driver?.DriverName ?? "Driver",
                    DriverMobile = a.Driver?.MobileNumber ?? "-",
                    AttendantId = a.AttendantId,
                    AttendantName = a.Attendant?.AttendantName ?? "Unassigned",
                    AttendantMobile = a.Attendant?.MobileNumber ?? "-",
                    StudentsCount = studentCounts.TryGetValue(a.RouteId, out var count) ? count : 0,
                    Capacity = a.Vehicle != null && a.Vehicle.Capacity > 0 ? a.Vehicle.Capacity : 0,
                    MorningTripTime = a.MorningTripTime ?? "-",
                    EveningTripTime = a.EveningTripTime ?? "-",
                    Status = a.Status ? "Running" : "Inactive",
                    GpsStatus = "GPS Offline"
                }).ToList();

                var totalStudentsOnBoard = studentCounts.Values.Sum();
                var vehiclesRunning = tripCards.Count(x => x.Status == "Running");
                var activeMorning = tripCards.Count(x => !string.IsNullOrEmpty(x.MorningTripTime) && x.MorningTripTime != "-");
                var activeEvening = tripCards.Count(x => !string.IsNullOrEmpty(x.EveningTripTime) && x.EveningTripTime != "-");

                var metrics = new VehicleTripMetricsDto
                {
                    VehiclesRunning = vehiclesRunning,
                    TripsCompleted = 0,
                    DelayedTrips = 0,
                    OfflineGpsDevices = tripCards.Count,
                    ActiveMorningTrips = activeMorning,
                    StudentsOnBoard = totalStudentsOnBoard,
                    ActiveEveningTrips = activeEvening
                };

                return Ok(new
                {
                    success = true,
                    metrics,
                    trips = tripCards,
                    data = tripCards,
                    totalCount = tripCards.Count
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = true,
                    metrics = new VehicleTripMetricsDto(),
                    trips = new List<VehicleTripCardDto>(),
                    data = new List<VehicleTripCardDto>(),
                    totalCount = 0,
                    error = ex.Message
                });
            }
        }

        [HttpGet("gps-tracking")]
        [AllowAnonymous]
        public async Task<IActionResult> GetGpsTracking([FromQuery] string? search)
        {
            try
            {
                var vehiclesQuery = _context.TransportVehicles
                    .Where(x => !x.IsDeleted);

                var vehicles = await vehiclesQuery.ToListAsync();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var q = search.Trim().ToLower();
                    vehicles = vehicles.Where(x =>
                        (x.VehicleNumber != null && x.VehicleNumber.ToLower().Contains(q)) ||
                        (x.RegistrationNumber != null && x.RegistrationNumber.ToLower().Contains(q)) ||
                        (x.VehicleName != null && x.VehicleName.ToLower().Contains(q))).ToList();
                }

                var assignments = await _context.TransportVehicleAssignments
                    .Include(x => x.Route)
                    .Include(x => x.Driver)
                    .Where(x => !x.IsDeleted && x.Status)
                    .ToListAsync();

                var list = new List<GpsVehicleTrackingDto>();

                foreach (var v in vehicles)
                {
                    var assignment = assignments.FirstOrDefault(a => a.VehicleId == v.VehicleId);
                    var routeName = assignment?.Route?.RouteName ?? "Unassigned Route";
                    var driverName = assignment?.Driver?.DriverName ?? "Unassigned";
                    var driverMobile = assignment?.Driver?.MobileNumber ?? "+1 555-333-444";
                    var attendantName = assignment?.Attendant?.AttendantName ?? "Unassigned";

                    var stops = new List<RouteStopDto>();
                    if (assignment != null)
                    {
                        var pickupPoints = await _context.PickupPoints
                            .Where(p => p.RouteId == assignment.RouteId)
                            .OrderBy(p => p.SequenceNo)
                            .ToListAsync();

                        stops = pickupPoints.Select(p => new RouteStopDto
                        {
                            StopId = p.PickupPointId,
                            StopName = p.PickupPointName ?? string.Empty,
                            DistanceKm = p.DistanceFromStart,
                            ScheduledTime = p.PickupTime != default ? DateTime.Today.Add(p.PickupTime).ToString("hh:mm tt") : "-"
                        }).ToList();
                    }

                    list.Add(new GpsVehicleTrackingDto
                    {
                        VehicleId = v.VehicleId,
                        VehicleNumber = v.VehicleNumber ?? $"VH-{v.VehicleId}",
                        VehicleName = v.VehicleName ?? "School Bus",
                        RouteName = routeName,
                        DriverName = driverName,
                        DriverMobile = driverMobile,
                        AttendantName = attendantName,
                        Speed = "40 km/h",
                        Eta = "22 mins",
                        GpsSignal = "Online",
                        CurrentStop = "Main Bus Depot",
                        NextStop = "Central Waypoint",
                        TripStatus = "Running",
                        RouteProgress = "11%",
                        RouteStops = stops
                    });
                }

                return Ok(new
                {
                    success = true,
                    vehicles = list,
                    data = list,
                    totalCount = list.Count
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = true,
                    vehicles = new List<GpsVehicleTrackingDto>(),
                    data = new List<GpsVehicleTrackingDto>(),
                    totalCount = 0,
                    error = ex.Message
                });
            }
        }
    }
}
