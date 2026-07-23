using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.Reports;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class TransportReportRepository : ITransportReportRepository
    {
        private readonly AppDbContext _context;

        public TransportReportRepository(AppDbContext context)
        {
            _context = context;
        }

        // -------------------------------------------------------
        // Vehicle-wise student report
        // -------------------------------------------------------

        public async Task<IEnumerable<VehicleStudentReportDto>>
            GetVehicleWiseAsync(ReportFilterDto filter)
        {
            var today = DateTime.UtcNow.Date;

            var query = _context.TransportVehicles
                .AsNoTracking()
                .Where(vehicle => !vehicle.IsDeleted)
                .AsQueryable();

            if (filter.VehicleId.HasValue)
            {
                query = query.Where(vehicle =>
                    vehicle.VehicleId == filter.VehicleId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.Trim().ToLower();

                query = query.Where(vehicle =>
                    vehicle.VehicleNumber.ToLower().Contains(search) ||
                    vehicle.VehicleName.ToLower().Contains(search) ||
                    vehicle.RegistrationNumber.ToLower().Contains(search));
            }

            var data = await query
                .Select(vehicle => new
                {
                    vehicle.VehicleId,
                    vehicle.VehicleNumber,
                    vehicle.VehicleName,
                    vehicle.Capacity,

                    AssignedStudents = _context
                        .StudentTransportAssignments
                        .Count(studentAssignment =>
                            !studentAssignment.IsDeleted &&
                            studentAssignment.Status &&
                            studentAssignment.EffectiveFrom <= today &&
                            (!studentAssignment.EffectiveTo.HasValue ||
                             studentAssignment.EffectiveTo.Value >= today) &&

                            _context.TransportVehicleAssignments.Any(
                                vehicleAssignment =>
                                    !vehicleAssignment.IsDeleted &&
                                    vehicleAssignment.Status &&
                                    vehicleAssignment.AssignmentId ==
                                        studentAssignment.VehicleAssignmentId &&
                                    vehicleAssignment.VehicleId ==
                                        vehicle.VehicleId &&
                                    vehicleAssignment.EffectiveFrom <= today &&
                                    (!vehicleAssignment.EffectiveTo.HasValue ||
                                     vehicleAssignment.EffectiveTo.Value >= today)))
                })
                .OrderBy(x => x.VehicleNumber)
                .ToListAsync();

            return data.Select(x =>
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

                return new VehicleStudentReportDto
                {
                    VehicleId = x.VehicleId,
                    VehicleNumber = x.VehicleNumber,
                    VehicleName = x.VehicleName,
                    Capacity = x.Capacity,
                    AssignedStudents = x.AssignedStudents,
                    AvailableSeats = availableSeats,
                    OccupancyPercentage = occupancyPercentage
                };
            }).ToList();
        }

        // -------------------------------------------------------
        // Route-wise student report
        // -------------------------------------------------------

        public async Task<IEnumerable<RouteStudentReportDto>>
            GetRouteWiseAsync(ReportFilterDto filter)
        {
            var today = DateTime.UtcNow.Date;

            var query = _context.TransportRoutes
                .AsNoTracking()
                .Where(route => !route.IsDeleted)
                .AsQueryable();

            if (filter.RouteId.HasValue)
            {
                query = query.Where(route =>
                    route.RouteId == filter.RouteId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.Trim().ToLower();

                query = query.Where(route =>
                    route.RouteName.ToLower().Contains(search));
            }

            return await query
                .Select(route => new RouteStudentReportDto
                {
                    RouteId = route.RouteId,
                    RouteName = route.RouteName,

                    StudentCount = _context
                        .StudentTransportAssignments
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
        }

        // -------------------------------------------------------
        // Pickup-point-wise student report
        // -------------------------------------------------------

        public async Task<IEnumerable<PickupPointReportDto>>
            GetPickupPointWiseAsync(ReportFilterDto filter)
        {
            var today = DateTime.UtcNow.Date;

            var query = _context.PickupPoints
                .AsNoTracking()
                .Where(point => !point.IsDeleted)
                .AsQueryable();

            if (filter.RouteId.HasValue)
            {
                query = query.Where(point =>
                    point.RouteId == filter.RouteId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.Trim().ToLower();

                query = query.Where(point =>
                    point.PickupPointName.ToLower().Contains(search) ||
                    (point.Landmark != null &&
                     point.Landmark.ToLower().Contains(search)));
            }

            return await query
                .Select(point => new PickupPointReportDto
                {
                    PickupPointId = point.PickupPointId,
                    PickupPointName = point.PickupPointName,

                    RouteName = point.TransportRoute != null
                        ? point.TransportRoute.RouteName
                        : string.Empty,

                    StudentCount = _context
                        .StudentTransportAssignments
                        .Count(assignment =>
                            !assignment.IsDeleted &&
                            assignment.Status &&
                            assignment.PickupPointId ==
                                point.PickupPointId &&
                            assignment.EffectiveFrom <= today &&
                            (!assignment.EffectiveTo.HasValue ||
                             assignment.EffectiveTo.Value >= today))
                })
                .OrderBy(x => x.RouteName)
                .ThenBy(x => x.PickupPointName)
                .ToListAsync();
        }

        // -------------------------------------------------------
        // Driver-wise vehicle report
        // -------------------------------------------------------

        public async Task<IEnumerable<DriverVehicleReportDto>>
            GetDriverWiseAsync(ReportFilterDto filter)
        {
            var today = DateTime.UtcNow.Date;

            var query = _context.TransportVehicleAssignments
                .AsNoTracking()
                .Where(assignment =>
                    !assignment.IsDeleted &&
                    assignment.Status &&
                    assignment.EffectiveFrom <= today &&
                    (!assignment.EffectiveTo.HasValue ||
                     assignment.EffectiveTo.Value >= today))
                .AsQueryable();

            if (filter.DriverId.HasValue)
            {
                query = query.Where(assignment =>
                    assignment.DriverId == filter.DriverId.Value);
            }

            if (filter.VehicleId.HasValue)
            {
                query = query.Where(assignment =>
                    assignment.VehicleId == filter.VehicleId.Value);
            }

            if (filter.RouteId.HasValue)
            {
                query = query.Where(assignment =>
                    assignment.RouteId == filter.RouteId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.Trim().ToLower();

                query = query.Where(assignment =>
                    assignment.Driver.DriverName
                        .ToLower()
                        .Contains(search) ||

                    assignment.Vehicle.VehicleNumber
                        .ToLower()
                        .Contains(search) ||

                    assignment.Route.RouteName
                        .ToLower()
                        .Contains(search));
            }

            return await query
                .Select(assignment => new DriverVehicleReportDto
                {
                    DriverId = assignment.DriverId,
                    DriverName = assignment.Driver.DriverName,
                    VehicleNumber =
                        assignment.Vehicle.VehicleNumber,
                    RouteName = assignment.Route.RouteName
                })
                .OrderBy(x => x.DriverName)
                .ThenBy(x => x.VehicleNumber)
                .ToListAsync();
        }

        // -------------------------------------------------------
        // Seat occupancy report
        // -------------------------------------------------------

        public async Task<IEnumerable<VehicleStudentReportDto>>
            GetSeatOccupancyAsync(ReportFilterDto filter)
        {
            return await GetVehicleWiseAsync(filter);
        }

        // -------------------------------------------------------
        // Vehicle maintenance report
        // -------------------------------------------------------

        public async Task<IEnumerable<MaintenanceReportDto>>
            GetMaintenanceAsync(ReportFilterDto filter)
        {
            var query = _context.VehicleMaintenances
                .AsNoTracking()
                .Where(maintenance => !maintenance.IsDeleted)
                .AsQueryable();

            if (filter.VehicleId.HasValue)
            {
                query = query.Where(maintenance =>
                    maintenance.VehicleId == filter.VehicleId.Value);
            }

            if (filter.FromDate.HasValue)
            {
                var fromDate = filter.FromDate.Value.Date;

                query = query.Where(maintenance =>
                    maintenance.ServiceDate >= fromDate);
            }

            if (filter.ToDate.HasValue)
            {
                var toDateExclusive =
                    filter.ToDate.Value.Date.AddDays(1);

                query = query.Where(maintenance =>
                    maintenance.ServiceDate < toDateExclusive);
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.Trim().ToLower();

                query = query.Where(maintenance =>
                    maintenance.ServiceType
                        .ToLower()
                        .Contains(search) ||

                    maintenance.Vehicle.VehicleNumber
                        .ToLower()
                        .Contains(search) ||

                    (maintenance.VendorCenter != null &&
                     maintenance.VendorCenter
                         .ToLower()
                         .Contains(search)));
            }

            return await query
                .OrderByDescending(maintenance =>
                    maintenance.ServiceDate)
                .Select(maintenance => new MaintenanceReportDto
                {
                    MaintenanceId = maintenance.MaintenanceId,
                    VehicleNumber =
                        maintenance.Vehicle.VehicleNumber,
                    ServiceType = maintenance.ServiceType,
                    ServiceDate = maintenance.ServiceDate,
                    Cost = maintenance.Cost,
                    VendorCenter = maintenance.VendorCenter
                })
                .ToListAsync();
        }

        // -------------------------------------------------------
        // Monthly maintenance cost report
        // -------------------------------------------------------

        public async Task<IEnumerable<MonthlyMaintenanceCostDto>>
            GetMonthlyCostAsync(ReportFilterDto filter)
        {
            var query = _context.VehicleMaintenances
                .AsNoTracking()
                .Where(maintenance => !maintenance.IsDeleted)
                .AsQueryable();

            if (filter.VehicleId.HasValue)
            {
                query = query.Where(maintenance =>
                    maintenance.VehicleId == filter.VehicleId.Value);
            }

            if (filter.FromDate.HasValue)
            {
                var fromDate = filter.FromDate.Value.Date;

                query = query.Where(maintenance =>
                    maintenance.ServiceDate >= fromDate);
            }

            if (filter.ToDate.HasValue)
            {
                var toDateExclusive =
                    filter.ToDate.Value.Date.AddDays(1);

                query = query.Where(maintenance =>
                    maintenance.ServiceDate < toDateExclusive);
            }

            var groupedData = await query
                .GroupBy(maintenance => new
                {
                    maintenance.ServiceDate.Year,
                    maintenance.ServiceDate.Month
                })
                .Select(group => new
                {
                    group.Key.Year,
                    group.Key.Month,
                    ServiceCount = group.Count(),
                    TotalCost = group.Sum(x => x.Cost)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToListAsync();

            return groupedData.Select(x =>
                new MonthlyMaintenanceCostDto
                {
                    Year = x.Year,
                    Month = x.Month,
                    MonthName = new DateTime(
                        x.Year,
                        x.Month,
                        1).ToString("MMMM"),
                    ServiceCount = x.ServiceCount,
                    TotalCost = x.TotalCost
                })
                .ToList();
        }
    }
}