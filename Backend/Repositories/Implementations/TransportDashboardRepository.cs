using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.Dashboard;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class TransportDashboardRepository : ITransportDashboardRepository
    {
        private readonly AppDbContext _context;

        public TransportDashboardRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TransportDashboardResponseDto> GetDashboardAsync()
        {
            var today = DateTime.UtcNow.Date;
            var monthStart = new DateTime(today.Year, today.Month, 1);
            var nextMonthStart = monthStart.AddMonths(1);
            var maintenanceDueLimit = today.AddDays(30);

            // ----------------------------------------------------
            // Vehicle Summary
            // ----------------------------------------------------

            var totalVehicles = await _context.TransportVehicles
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted);

            var activeVehicles = await _context.TransportVehicles
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted && x.Status);

            var inactiveVehicles = totalVehicles - activeVehicles;

            // ----------------------------------------------------
            // Route Summary
            // ----------------------------------------------------

            var totalRoutes = await _context.TransportRoutes
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted);

            var activeRoutes = await _context.TransportRoutes
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted && x.Status);

            // ----------------------------------------------------
            // Driver Summary
            // ----------------------------------------------------

            var totalDrivers = await _context.TransportDrivers
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted);

            var activeDrivers = await _context.TransportDrivers
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted && x.Status);

            // ----------------------------------------------------
            // Bus Attendant Summary
            // ----------------------------------------------------

            var totalBusAttendants = await _context.TransportAttendants
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted);

            var activeBusAttendants = await _context.TransportAttendants
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted && x.Status);

            // ----------------------------------------------------
            // Pickup Point Summary
            // ----------------------------------------------------

            var totalPickupPoints = await _context.PickupPoints
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted && x.Status);

            // ----------------------------------------------------
            // Active Student Transport Assignments
            // ----------------------------------------------------

            var studentsUsingTransport = await _context
                .StudentTransportAssignments
                .AsNoTracking()
                .CountAsync(x =>
                    !x.IsDeleted &&
                    x.Status &&
                    x.EffectiveFrom <= today &&
                    (!x.EffectiveTo.HasValue ||
                     x.EffectiveTo.Value >= today));

            // ----------------------------------------------------
            // Expiring Documents & Licenses
            // ----------------------------------------------------

            var expiringVehicleDocuments = await _context.TransportVehicles
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted && (
                    (x.InsuranceExpiry.HasValue && x.InsuranceExpiry.Value <= maintenanceDueLimit) ||
                    (x.PollutionExpiry.HasValue && x.PollutionExpiry.Value <= maintenanceDueLimit) ||
                    (x.FitnessExpiry.HasValue && x.FitnessExpiry.Value <= maintenanceDueLimit)
                ));

            var expiringDriverLicenses = await _context.TransportDrivers
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted &&
                    x.LicenceExpiry.HasValue && x.LicenceExpiry.Value <= maintenanceDueLimit);

            var warningMessage = $"{expiringVehicleDocuments} vehicle document(s) and {expiringDriverLicenses} driver license(s) expiring within 30 days!";

            // ----------------------------------------------------
            // Vehicles Under Maintenance
            // ----------------------------------------------------

            var vehiclesUnderMaintenance = await _context.VehicleMaintenances
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted && x.Status && x.NextServiceDue.HasValue && x.NextServiceDue.Value <= today);

            // ----------------------------------------------------
            // Total Vehicle Capacity
            // ----------------------------------------------------

            var totalVehicleCapacity = await _context.TransportVehicles
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.Status)
                .SumAsync(x => (int?)x.Capacity) ?? 0;

            var seatOccupancyPercentage =
                totalVehicleCapacity == 0
                    ? 0
                    : Math.Round(
                        (decimal)studentsUsingTransport /
                        totalVehicleCapacity * 100,
                        2);

            // ----------------------------------------------------
            // Maintenance Summary
            // ----------------------------------------------------

            var maintenanceDueSoon = await _context.VehicleMaintenances
                .AsNoTracking()
                .CountAsync(x =>
                    !x.IsDeleted &&
                    x.Status &&
                    x.NextServiceDue.HasValue &&
                    x.NextServiceDue.Value >= today &&
                    x.NextServiceDue.Value <= maintenanceDueLimit);

            var currentMonthMaintenanceCost = await _context
                .VehicleMaintenances
                .AsNoTracking()
                .Where(x =>
                    !x.IsDeleted &&
                    x.ServiceDate >= monthStart &&
                    x.ServiceDate < nextMonthStart)
                .SumAsync(x => (decimal?)x.Cost) ?? 0;

            // ----------------------------------------------------
            // Today's Operations Cards & Statuses
            // ----------------------------------------------------

            var todayAssignments = await _context.TransportVehicleAssignments
                .AsNoTracking()
                .Include(x => x.Vehicle)
                .Include(x => x.Route)
                .Include(x => x.Driver)
                .Where(x => !x.IsDeleted && x.Status && x.EffectiveFrom <= today && (!x.EffectiveTo.HasValue || x.EffectiveTo.Value >= today))
                .ToListAsync();

            var todayOperations = todayAssignments.Select((x, index) => new TodayOperationDto
            {
                AssignmentId = x.AssignmentId,
                VehicleId = x.VehicleId,
                VehicleNumber = x.Vehicle?.VehicleNumber ?? $"V-10{index + 1}",
                RegistrationNumber = x.Vehicle?.RegistrationNumber ?? x.Vehicle?.VehicleNumber ?? "",
                RouteId = x.RouteId,
                RouteName = x.Route?.RouteName ?? $"Route {index + 1}",
                RouteCode = x.Route?.RouteCode ?? $"R-0{index + 1}",
                DriverId = x.DriverId,
                DriverName = x.Driver?.DriverName ?? "Assigned Driver",
                AttendantId = x.AttendantId,
                AttendantName = "Unassigned",
                Status = index % 3 == 0 ? "Morning Running" : (index % 3 == 1 ? "Morning Completed" : "Evening Pending"),
                Shift = x.Shift ?? "Morning"
            }).ToList();

            var morningRunningCount = todayOperations.Count(x => x.Status == "Morning Running");
            var morningCompletedCount = todayOperations.Count(x => x.Status == "Morning Completed");
            var eveningPendingCount = todayOperations.Count(x => x.Status == "Evening Pending");

            // ----------------------------------------------------
            // Route-wise Student Count
            // ----------------------------------------------------

            var routeStudents = await _context.TransportRoutes
                .AsNoTracking()
                .Where(route =>
                    !route.IsDeleted &&
                    route.Status)
                .Select(route => new RouteStudentSummaryDto
                {
                    RouteId = route.RouteId,
                    RouteName = route.RouteName,

                    StudentCount = _context.StudentTransportAssignments
                        .Count(assignment =>
                            !assignment.IsDeleted &&
                            assignment.Status &&
                            assignment.RouteId == route.RouteId &&
                            assignment.EffectiveFrom <= today &&
                            (!assignment.EffectiveTo.HasValue ||
                             assignment.EffectiveTo.Value >= today))
                })
                .OrderByDescending(x => x.StudentCount)
                .ThenBy(x => x.RouteName)
                .ToListAsync();

            // ----------------------------------------------------
            // Vehicle-wise Seat Occupancy
            // ----------------------------------------------------

            var vehicleOccupancyData = await _context.TransportVehicles
                .AsNoTracking()
                .Where(vehicle =>
                    !vehicle.IsDeleted &&
                    vehicle.Status)
                .Select(vehicle => new
                {
                    vehicle.VehicleId,
                    vehicle.VehicleNumber,

                    Capacity = vehicle.Capacity,

                    AssignedStudents = _context
                        .StudentTransportAssignments
                        .Count(studentAssignment =>
                            !studentAssignment.IsDeleted &&
                            studentAssignment.Status &&
                            studentAssignment.EffectiveFrom <= today &&
                            (!studentAssignment.EffectiveTo.HasValue ||
                             studentAssignment.EffectiveTo.Value >= today) &&

                            _context.TransportVehicleAssignments
                                .Any(vehicleAssignment =>
                                    vehicleAssignment.AssignmentId ==
                                        studentAssignment.VehicleAssignmentId &&

                                    vehicleAssignment.VehicleId ==
                                        vehicle.VehicleId &&

                                    !vehicleAssignment.IsDeleted &&
                                    vehicleAssignment.Status &&
                                    vehicleAssignment.EffectiveFrom <= today &&
                                    (!vehicleAssignment.EffectiveTo.HasValue ||
                                     vehicleAssignment.EffectiveTo.Value >= today)))
                })
                .ToListAsync();

            var vehicleOccupancyResult = vehicleOccupancyData
                .Select(x =>
                {
                    var availableSeats = Math.Max(
                        x.Capacity - x.AssignedStudents,
                        0);

                    var occupancyPercentage =
                        x.Capacity <= 0
                            ? 0
                            : Math.Round(
                                (decimal)x.AssignedStudents /
                                x.Capacity * 100,
                                2);

                    return new VehicleOccupancyDto
                    {
                        VehicleId = x.VehicleId,
                        VehicleNumber = x.VehicleNumber ?? string.Empty,
                        Capacity = x.Capacity,
                        AssignedStudents = x.AssignedStudents,
                        AvailableSeats = availableSeats,
                        OccupancyPercentage = occupancyPercentage
                    };
                })
                .OrderByDescending(x => x.OccupancyPercentage)
                .ThenBy(x => x.VehicleNumber)
                .ToList();

            // ----------------------------------------------------
            // Upcoming Maintenance
            // ----------------------------------------------------

            var maintenanceDueData = await _context.VehicleMaintenances
                .AsNoTracking()
                .Where(x =>
                    !x.IsDeleted &&
                    x.Status &&
                    x.NextServiceDue.HasValue &&
                    x.NextServiceDue.Value >= today &&
                    x.NextServiceDue.Value <= maintenanceDueLimit)
                .OrderBy(x => x.NextServiceDue)
                .Select(x => new
                {
                    x.MaintenanceId,
                    x.VehicleId,
                    VehicleNumber = x.Vehicle != null && x.Vehicle.VehicleNumber != null ? x.Vehicle.VehicleNumber : string.Empty,
                    x.ServiceType,
                    NextServiceDue = x.NextServiceDue!.Value
                })
                .ToListAsync();

            var maintenanceDue = maintenanceDueData
                .Select(x => new MaintenanceDueDto
                {
                    MaintenanceId = x.MaintenanceId,
                    VehicleId = x.VehicleId,
                    VehicleNumber = x.VehicleNumber ?? string.Empty,
                    ServiceType = x.ServiceType,
                    NextServiceDue = x.NextServiceDue,
                    DaysRemaining = (x.NextServiceDue.Date - today).Days
                })
                .ToList();

            // ----------------------------------------------------
            // Final Dashboard Response
            // ----------------------------------------------------

            return new TransportDashboardResponseDto
            {
                Summary = new TransportDashboardDto
                {
                    TotalVehicles = totalVehicles,
                    ActiveVehicles = activeVehicles,
                    InactiveVehicles = inactiveVehicles,
                    TotalRoutes = totalRoutes,
                    ActiveRoutes = activeRoutes,
                    TotalDrivers = totalDrivers,
                    ActiveDrivers = activeDrivers,
                    TotalBusAttendants = totalBusAttendants,
                    ActiveBusAttendants = activeBusAttendants,
                    TotalPickupPoints = totalPickupPoints,
                    StudentsUsingTransport = studentsUsingTransport,
                    VehiclesUnderMaintenance = vehiclesUnderMaintenance,
                    ExpiringVehicleDocuments = expiringVehicleDocuments,
                    ExpiringDriverLicenses = expiringDriverLicenses,
                    WarningMessage = warningMessage,
                    MorningRunningCount = morningRunningCount,
                    MorningCompletedCount = morningCompletedCount,
                    EveningPendingCount = eveningPendingCount,
                    DelayedTripsCount = 0,
                    TotalVehicleCapacity = totalVehicleCapacity,
                    SeatOccupancyPercentage = seatOccupancyPercentage,
                    MaintenanceDueSoon = maintenanceDueSoon,
                    CurrentMonthMaintenanceCost = currentMonthMaintenanceCost
                },

                TodayOperations = todayOperations,
                RouteStudents = routeStudents,
                VehicleOccupancy = vehicleOccupancyResult,
                MaintenanceDue = maintenanceDue
            };
        }
    }
}