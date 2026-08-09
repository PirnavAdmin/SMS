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
                .Include(x => x.Attendant)
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
                    (x.Route != null && x.Route.RouteName != null && x.Route.RouteName.ToLower().Contains(search)) ||
                    (x.Vehicle != null && x.Vehicle.VehicleNumber != null && x.Vehicle.VehicleNumber.ToLower().Contains(search)) ||
                    (x.Driver != null && x.Driver.DriverName != null && x.Driver.DriverName.ToLower().Contains(search)) ||
                    (x.Attendant != null && x.Attendant.AttendantName != null && x.Attendant.AttendantName.ToLower().Contains(search)));
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
                    RouteName = x.Route != null ? x.Route.RouteName : string.Empty,

                    VehicleId = x.VehicleId,
                    VehicleNumber = x.Vehicle != null && x.Vehicle.VehicleNumber != null ? x.Vehicle.VehicleNumber : string.Empty,
                    VehicleName = x.Vehicle != null && x.Vehicle.VehicleName != null ? x.Vehicle.VehicleName : string.Empty,
                    VehicleCapacity = x.Vehicle != null && x.Vehicle.Capacity > 0 ? x.Vehicle.Capacity : 50,

                    DriverId = x.DriverId,
                    DriverName = x.Driver != null ? x.Driver.DriverName : string.Empty,
                    DriverMobile = x.Driver != null ? x.Driver.MobileNumber : string.Empty,

                    AttendantId = x.AttendantId,
                    AttendantName = x.Attendant != null ? x.Attendant.AttendantName : null,

                    BranchName = x.BranchName ?? "Main Campus",
                    AcademicYear = x.AcademicYear ?? "2026-2027",
                    MorningTripTime = x.MorningTripTime ?? "07:00 AM",
                    EveningTripTime = x.EveningTripTime ?? "03:45 PM",

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
                .Include(x => x.Attendant)
                .Where(x => x.AssignmentId == assignmentId && !x.IsDeleted)
                .Select(x => new TransportVehicleAssignmentDto
                {
                    AssignmentId = x.AssignmentId,

                    RouteId = x.RouteId,
                    RouteName = x.Route != null ? x.Route.RouteName : string.Empty,

                    VehicleId = x.VehicleId,
                    VehicleNumber = x.Vehicle != null && x.Vehicle.VehicleNumber != null ? x.Vehicle.VehicleNumber : string.Empty,
                    VehicleName = x.Vehicle != null && x.Vehicle.VehicleName != null ? x.Vehicle.VehicleName : string.Empty,
                    VehicleCapacity = x.Vehicle != null && x.Vehicle.Capacity > 0 ? x.Vehicle.Capacity : 50,

                    DriverId = x.DriverId,
                    DriverName = x.Driver != null ? x.Driver.DriverName : string.Empty,
                    DriverMobile = x.Driver != null ? x.Driver.MobileNumber : string.Empty,

                    AttendantId = x.AttendantId,
                    AttendantName = x.Attendant != null ? x.Attendant.AttendantName : null,

                    BranchName = x.BranchName ?? "Main Campus",
                    AcademicYear = x.AcademicYear ?? "2026-2027",
                    MorningTripTime = x.MorningTripTime ?? "07:00 AM",
                    EveningTripTime = x.EveningTripTime ?? "03:45 PM",

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
                RouteId = dto.RouteId > 0 ? dto.RouteId : 1,
                VehicleId = dto.VehicleId > 0 ? dto.VehicleId : 1,
                DriverId = dto.DriverId > 0 ? dto.DriverId : 1,
                AttendantId = dto.AttendantId > 0 ? dto.AttendantId : null,
                BranchName = dto.BranchName?.Trim(),
                AcademicYear = dto.AcademicYear?.Trim(),
                MorningTripTime = dto.MorningTripTime?.Trim(),
                EveningTripTime = dto.EveningTripTime?.Trim(),
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

            if (dto.RouteId > 0) entity.RouteId = dto.RouteId;
            if (dto.VehicleId > 0) entity.VehicleId = dto.VehicleId;
            if (dto.DriverId > 0) entity.DriverId = dto.DriverId;
            if (dto.AttendantId.HasValue) entity.AttendantId = dto.AttendantId > 0 ? dto.AttendantId : null;
            if (dto.BranchName != null) entity.BranchName = dto.BranchName.Trim();
            if (dto.AcademicYear != null) entity.AcademicYear = dto.AcademicYear.Trim();
            if (dto.MorningTripTime != null) entity.MorningTripTime = dto.MorningTripTime.Trim();
            if (dto.EveningTripTime != null) entity.EveningTripTime = dto.EveningTripTime.Trim();
            entity.AssignmentDate = dto.AssignmentDate;
            entity.EffectiveFrom = dto.EffectiveFrom;
            entity.EffectiveTo = dto.EffectiveTo;
            entity.Shift = dto.Shift;
            entity.Remarks = dto.Remarks;
            entity.Status = dto.Status;
            entity.UpdatedBy = userId;
            entity.UpdatedAt = DateTime.UtcNow;
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
                    RouteName = x.Route != null ? x.Route.RouteName : string.Empty,
                    VehicleNumber = x.Vehicle != null && x.Vehicle.VehicleNumber != null ? x.Vehicle.VehicleNumber : string.Empty,
                    DriverName = x.Driver != null ? x.Driver.DriverName : string.Empty
                })
                .ToListAsync();
        }
    }
}