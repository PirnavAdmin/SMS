using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.VehicleMaintenance;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class VehicleMaintenanceRepository : IVehicleMaintenanceRepository
    {
        private readonly AppDbContext _context;

        public VehicleMaintenanceRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task<(IEnumerable<VehicleMaintenanceDto> Items, int TotalCount)> GetAllAsync(VehicleMaintenanceFilterDto filter)
        {
            var query = _context.VehicleMaintenances
                .Include(x => x.Vehicle)
                .Where(x => !x.IsDeleted)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.Trim().ToLower();

                query = query.Where(x =>
                    x.ServiceType.ToLower().Contains(search) ||
                    (x.Vehicle.VehicleNumber != null &&
                     x.Vehicle.VehicleNumber.ToLower().Contains(search)) ||
                    (x.VendorCenter != null &&
                     x.VendorCenter.ToLower().Contains(search)));
            }

            if (filter.VehicleId.HasValue)
                query = query.Where(x => x.VehicleId == filter.VehicleId);

            if (filter.Status.HasValue)
                query = query.Where(x => x.Status == filter.Status);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.ServiceDate >= filter.FromDate);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.ServiceDate <= filter.ToDate);

            query = (filter.SortBy?.ToLower(), filter.SortOrder?.ToLower()) switch
            {
                ("vehiclenumber", "desc") => query.OrderByDescending(x => x.Vehicle.VehicleNumber),
                ("vehiclenumber", _) => query.OrderBy(x => x.Vehicle.VehicleNumber),

                ("cost", "desc") => query.OrderByDescending(x => x.Cost),
                ("cost", _) => query.OrderBy(x => x.Cost),

                ("servicetype", "desc") => query.OrderByDescending(x => x.ServiceType),
                ("servicetype", _) => query.OrderBy(x => x.ServiceType),

                ("servicedate", "asc") => query.OrderBy(x => x.ServiceDate),

                _ => query.OrderByDescending(x => x.ServiceDate)
            };

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(x => new VehicleMaintenanceDto
                {
                    MaintenanceId = x.MaintenanceId,
                    VehicleId = x.VehicleId,
                    VehicleNumber = x.Vehicle.VehicleNumber,
                    ServiceType = x.ServiceType,
                    ServiceDate = x.ServiceDate,
                    Cost = x.Cost,
                    VendorCenter = x.VendorCenter,
                    NextServiceDue = x.NextServiceDue,
                    Remarks = x.Remarks,
                    Status = x.Status
                })
                .ToListAsync();

            return (items, totalCount);
        }
        public async Task<VehicleMaintenanceDto?> GetByIdAsync(long maintenanceId)
        {
            return await _context.VehicleMaintenances
                .Include(x => x.Vehicle)
                .Where(x => !x.IsDeleted && x.MaintenanceId == maintenanceId)
                .Select(x => new VehicleMaintenanceDto
                {
                    MaintenanceId = x.MaintenanceId,
                    VehicleId = x.VehicleId,
                    VehicleNumber = x.Vehicle.VehicleNumber,
                    ServiceType = x.ServiceType,
                    ServiceDate = x.ServiceDate,
                    Cost = x.Cost,
                    VendorCenter = x.VendorCenter,
                    NextServiceDue = x.NextServiceDue,
                    Remarks = x.Remarks,
                    Status = x.Status
                })
                .FirstOrDefaultAsync();
        }
        public async Task<long> CreateAsync(CreateVehicleMaintenanceDto dto, long createdBy)
        {
            var entity = new VehicleMaintenance
            {
                VehicleId = dto.VehicleId,
                ServiceType = dto.ServiceType.Trim(),
                ServiceDate = dto.ServiceDate,
                Cost = dto.Cost,
                VendorCenter = dto.VendorCenter?.Trim(),
                NextServiceDue = dto.NextServiceDue,
                Remarks = dto.Remarks?.Trim(),
                Status = true,
                IsDeleted = false,
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow
            };

            _context.VehicleMaintenances.Add(entity);

            await _context.SaveChangesAsync();

            return entity.MaintenanceId;
        }
        public async Task<bool> UpdateAsync(long maintenanceId, UpdateVehicleMaintenanceDto dto, long updatedBy)
        {
            var entity = await _context.VehicleMaintenances
                .FirstOrDefaultAsync(x => x.MaintenanceId == maintenanceId && !x.IsDeleted);

            if (entity == null)
                return false;

            entity.VehicleId = dto.VehicleId;
            entity.ServiceType = dto.ServiceType.Trim();
            entity.ServiceDate = dto.ServiceDate;
            entity.Cost = dto.Cost;
            entity.VendorCenter = dto.VendorCenter?.Trim();
            entity.NextServiceDue = dto.NextServiceDue;
            entity.Remarks = dto.Remarks?.Trim();
            entity.Status = dto.Status;
            entity.UpdatedBy = updatedBy;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }
        public async Task<bool> DeleteAsync(long maintenanceId, long updatedBy)
        {
            var entity = await _context.VehicleMaintenances
                .FirstOrDefaultAsync(x => x.MaintenanceId == maintenanceId && !x.IsDeleted);

            if (entity == null)
                return false;

            entity.IsDeleted = true;
            entity.UpdatedBy = updatedBy;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }
        public async Task<IEnumerable<VehicleMaintenanceLookupDto>> GetLookupAsync()
        {
            return await _context.VehicleMaintenances
                .Where(x => !x.IsDeleted)
                .OrderByDescending(x => x.ServiceDate)
                .Select(x => new VehicleMaintenanceLookupDto
                {
                    MaintenanceId = x.MaintenanceId,
                    DisplayName = x.Vehicle.VehicleNumber + " - " + x.ServiceType
                })
                .ToListAsync();
        }
    }
}