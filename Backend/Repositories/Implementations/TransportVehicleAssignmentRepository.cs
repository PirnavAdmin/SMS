using Microsoft.EntityFrameworkCore;
using SMS.Api.Common;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.VehicleAssignment;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class TransportVehicleAssignmentRepository
        : ITransportVehicleAssignmentRepository
    {
        private readonly AppDbContext _context;

        public TransportVehicleAssignmentRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task<PagedResult<TransportVehicleAssignmentDto>> GetAllAsync(
    TransportVehicleAssignmentFilterDto filter)
        {
            var query = _context.TransportVehicleAssignments
                .Include(x => x.Route)
                .Include(x => x.Vehicle)
                .Include(x => x.Driver)
                .Where(x => !x.IsDeleted);

            if (filter.RouteId.HasValue)
                query = query.Where(x => x.RouteId == filter.RouteId);

            if (filter.VehicleId.HasValue)
                query = query.Where(x => x.VehicleId == filter.VehicleId);

            if (filter.DriverId.HasValue)
                query = query.Where(x => x.DriverId == filter.DriverId);

            if (filter.Status.HasValue)
                query = query.Where(x => x.Status == filter.Status);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.AssignmentDate >= filter.FromDate);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.AssignmentDate <= filter.ToDate);

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.Trim().ToLower();

                query = query.Where(x =>
                    x.Route.RouteName.ToLower().Contains(search) ||
                    x.Vehicle.VehicleNumber.ToLower().Contains(search) ||
                    x.Driver.DriverName.ToLower().Contains(search));
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.EffectiveFrom)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(x => new TransportVehicleAssignmentDto
                {
                    AssignmentId = x.AssignmentId,

                    RouteId = x.RouteId,
                    RouteName = x.Route.RouteName,

                    VehicleId = x.VehicleId,
                    VehicleNumber = x.Vehicle.VehicleNumber,
                    VehicleName = x.Vehicle.VehicleName,

                    DriverId = x.DriverId,
                    DriverName = x.Driver.DriverName,
                    DriverMobile = x.Driver.MobileNumber,

                    AssignmentDate = x.AssignmentDate,
                    EffectiveFrom = x.EffectiveFrom,
                    EffectiveTo = x.EffectiveTo,

                    Shift = x.Shift,
                    Remarks = x.Remarks,

                    Status = x.Status,
                    StatusText = x.Status ? "Active" : "Inactive",

                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            return new PagedResult<TransportVehicleAssignmentDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }
        public async Task<TransportVehicleAssignmentDto?> GetByIdAsync(long assignmentId)
        {
            return await _context.TransportVehicleAssignments
                .Include(x => x.Route)
                .Include(x => x.Vehicle)
                .Include(x => x.Driver)
                .Where(x => x.AssignmentId == assignmentId && !x.IsDeleted)
                .Select(x => new TransportVehicleAssignmentDto
                {
                    AssignmentId = x.AssignmentId,

                    RouteId = x.RouteId,
                    RouteName = x.Route.RouteName,

                    VehicleId = x.VehicleId,
                    VehicleNumber = x.Vehicle.VehicleNumber,
                    VehicleName = x.Vehicle.VehicleName,

                    DriverId = x.DriverId,
                    DriverName = x.Driver.DriverName,
                    DriverMobile = x.Driver.MobileNumber,

                    AssignmentDate = x.AssignmentDate,
                    EffectiveFrom = x.EffectiveFrom,
                    EffectiveTo = x.EffectiveTo,

                    Shift = x.Shift,
                    Remarks = x.Remarks,

                    Status = x.Status,
                    StatusText = x.Status ? "Active" : "Inactive",

                    CreatedAt = x.CreatedAt
                })
                .FirstOrDefaultAsync();
        }
        public async Task<long> CreateAsync(
    CreateTransportVehicleAssignmentDto dto,
    long? userId)
        {
            var entity = new TransportVehicleAssignment
            {
                RouteId = dto.RouteId,
                VehicleId = dto.VehicleId,
                DriverId = dto.DriverId,
                AssignmentDate = dto.AssignmentDate,
                EffectiveFrom = dto.EffectiveFrom,
                EffectiveTo = dto.EffectiveTo,
                Shift = dto.Shift,
                Remarks = dto.Remarks,
                Status = dto.Status,
                IsDeleted = false,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.TransportVehicleAssignments.Add(entity);

            await _context.SaveChangesAsync();

            return entity.AssignmentId;
        }
        public async Task<bool> UpdateAsync(
    long assignmentId,
    UpdateTransportVehicleAssignmentDto dto,
    long? userId)
        {
            var entity = await _context.TransportVehicleAssignments
                .FirstOrDefaultAsync(x =>
                    x.AssignmentId == assignmentId &&
                    !x.IsDeleted);

            if (entity == null)
                return false;

            entity.RouteId = dto.RouteId;
            entity.VehicleId = dto.VehicleId;
            entity.DriverId = dto.DriverId;
            entity.AssignmentDate = dto.AssignmentDate;
            entity.EffectiveFrom = dto.EffectiveFrom;
            entity.EffectiveTo = dto.EffectiveTo;
            entity.Shift = dto.Shift;
            entity.Remarks = dto.Remarks;
            entity.Status = dto.Status;
            entity.UpdatedBy = userId;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }
        public async Task<bool> DeleteAsync(
    long assignmentId,
    long? userId)
        {
            var entity = await _context.TransportVehicleAssignments
                .FirstOrDefaultAsync(x =>
                    x.AssignmentId == assignmentId &&
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
        public async Task<bool> IsVehicleAssignedAsync(
    long vehicleId,
    DateTime effectiveFrom,
    DateTime? effectiveTo,
    long? excludeAssignmentId = null)
        {
            return await _context.TransportVehicleAssignments
                .AnyAsync(x =>
                    !x.IsDeleted &&
                    x.VehicleId == vehicleId &&
                    (!excludeAssignmentId.HasValue ||
                     x.AssignmentId != excludeAssignmentId.Value) &&
                    (
                        effectiveTo == null ||
                        x.EffectiveTo == null ||
                        effectiveFrom <= x.EffectiveTo &&
                        effectiveTo >= x.EffectiveFrom
                    ));
        }
        public async Task<bool> IsDriverAssignedAsync(
    long driverId,
    DateTime effectiveFrom,
    DateTime? effectiveTo,
    long? excludeAssignmentId = null)
        {
            return await _context.TransportVehicleAssignments
                .AnyAsync(x =>
                    !x.IsDeleted &&
                    x.DriverId == driverId &&
                    (!excludeAssignmentId.HasValue ||
                     x.AssignmentId != excludeAssignmentId.Value) &&
                    (
                        effectiveTo == null ||
                        x.EffectiveTo == null ||
                        effectiveFrom <= x.EffectiveTo &&
                        effectiveTo >= x.EffectiveFrom
                    ));
        }
        public async Task<IEnumerable<TransportVehicleAssignmentLookupDto>> GetLookupAsync()
        {
            return await _context.TransportVehicleAssignments
                .Include(x => x.Route)
                .Include(x => x.Vehicle)
                .Include(x => x.Driver)
                .Where(x => !x.IsDeleted && x.Status)
                .OrderBy(x => x.Route.RouteName)
                .Select(x => new TransportVehicleAssignmentLookupDto
                {
                    AssignmentId = x.AssignmentId,
                    RouteName = x.Route.RouteName,
                    VehicleNumber = x.Vehicle.VehicleNumber,
                    DriverName = x.Driver.DriverName
                })
                .ToListAsync();
        }
    }
}