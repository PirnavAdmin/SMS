using Microsoft.EntityFrameworkCore;
using SMS.Api.Common;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.StudentTransportAssignment;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class StudentTransportAssignmentRepository
        : IStudentTransportAssignmentRepository
    {
        private readonly AppDbContext _context;

        public StudentTransportAssignmentRepository(AppDbContext context)
        {
            _context = context;
        }

        // ---------------------------------------------------------
        // Get All - Search, Filter, Sort and Pagination
        // ---------------------------------------------------------
        public async Task<PagedResult<StudentTransportAssignmentDto>>
            GetAllAsync(StudentTransportAssignmentFilterDto filter)
        {
            var query = _context.StudentTransportAssignments
                .AsNoTracking()
                .Where(x => !x.IsDeleted)
                .AsQueryable();

            // Search
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.Trim();

                query = query.Where(x =>
                    x.StudentId.ToString().Contains(search) ||
                    x.Route.RouteName.Contains(search) ||
                    x.PickupPoint.PickupPointName.Contains(search) ||
                    x.VehicleAssignment.Vehicle.VehicleNumber.Contains(search) ||
                    x.VehicleAssignment.Driver.DriverName.Contains(search) ||
                    x.TransportType.Contains(search));
            }

            // Student filter
            if (filter.StudentId.HasValue &&
                filter.StudentId.Value > 0)
            {
                query = query.Where(x =>
                    x.StudentId == filter.StudentId.Value);
            }

            // Route filter
            if (filter.RouteId.HasValue &&
                filter.RouteId.Value > 0)
            {
                query = query.Where(x =>
                    x.RouteId == filter.RouteId.Value);
            }

            // Pickup point filter
            if (filter.PickupPointId.HasValue &&
                filter.PickupPointId.Value > 0)
            {
                query = query.Where(x =>
                    x.PickupPointId == filter.PickupPointId.Value);
            }

            // Vehicle assignment filter
            if (filter.VehicleAssignmentId.HasValue &&
                filter.VehicleAssignmentId.Value > 0)
            {
                query = query.Where(x =>
                    x.VehicleAssignmentId ==
                    filter.VehicleAssignmentId.Value);
            }

            // Transport type filter
            if (!string.IsNullOrWhiteSpace(filter.TransportType))
            {
                var transportType = filter.TransportType.Trim();

                query = query.Where(x =>
                    x.TransportType == transportType);
            }

            // Status filter
            if (filter.Status.HasValue)
            {
                query = query.Where(x =>
                    x.Status == filter.Status.Value);
            }

            var totalCount = await query.CountAsync();

            // Sorting
            query = ApplySorting(
                query,
                filter.SortBy,
                filter.SortOrder);

            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(x => new StudentTransportAssignmentDto
                {
                    StudentTransportAssignmentId =
                        x.StudentTransportAssignmentId,

                    StudentId = x.StudentId,

                    RouteId = x.RouteId,
                    RouteName = x.Route.RouteName,

                    PickupPointId = x.PickupPointId,
                    PickupPointName =
                        x.PickupPoint.PickupPointName,

                    VehicleAssignmentId =
                        x.VehicleAssignmentId,

                    VehicleNumber =
                        x.VehicleAssignment.Vehicle.VehicleNumber,

                    DriverName =
                        x.VehicleAssignment.Driver.DriverName,

                    EffectiveFrom = x.EffectiveFrom,
                    EffectiveTo = x.EffectiveTo,

                    TransportType = x.TransportType,
                    Remarks = x.Remarks,
                    Status = x.Status,

                    CreatedBy = x.CreatedBy,
                    UpdatedBy = x.UpdatedBy,
                    CreatedAt = x.CreatedAt,
                    UpdatedAt = x.UpdatedAt
                })
                .ToListAsync();

            return new PagedResult<StudentTransportAssignmentDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        // ---------------------------------------------------------
        // Get By Id
        // ---------------------------------------------------------
        public async Task<StudentTransportAssignmentDto?> GetByIdAsync(
            long studentTransportAssignmentId)
        {
            return await _context.StudentTransportAssignments
                .AsNoTracking()
                .Where(x =>
                    x.StudentTransportAssignmentId ==
                    studentTransportAssignmentId &&
                    !x.IsDeleted)
                .Select(x => new StudentTransportAssignmentDto
                {
                    StudentTransportAssignmentId =
                        x.StudentTransportAssignmentId,

                    StudentId = x.StudentId,

                    RouteId = x.RouteId,
                    RouteName = x.Route.RouteName,

                    PickupPointId = x.PickupPointId,
                    PickupPointName =
                        x.PickupPoint.PickupPointName,

                    VehicleAssignmentId =
                        x.VehicleAssignmentId,

                    VehicleNumber =
                        x.VehicleAssignment.Vehicle.VehicleNumber,

                    DriverName =
                        x.VehicleAssignment.Driver.DriverName,

                    EffectiveFrom = x.EffectiveFrom,
                    EffectiveTo = x.EffectiveTo,

                    TransportType = x.TransportType,
                    Remarks = x.Remarks,
                    Status = x.Status,

                    CreatedBy = x.CreatedBy,
                    UpdatedBy = x.UpdatedBy,
                    CreatedAt = x.CreatedAt,
                    UpdatedAt = x.UpdatedAt
                })
                .FirstOrDefaultAsync();
        }

        // ---------------------------------------------------------
        // Create
        // ---------------------------------------------------------
        public async Task<long> CreateAsync(
            CreateStudentTransportAssignmentDto dto,
            long? userId)
        {
            var entity = new StudentTransportAssignment
            {
                StudentId = dto.StudentId,
                RouteId = dto.RouteId,
                PickupPointId = dto.PickupPointId,
                VehicleAssignmentId = dto.VehicleAssignmentId,

                EffectiveFrom = dto.EffectiveFrom.Date,
                EffectiveTo = dto.EffectiveTo?.Date,

                TransportType = dto.TransportType,
                Remarks = dto.Remarks,
                Status = dto.Status,

                IsDeleted = false,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.StudentTransportAssignments
                .AddAsync(entity);

            await _context.SaveChangesAsync();

            return entity.StudentTransportAssignmentId;
        }

        // ---------------------------------------------------------
        // Update
        // ---------------------------------------------------------
        public async Task<bool> UpdateAsync(
            long studentTransportAssignmentId,
            UpdateStudentTransportAssignmentDto dto,
            long? userId)
        {
            var entity = await _context.StudentTransportAssignments
                .FirstOrDefaultAsync(x =>
                    x.StudentTransportAssignmentId ==
                    studentTransportAssignmentId &&
                    !x.IsDeleted);

            if (entity == null)
                return false;

            entity.StudentId = dto.StudentId;
            entity.RouteId = dto.RouteId;
            entity.PickupPointId = dto.PickupPointId;
            entity.VehicleAssignmentId =
                dto.VehicleAssignmentId;

            entity.EffectiveFrom = dto.EffectiveFrom.Date;
            entity.EffectiveTo = dto.EffectiveTo?.Date;

            entity.TransportType = dto.TransportType;
            entity.Remarks = dto.Remarks;
            entity.Status = dto.Status;

            entity.UpdatedBy = userId;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        // ---------------------------------------------------------
        // Soft Delete
        // ---------------------------------------------------------
        public async Task<bool> DeleteAsync(
            long studentTransportAssignmentId,
            long? userId)
        {
            var entity = await _context.StudentTransportAssignments
                .FirstOrDefaultAsync(x =>
                    x.StudentTransportAssignmentId ==
                    studentTransportAssignmentId &&
                    !x.IsDeleted);

            if (entity == null)
                return false;

            entity.IsDeleted = true;
            entity.Status = false;
            entity.UpdatedBy = userId;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        // ---------------------------------------------------------
        // Lookup
        // ---------------------------------------------------------
        public async Task<IEnumerable<
            StudentTransportAssignmentLookupDto>>
            GetLookupAsync()
        {
            return await _context.StudentTransportAssignments
                .AsNoTracking()
                .Where(x =>
                    !x.IsDeleted &&
                    x.Status)
                .OrderBy(x => x.StudentId)
                .Select(x =>
                    new StudentTransportAssignmentLookupDto
                    {
                        StudentTransportAssignmentId =
                            x.StudentTransportAssignmentId,

                        StudentId = x.StudentId,

                        RouteId = x.RouteId,
                        RouteName = x.Route.RouteName,

                        PickupPointId = x.PickupPointId,
                        PickupPointName =
                            x.PickupPoint.PickupPointName,

                        VehicleAssignmentId =
                            x.VehicleAssignmentId,

                        VehicleNumber =
                            x.VehicleAssignment
                                .Vehicle.VehicleNumber,

                        DriverName =
                            x.VehicleAssignment
                                .Driver.DriverName,

                        DisplayName =
                            x.StudentId + " - " +
                            x.Route.RouteName + " - " +
                            x.PickupPoint.PickupPointName
                    })
                .ToListAsync();
        }

        // ---------------------------------------------------------
        // Check Student Assignment Date Overlap
        // ---------------------------------------------------------
        public async Task<bool> HasOverlappingAssignmentAsync(
            long studentId,
            DateTime effectiveFrom,
            DateTime? effectiveTo,
            long? excludeAssignmentId = null)
        {
            var newStart = effectiveFrom.Date;

            var newEnd = effectiveTo?.Date ??
                         DateTime.MaxValue.Date;

            var query = _context.StudentTransportAssignments
                .AsNoTracking()
                .Where(x =>
                    x.StudentId == studentId &&
                    !x.IsDeleted &&
                    x.Status);

            if (excludeAssignmentId.HasValue)
            {
                query = query.Where(x =>
                    x.StudentTransportAssignmentId !=
                    excludeAssignmentId.Value);
            }

            return await query.AnyAsync(x =>
                x.EffectiveFrom.Date <= newEnd &&
                (x.EffectiveTo == null ||
                 x.EffectiveTo.Value.Date >= newStart));
        }

        // ---------------------------------------------------------
        // Sorting
        // ---------------------------------------------------------
        private static IQueryable<StudentTransportAssignment>
            ApplySorting(
                IQueryable<StudentTransportAssignment> query,
                string? sortBy,
                string? sortOrder)
        {
            var descending =
                string.Equals(
                    sortOrder,
                    "desc",
                    StringComparison.OrdinalIgnoreCase);

            return sortBy?.Trim().ToLowerInvariant() switch
            {
                "studentid" => descending
                    ? query.OrderByDescending(x => x.StudentId)
                    : query.OrderBy(x => x.StudentId),

                "routename" => descending
                    ? query.OrderByDescending(x =>
                        x.Route.RouteName)
                    : query.OrderBy(x =>
                        x.Route.RouteName),

                "pickuppointname" => descending
                    ? query.OrderByDescending(x =>
                        x.PickupPoint.PickupPointName)
                    : query.OrderBy(x =>
                        x.PickupPoint.PickupPointName),

                "vehiclenumber" => descending
                    ? query.OrderByDescending(x =>
                        x.VehicleAssignment
                            .Vehicle.VehicleNumber)
                    : query.OrderBy(x =>
                        x.VehicleAssignment
                            .Vehicle.VehicleNumber),

                "drivername" => descending
                    ? query.OrderByDescending(x =>
                        x.VehicleAssignment
                            .Driver.DriverName)
                    : query.OrderBy(x =>
                        x.VehicleAssignment
                            .Driver.DriverName),

                "effectivefrom" => descending
                    ? query.OrderByDescending(x =>
                        x.EffectiveFrom)
                    : query.OrderBy(x =>
                        x.EffectiveFrom),

                "effectiveto" => descending
                    ? query.OrderByDescending(x =>
                        x.EffectiveTo)
                    : query.OrderBy(x =>
                        x.EffectiveTo),

                "transporttype" => descending
                    ? query.OrderByDescending(x =>
                        x.TransportType)
                    : query.OrderBy(x =>
                        x.TransportType),

                "status" => descending
                    ? query.OrderByDescending(x =>
                        x.Status)
                    : query.OrderBy(x =>
                        x.Status),

                "createdat" => descending
                    ? query.OrderByDescending(x =>
                        x.CreatedAt)
                    : query.OrderBy(x =>
                        x.CreatedAt),

                _ => query.OrderByDescending(x =>
                    x.StudentTransportAssignmentId)
            };
        }
    }
}