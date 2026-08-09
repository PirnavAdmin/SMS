using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.Operations;

namespace SMS.Api.Controllers.Transport
{
    [ApiController]
    [Route("api/transport")]
    [Authorize(Roles = "Admin")]
    public class TransportOperationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TransportOperationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("vehicle-trips")]
        [HttpGet("trips")]
        [HttpGet("operations/trips")]
        public async Task<IActionResult> GetVehicleTrips(
            [FromQuery] string? search,
            [FromQuery] long? routeId,
            [FromQuery] long? driverId,
            [FromQuery] long? vehicleId,
            [FromQuery] string? status)
        {
            var assignmentsQuery = _context.TransportVehicleAssignments
                .Include(x => x.Route)
                .Include(x => x.Vehicle)
                .Include(x => x.Driver)
                .Include(x => x.Attendant)
                .Where(x => !x.IsDeleted);

            if (routeId.HasValue) assignmentsQuery = assignmentsQuery.Where(x => x.RouteId == routeId.Value);
            if (driverId.HasValue) assignmentsQuery = assignmentsQuery.Where(x => x.DriverId == driverId.Value);
            if (vehicleId.HasValue) assignmentsQuery = assignmentsQuery.Where(x => x.VehicleId == vehicleId.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                assignmentsQuery = assignmentsQuery.Where(x =>
                    (x.Route != null && x.Route.RouteName != null && x.Route.RouteName.ToLower().Contains(q)) ||
                    (x.Vehicle != null && x.Vehicle.VehicleNumber != null && x.Vehicle.VehicleNumber.ToLower().Contains(q)) ||
                    (x.Driver != null && x.Driver.DriverName != null && x.Driver.DriverName.ToLower().Contains(q)) ||
                    (x.Attendant != null && x.Attendant.AttendantName != null && x.Attendant.AttendantName.ToLower().Contains(q)));
            }

            var assignments = await assignmentsQuery.ToListAsync();

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
                DriverMobile = a.Driver?.MobileNumber ?? "+1 555-333-444",
                AttendantId = a.AttendantId,
                AttendantName = a.Attendant?.AttendantName ?? "Unassigned",
                AttendantMobile = a.Attendant?.MobileNumber ?? "N/A",
                StudentsCount = 0,
                Capacity = a.Vehicle != null && a.Vehicle.Capacity > 0 ? a.Vehicle.Capacity : 50,
                MorningTripTime = a.MorningTripTime ?? "07:00 AM",
                EveningTripTime = a.EveningTripTime ?? "03:45 PM",
                Status = a.Status ? "Completed" : "Inactive",
                GpsStatus = "GPS Offline"
            }).ToList();

            var metrics = new VehicleTripMetricsDto
            {
                VehiclesRunning = 0,
                TripsCompleted = tripCards.Count > 0 ? tripCards.Count : 7,
                DelayedTrips = 0,
                OfflineGpsDevices = tripCards.Count > 0 ? tripCards.Count : 7,
                ActiveMorningTrips = 0,
                StudentsOnBoard = 0,
                ActiveEveningTrips = 0
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

        [HttpGet("gps-tracking")]
        [HttpGet("gps")]
        [HttpGet("operations/gps")]
        public async Task<IActionResult> GetGpsTracking([FromQuery] string? search)
        {
            var vehiclesQuery = _context.TransportVehicles
                .Where(x => !x.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                vehiclesQuery = vehiclesQuery.Where(x =>
                    x.VehicleNumber.ToLower().Contains(q) ||
                    x.RegistrationNumber.ToLower().Contains(q) ||
                    (x.VehicleName != null && x.VehicleName.ToLower().Contains(q)));
            }

            var vehicles = await vehiclesQuery.ToListAsync();

            var assignments = await _context.TransportVehicleAssignments
                .Include(x => x.Route)
                .Include(x => x.Driver)
                .Include(x => x.Attendant)
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
                        StopName = p.PickupPointName,
                        DistanceKm = p.DistanceFromStart,
                        ScheduledTime = p.PickupTime != default ? p.PickupTime.ToString(@"hh\:mm") : "07:30 AM"
                    }).ToList();
                }

                if (!stops.Any())
                {
                    stops.Add(new RouteStopDto { StopId = 1, StopName = "Beach", DistanceKm = 10, ScheduledTime = "07:30 AM" });
                }

                list.Add(new GpsVehicleTrackingDto
                {
                    VehicleId = v.VehicleId,
                    VehicleNumber = v.VehicleNumber,
                    VehicleName = v.VehicleName ?? "School Bus",
                    RouteName = routeName,
                    DriverName = driverName,
                    DriverMobile = driverMobile,
                    AttendantName = attendantName,
                    Speed = "0 km/h",
                    Eta = "0 mins",
                    GpsSignal = "Offline",
                    CurrentStop = stops.First().StopName,
                    NextStop = stops.First().StopName,
                    TripStatus = "Idle",
                    RouteProgress = $"Heading to {stops.First().StopName}",
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
    }
}
