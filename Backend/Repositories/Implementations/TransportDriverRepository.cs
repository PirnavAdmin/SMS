using Microsoft.EntityFrameworkCore;
using SMS.Api.Common;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.Driver;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class TransportDriverRepository : ITransportDriverRepository
    {
        private readonly AppDbContext _context;

        public TransportDriverRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<TransportDriverDto>> GetAllAsync(
            TransportDriverFilterDto filter)
        {
            var query = _context.TransportDrivers
                .AsNoTracking()
                .Where(x => !x.IsDeleted);

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.Trim().ToLower();

                query = query.Where(x =>
                    x.DriverName.ToLower().Contains(search) ||
                    x.MobileNumber.ToLower().Contains(search) ||
                    x.LicenceNumber.ToLower().Contains(search));
            }

            if (filter.Status.HasValue)
            {
                query = query.Where(x => x.Status == filter.Status.Value);
            }

            if (filter.LicenceExpired.HasValue)
            {
                var today = DateTime.UtcNow.Date;

                if (filter.LicenceExpired.Value)
                {
                    query = query.Where(x =>
                        x.LicenceExpiry.HasValue &&
                        x.LicenceExpiry.Value.Date < today);
                }
                else
                {
                    query = query.Where(x =>
                        !x.LicenceExpiry.HasValue ||
                        x.LicenceExpiry.Value.Date >= today);
                }
            }

            query = ApplySorting(query, filter.SortBy, filter.SortOrder);

            var totalCount = await query.CountAsync();

            var pageNumber = filter.PageNumber < 1
                ? 1
                : filter.PageNumber;

            var pageSize = filter.PageSize < 1
                ? 10
                : filter.PageSize;

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new TransportDriverDto
                {
                    DriverId = x.DriverId,
                    DriverName = x.DriverName,
                    MobileNumber = x.MobileNumber,
                    AlternateMobileNumber = x.AlternateMobileNumber,
                    LicenceNumber = x.LicenceNumber,
                    LicenceExpiry = x.LicenceExpiry,
                    Address = x.Address,
                    BloodGroup = x.BloodGroup,
                    EmergencyContactName = x.EmergencyContactName,
                    EmergencyContactNumber = x.EmergencyContactNumber,
                    Status = x.Status,
                    StatusText = x.Status ? "Active" : "Inactive",
                    IsLicenceExpired =
                        x.LicenceExpiry.HasValue &&
                        x.LicenceExpiry.Value.Date < DateTime.UtcNow.Date,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            return new PagedResult<TransportDriverDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<TransportDriverDto?> GetByIdAsync(long driverId)
        {
            return await _context.TransportDrivers
                .AsNoTracking()
                .Where(x =>
                    x.DriverId == driverId &&
                    !x.IsDeleted)
                .Select(x => new TransportDriverDto
                {
                    DriverId = x.DriverId,
                    DriverName = x.DriverName,
                    MobileNumber = x.MobileNumber,
                    AlternateMobileNumber = x.AlternateMobileNumber,
                    LicenceNumber = x.LicenceNumber,
                    LicenceExpiry = x.LicenceExpiry,
                    Address = x.Address,
                    BloodGroup = x.BloodGroup,
                    EmergencyContactName = x.EmergencyContactName,
                    EmergencyContactNumber = x.EmergencyContactNumber,
                    Status = x.Status,
                    StatusText = x.Status ? "Active" : "Inactive",
                    IsLicenceExpired =
                        x.LicenceExpiry.HasValue &&
                        x.LicenceExpiry.Value.Date < DateTime.UtcNow.Date,
                    CreatedAt = x.CreatedAt
                })
                .FirstOrDefaultAsync();
        }

        public async Task<long> CreateAsync(
            CreateTransportDriverDto dto,
            long? userId)
        {
            var entity = new TransportDriver
            {
                DriverName = dto.DriverName.Trim(),
                MobileNumber = dto.MobileNumber.Trim(),
                AlternateMobileNumber =
                    string.IsNullOrWhiteSpace(dto.AlternateMobileNumber)
                        ? null
                        : dto.AlternateMobileNumber.Trim(),
                LicenceNumber = dto.LicenceNumber.Trim(),
                LicenceExpiry = dto.LicenceExpiry,
                Address = dto.Address?.Trim(),
                BloodGroup = dto.BloodGroup?.Trim(),
                EmergencyContactName =
                    dto.EmergencyContactName?.Trim(),
                EmergencyContactNumber =
                    dto.EmergencyContactNumber?.Trim(),
                Status = dto.Status,
                IsDeleted = false,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.TransportDrivers.Add(entity);
            await _context.SaveChangesAsync();

            return entity.DriverId;
        }

        public async Task<bool> UpdateAsync(
            long driverId,
            UpdateTransportDriverDto dto,
            long? userId)
        {
            var entity = await _context.TransportDrivers
                .FirstOrDefaultAsync(x =>
                    x.DriverId == driverId &&
                    !x.IsDeleted);

            if (entity == null)
                return false;

            entity.DriverName = dto.DriverName.Trim();
            entity.MobileNumber = dto.MobileNumber.Trim();
            entity.AlternateMobileNumber =
                string.IsNullOrWhiteSpace(dto.AlternateMobileNumber)
                    ? null
                    : dto.AlternateMobileNumber.Trim();
            entity.LicenceNumber = dto.LicenceNumber.Trim();
            entity.LicenceExpiry = dto.LicenceExpiry;
            entity.Address = dto.Address?.Trim();
            entity.BloodGroup = dto.BloodGroup?.Trim();
            entity.EmergencyContactName =
                dto.EmergencyContactName?.Trim();
            entity.EmergencyContactNumber =
                dto.EmergencyContactNumber?.Trim();
            entity.Status = dto.Status;
            entity.UpdatedBy = userId;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAsync(
            long driverId,
            long? userId)
        {
            var entity = await _context.TransportDrivers
                .FirstOrDefaultAsync(x =>
                    x.DriverId == driverId &&
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
            string licenceNumber,
            string mobileNumber,
            long? excludeDriverId = null)
        {
            licenceNumber = licenceNumber.Trim().ToLower();
            mobileNumber = mobileNumber.Trim().ToLower();

            return await _context.TransportDrivers
                .AsNoTracking()
                .AnyAsync(x =>
                    !x.IsDeleted &&
                    (
                        x.LicenceNumber.ToLower() == licenceNumber ||
                        x.MobileNumber.ToLower() == mobileNumber
                    ) &&
                    (!excludeDriverId.HasValue ||
                     x.DriverId != excludeDriverId.Value));
        }

        public async Task<IEnumerable<TransportDriverLookupDto>>
            GetLookupAsync()
        {
            return await _context.TransportDrivers
                .AsNoTracking()
                .Where(x =>
                    !x.IsDeleted &&
                    x.Status)
                .OrderBy(x => x.DriverName)
                .Select(x => new TransportDriverLookupDto
                {
                    DriverId = x.DriverId,
                    DriverName = x.DriverName,
                    MobileNumber = x.MobileNumber,
                    LicenceNumber = x.LicenceNumber
                })
                .ToListAsync();
        }

        private static IQueryable<TransportDriver> ApplySorting(
            IQueryable<TransportDriver> query,
            string? sortBy,
            string? sortOrder)
        {
            var descending = string.Equals(
                sortOrder,
                "desc",
                StringComparison.OrdinalIgnoreCase);

            return sortBy?.Trim().ToLower() switch
            {
                "mobilenumber" => descending
                    ? query.OrderByDescending(x => x.MobileNumber)
                    : query.OrderBy(x => x.MobileNumber),

                "licencenumber" => descending
                    ? query.OrderByDescending(x => x.LicenceNumber)
                    : query.OrderBy(x => x.LicenceNumber),

                "licenceexpiry" => descending
                    ? query.OrderByDescending(x => x.LicenceExpiry)
                    : query.OrderBy(x => x.LicenceExpiry),

                "createdat" => descending
                    ? query.OrderByDescending(x => x.CreatedAt)
                    : query.OrderBy(x => x.CreatedAt),

                _ => descending
                    ? query.OrderByDescending(x => x.DriverName)
                    : query.OrderBy(x => x.DriverName)
            };
        }
    }
}