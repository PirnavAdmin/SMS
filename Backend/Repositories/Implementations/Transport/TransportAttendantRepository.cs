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
                    (x.EmployeeId != null && x.EmployeeId.ToLower().Contains(search)) ||
                    (x.MobileNumber != null && x.MobileNumber.ToLower().Contains(search)) ||
                    (x.Address != null && x.Address.ToLower().Contains(search)));
            }

            if (filter.Status.HasValue)
            {
                query = query.Where(x => x.Status == filter.Status.Value);
            }

            var allItems = await query
                .OrderByDescending(x => x.CreatedAt)
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

            // Deduplicate items by EmployeeId (if provided) or by AttendantName + MobileNumber
            var seenKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var distinctItems = new List<TransportAttendantDto>();

            foreach (var item in allItems)
            {
                string key;
                if (!string.IsNullOrWhiteSpace(item.EmployeeId))
                {
                    key = $"EMP:{item.EmployeeId.Trim()}";
                }
                else
                {
                    key = $"NAME:{item.AttendantName.Trim()}|PHONE:{item.MobileNumber.Trim()}";
                }

                if (seenKeys.Add(key))
                {
                    distinctItems.Add(item);
                }
            }

            var totalCount = distinctItems.Count;
            var items = distinctItems
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToList();

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
            var empId = dto.EmployeeId?.Trim();
            if (empId != null && empId.Length > 100) empId = empId.Substring(0, 100);

            var attName = dto.AttendantName?.Trim();
            if (attName != null && attName.Length > 255) attName = attName.Substring(0, 255);

            var phone = dto.MobileNumber?.Trim();
            if (phone != null && phone.Length > 100) phone = phone.Substring(0, 100);

            var altPhone = dto.AlternateMobileNumber?.Trim();
            if (altPhone != null && altPhone.Length > 100) altPhone = altPhone.Substring(0, 100);

            var gender = dto.Gender?.Trim();
            if (gender != null && gender.Length > 50) gender = gender.Substring(0, 50);

            var branch = dto.BranchCampus?.Trim();
            if (branch != null && branch.Length > 255) branch = branch.Substring(0, 255);

            var bloodGroup = dto.BloodGroup?.Trim();
            if (bloodGroup != null && bloodGroup.Length > 20) bloodGroup = bloodGroup.Substring(0, 20);

            var emContactName = dto.EmergencyContactName?.Trim();
            if (emContactName != null && emContactName.Length > 255) emContactName = emContactName.Substring(0, 255);

            var emContactNumber = dto.EmergencyContactNumber?.Trim();
            if (emContactNumber != null && emContactNumber.Length > 100) emContactNumber = emContactNumber.Substring(0, 100);

            var address = dto.Address?.Trim();

            var existing = await _context.TransportAttendants
                .FirstOrDefaultAsync(x => !x.IsDeleted && (
                    (!string.IsNullOrEmpty(empId) && x.EmployeeId == empId) ||
                    (!string.IsNullOrEmpty(attName) && !string.IsNullOrEmpty(phone) && x.AttendantName == attName && x.MobileNumber == phone)
                ));

            if (existing != null)
            {
                if (!string.IsNullOrWhiteSpace(empId)) existing.EmployeeId = empId;
                if (!string.IsNullOrWhiteSpace(attName)) existing.AttendantName = attName;
                if (!string.IsNullOrWhiteSpace(phone)) existing.MobileNumber = phone;
                if (!string.IsNullOrWhiteSpace(gender)) existing.Gender = gender;
                if (!string.IsNullOrWhiteSpace(branch)) existing.BranchName = branch;
                if (altPhone != null) existing.AlternateMobileNumber = altPhone;
                if (address != null) existing.Address = address;
                if (bloodGroup != null) existing.BloodGroup = bloodGroup;
                if (emContactName != null) existing.EmergencyContactName = emContactName;
                if (emContactNumber != null) existing.EmergencyContactNumber = emContactNumber;
                if (dto.AssignedVehicleId.HasValue) existing.AssignedVehicleId = dto.AssignedVehicleId > 0 ? dto.AssignedVehicleId : null;
                existing.Status = dto.Status;
                existing.UpdatedBy = userId;
                existing.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return existing.AttendantId;
            }

            var attendant = new TransportAttendant
            {
                EmployeeId = empId,
                AttendantName = attName ?? string.Empty,
                MobileNumber = phone ?? string.Empty,
                Gender = gender,
                BranchName = branch,
                AlternateMobileNumber = altPhone,
                Address = address,
                BloodGroup = bloodGroup,
                EmergencyContactName = emContactName,
                EmergencyContactNumber = emContactNumber,
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

            if (dto.EmployeeId != null)
            {
                var empId = dto.EmployeeId.Trim();
                attendant.EmployeeId = empId.Length > 100 ? empId.Substring(0, 100) : empId;
            }
            if (!string.IsNullOrWhiteSpace(dto.AttendantName))
            {
                var attName = dto.AttendantName.Trim();
                attendant.AttendantName = attName.Length > 255 ? attName.Substring(0, 255) : attName;
            }
            if (!string.IsNullOrWhiteSpace(dto.MobileNumber))
            {
                var phone = dto.MobileNumber.Trim();
                attendant.MobileNumber = phone.Length > 100 ? phone.Substring(0, 100) : phone;
            }
            if (dto.Gender != null)
            {
                var gender = dto.Gender.Trim();
                attendant.Gender = gender.Length > 50 ? gender.Substring(0, 50) : gender;
            }
            if (dto.BranchCampus != null)
            {
                var branch = dto.BranchCampus.Trim();
                attendant.BranchName = branch.Length > 255 ? branch.Substring(0, 255) : branch;
            }
            if (dto.AlternateMobileNumber != null)
            {
                var alt = dto.AlternateMobileNumber.Trim();
                attendant.AlternateMobileNumber = alt.Length > 100 ? alt.Substring(0, 100) : alt;
            }
            if (dto.Address != null) attendant.Address = dto.Address.Trim();
            if (dto.BloodGroup != null)
            {
                var bg = dto.BloodGroup.Trim();
                attendant.BloodGroup = bg.Length > 20 ? bg.Substring(0, 20) : bg;
            }
            if (dto.EmergencyContactName != null)
            {
                var eName = dto.EmergencyContactName.Trim();
                attendant.EmergencyContactName = eName.Length > 255 ? eName.Substring(0, 255) : eName;
            }
            if (dto.EmergencyContactNumber != null)
            {
                var eNum = dto.EmergencyContactNumber.Trim();
                attendant.EmergencyContactNumber = eNum.Length > 100 ? eNum.Substring(0, 100) : eNum;
            }
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

        public async Task<TransportAttendantDto?> GetByIdOrNameAsync(string attendantIdOrName)
        {
            if (string.IsNullOrWhiteSpace(attendantIdOrName)) return null;

            string search = attendantIdOrName.Trim();

            if (long.TryParse(search, out long attendantId))
            {
                var byId = await GetByIdAsync(attendantId);
                if (byId != null) return byId;
            }

            var attendant = await _context.TransportAttendants
                .AsNoTracking()
                .FirstOrDefaultAsync(x => !x.IsDeleted && (
                    (x.AttendantName != null && x.AttendantName.ToLower() == search.ToLower()) ||
                    (x.MobileNumber != null && x.MobileNumber.ToLower() == search.ToLower()) ||
                    x.AttendantId.ToString() == search));

            if (attendant == null) return null;

            return await GetByIdAsync(attendant.AttendantId);
        }
    }
}
