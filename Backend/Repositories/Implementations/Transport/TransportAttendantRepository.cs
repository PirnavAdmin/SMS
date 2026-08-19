using Microsoft.EntityFrameworkCore;
using SMS.Api.Common;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.Attendant;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class TransportAttendantRepository : ITransportAttendantRepository
    {
        private readonly AppDbContext _context;

        public TransportAttendantRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<TransportAttendantDto>> GetAllAsync(TransportAttendantFilterDto filter)
        {
            var query = _context.TransportAttendants
                .AsNoTracking()
                .Include(x => x.AssignedVehicle)
                .Where(x => !x.IsDeleted);

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.Trim().ToLower();
                query = query.Where(x =>
                    (x.AttendantName != null && x.AttendantName.ToLower().Contains(search)) ||
                    (x.MobileNumber != null && x.MobileNumber.ToLower().Contains(search)) ||
                    (x.Address != null && x.Address.ToLower().Contains(search)));
            }

            if (filter.Status.HasValue)
            {
                query = query.Where(x => x.Status == filter.Status.Value);
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(x => new TransportAttendantDto
                {
                    AttendantId = x.AttendantId,
                    EmployeeId = x.EmployeeId,
                    AttendantName = x.AttendantName ?? string.Empty,
                    MobileNumber = x.MobileNumber ?? string.Empty,
                    Gender = x.Gender,
                    BranchName = x.BranchName,
                    AlternateMobileNumber = x.AlternateMobileNumber,
                    Address = x.Address,
                    BloodGroup = x.BloodGroup,
                    EmergencyContactName = x.EmergencyContactName,
                    EmergencyContactNumber = x.EmergencyContactNumber,
                    AssignedVehicleId = x.AssignedVehicleId,
                    Status = x.Status ? "Active" : "Inactive",
                    StatusText = x.Status ? "Active" : "Inactive",
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            return new PagedResult<TransportAttendantDto>
            {
                Items = items,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalCount = totalCount
            };
        }

        public async Task<TransportAttendantDto?> GetByIdAsync(long attendantId)
        {
            return await _context.TransportAttendants
                .AsNoTracking()
                .Include(x => x.AssignedVehicle)
                .Where(x => x.AttendantId == attendantId && !x.IsDeleted)
                .Select(x => new TransportAttendantDto
                {
                    AttendantId = x.AttendantId,
                    EmployeeId = x.EmployeeId,
                    AttendantName = x.AttendantName ?? string.Empty,
                    MobileNumber = x.MobileNumber ?? string.Empty,
                    Gender = x.Gender,
                    BranchName = x.BranchName,
                    AlternateMobileNumber = x.AlternateMobileNumber,
                    Address = x.Address,
                    BloodGroup = x.BloodGroup,
                    EmergencyContactName = x.EmergencyContactName,
                    EmergencyContactNumber = x.EmergencyContactNumber,
                    AssignedVehicleId = x.AssignedVehicleId,
                    Status = x.Status ? "Active" : "Inactive",
                    StatusText = x.Status ? "Active" : "Inactive",
                    CreatedAt = x.CreatedAt
                })
                .FirstOrDefaultAsync();
        }

        public async Task<long> CreateAsync(CreateTransportAttendantDto dto, long? userId)
        {
            var attendant = new TransportAttendant
            {
                EmployeeId = dto.EmployeeId?.Trim(),
                AttendantName = dto.AttendantName.Trim(),
                MobileNumber = dto.MobileNumber.Trim(),
                Gender = dto.Gender?.Trim(),
                BranchName = dto.BranchCampus?.Trim(),
                AlternateMobileNumber = dto.AlternateMobileNumber?.Trim(),
                Address = dto.Address?.Trim(),
                BloodGroup = dto.BloodGroup?.Trim(),
                EmergencyContactName = dto.EmergencyContactName?.Trim(),
                EmergencyContactNumber = dto.EmergencyContactNumber?.Trim(),
                AssignedVehicleId = dto.AssignedVehicleId > 0 ? dto.AssignedVehicleId : null,
                Status = dto.Status,
                IsDeleted = false,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.TransportAttendants.AddAsync(attendant);
            await _context.SaveChangesAsync();

            return attendant.AttendantId;
        }

        public async Task<bool> UpdateAsync(long attendantId, UpdateTransportAttendantDto dto, long? userId)
        {
            var attendant = await _context.TransportAttendants
                .FirstOrDefaultAsync(x => x.AttendantId == attendantId && !x.IsDeleted);

            if (attendant == null) return false;

            if (dto.EmployeeId != null) attendant.EmployeeId = dto.EmployeeId.Trim();
            if (!string.IsNullOrWhiteSpace(dto.AttendantName)) attendant.AttendantName = dto.AttendantName.Trim();
            if (!string.IsNullOrWhiteSpace(dto.MobileNumber)) attendant.MobileNumber = dto.MobileNumber.Trim();
            if (dto.Gender != null) attendant.Gender = dto.Gender.Trim();
            if (dto.BranchCampus != null) attendant.BranchName = dto.BranchCampus.Trim();
            if (dto.AlternateMobileNumber != null) attendant.AlternateMobileNumber = dto.AlternateMobileNumber.Trim();
            if (dto.Address != null) attendant.Address = dto.Address.Trim();
            if (dto.BloodGroup != null) attendant.BloodGroup = dto.BloodGroup.Trim();
            if (dto.EmergencyContactName != null) attendant.EmergencyContactName = dto.EmergencyContactName.Trim();
            if (dto.EmergencyContactNumber != null) attendant.EmergencyContactNumber = dto.EmergencyContactNumber.Trim();
            if (dto.AssignedVehicleId.HasValue) attendant.AssignedVehicleId = dto.AssignedVehicleId > 0 ? dto.AssignedVehicleId : null;
            attendant.Status = dto.Status;
            attendant.UpdatedBy = userId;
            attendant.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(long attendantId, long? userId)
        {
            var attendant = await _context.TransportAttendants
                .FirstOrDefaultAsync(x => x.AttendantId == attendantId && !x.IsDeleted);

            if (attendant == null) return false;

            attendant.IsDeleted = true;
            attendant.Status = false;
            attendant.UpdatedBy = userId;
            attendant.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<TransportAttendantLookupDto>> GetLookupAsync()
        {
            return await _context.TransportAttendants
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.Status)
                .OrderBy(x => x.AttendantName)
                .Select(x => new TransportAttendantLookupDto
                {
                    AttendantId = x.AttendantId,
                    AttendantName = x.AttendantName ?? string.Empty,
                    MobileNumber = x.MobileNumber ?? string.Empty,
                    DisplayName = $"{x.AttendantName} ({x.MobileNumber})"
                })
                .ToListAsync();
        }
    }
}
