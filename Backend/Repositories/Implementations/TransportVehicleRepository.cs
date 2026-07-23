using Microsoft.EntityFrameworkCore;
using SMS.Api.Common;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.Vehicle;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class TransportVehicleRepository : ITransportVehicleRepository
    {
        private readonly AppDbContext _context;

        public TransportVehicleRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task<PagedResult<TransportVehicleDto>> GetAllAsync(TransportVehicleFilterDto filter)
        {
            var query = _context.TransportVehicles
                .Where(x => !x.IsDeleted)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                string search = filter.Search.Trim().ToLower();

                query = query.Where(x =>
                    x.VehicleNumber.ToLower().Contains(search) ||
                    x.VehicleName.ToLower().Contains(search) ||
                    x.RegistrationNumber.ToLower().Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(filter.VehicleType))
            {
                query = query.Where(x => x.VehicleType == filter.VehicleType);
            }

            if (filter.Status.HasValue)
            {
                query = query.Where(x => x.Status == filter.Status.Value);
            }

            int totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(x => x.VehicleName)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(x => new TransportVehicleDto
                {
                    VehicleId = x.VehicleId,
                    VehicleNumber = x.VehicleNumber,
                    RegistrationNumber = x.RegistrationNumber,
                    VehicleName = x.VehicleName,
                    VehicleType = x.VehicleType,
                    Capacity = x.Capacity,
                    Manufacturer = x.Manufacturer,
                    Model = x.Model,
                    InsuranceNumber = x.InsuranceNumber,
                    InsuranceExpiry = x.InsuranceExpiry,
                    PollutionExpiry = x.PollutionExpiry,
                    FitnessExpiry = x.FitnessExpiry,
                    Status = x.Status,
                    StatusText = x.Status ? "Active" : "Inactive",
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            return new PagedResult<TransportVehicleDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }
        public async Task<TransportVehicleDto?> GetByIdAsync(long vehicleId)
        {
            return await _context.TransportVehicles
                .Where(x => x.VehicleId == vehicleId && !x.IsDeleted)
                .Select(x => new TransportVehicleDto
                {
                    VehicleId = x.VehicleId,
                    VehicleNumber = x.VehicleNumber,
                    RegistrationNumber = x.RegistrationNumber,
                    VehicleName = x.VehicleName,
                    VehicleType = x.VehicleType,
                    Capacity = x.Capacity,
                    Manufacturer = x.Manufacturer,
                    Model = x.Model,
                    InsuranceNumber = x.InsuranceNumber,
                    InsuranceExpiry = x.InsuranceExpiry,
                    PollutionExpiry = x.PollutionExpiry,
                    FitnessExpiry = x.FitnessExpiry,
                    Status = x.Status,
                    StatusText = x.Status ? "Active" : "Inactive",
                    CreatedAt = x.CreatedAt
                })
                .FirstOrDefaultAsync();
        }
        public async Task<long> CreateAsync(CreateTransportVehicleDto dto, long? userId)
        {
            var entity = new TransportVehicle
            {
                VehicleNumber = dto.VehicleNumber.Trim(),
                RegistrationNumber = dto.RegistrationNumber.Trim(),
                VehicleName = dto.VehicleName.Trim(),
                VehicleType = dto.VehicleType.Trim(),
                Capacity = dto.Capacity,
                Manufacturer = dto.Manufacturer,
                Model = dto.Model,
                InsuranceNumber = dto.InsuranceNumber,
                InsuranceExpiry = dto.InsuranceExpiry,
                PollutionExpiry = dto.PollutionExpiry,
                FitnessExpiry = dto.FitnessExpiry,
                Status = dto.Status,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.TransportVehicles.Add(entity);

            await _context.SaveChangesAsync();

            return entity.VehicleId;
        }
        public async Task<bool> UpdateAsync(
    long vehicleId,
    UpdateTransportVehicleDto dto,
    long? userId)
        {
            var entity = await _context.TransportVehicles
                .FirstOrDefaultAsync(x =>
                    x.VehicleId == vehicleId &&
                    !x.IsDeleted);

            if (entity == null)
                return false;

            entity.VehicleNumber = dto.VehicleNumber.Trim();
            entity.RegistrationNumber = dto.RegistrationNumber.Trim();
            entity.VehicleName = dto.VehicleName.Trim();
            entity.VehicleType = dto.VehicleType.Trim();
            entity.Capacity = dto.Capacity;
            entity.Manufacturer = dto.Manufacturer;
            entity.Model = dto.Model;
            entity.InsuranceNumber = dto.InsuranceNumber;
            entity.InsuranceExpiry = dto.InsuranceExpiry;
            entity.PollutionExpiry = dto.PollutionExpiry;
            entity.FitnessExpiry = dto.FitnessExpiry;
            entity.Status = dto.Status;
            entity.UpdatedBy = userId;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }
        public async Task<bool> DeleteAsync(
    long vehicleId,
    long? userId)
        {
            var entity = await _context.TransportVehicles
                .FirstOrDefaultAsync(x =>
                    x.VehicleId == vehicleId &&
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
        public async Task<bool> ExistsAsync(
    string vehicleNumber,
    string registrationNumber,
    long? excludeVehicleId = null)
        {
            vehicleNumber = vehicleNumber.Trim().ToLower();
            registrationNumber = registrationNumber.Trim().ToLower();

            return await _context.TransportVehicles
                .AsNoTracking()
                .AnyAsync(x =>
                    !x.IsDeleted &&
                    (
                        x.VehicleNumber.ToLower() == vehicleNumber ||
                        x.RegistrationNumber.ToLower() == registrationNumber
                    ) &&
                    (!excludeVehicleId.HasValue ||
                     x.VehicleId != excludeVehicleId.Value));
        }
        public async Task<IEnumerable<TransportVehicleLookupDto>> GetLookupAsync()
        {
            return await _context.TransportVehicles
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.Status)
                .OrderBy(x => x.VehicleNumber)
                .Select(x => new TransportVehicleLookupDto
                {
                    VehicleId = x.VehicleId,
                    VehicleNumber = x.VehicleNumber,
                    VehicleName = x.VehicleName,
                    RegistrationNumber = x.RegistrationNumber
                })
                .ToListAsync();
        }
    }
}