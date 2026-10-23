namespace SMS.Api.Services.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class HostelService : IHostelService
{
    private readonly IHostelRepository _hostelRepo;
    private readonly ISchoolRepository _schoolRepo;
    private readonly AppDbContext _context;

    public HostelService(IHostelRepository hostelRepo, ISchoolRepository schoolRepo, AppDbContext context)
    {
        _hostelRepo = hostelRepo;
        _schoolRepo = schoolRepo;
        _context = context;
    }

    public HostelService(IHostelRepository hostelRepo, ISchoolRepository schoolRepo)
    {
        _hostelRepo = hostelRepo;
        _schoolRepo = schoolRepo;
        _context = null!;
    }

    // --- DASHBOARD METRICS ---
    public async Task<HostelDashboardMetricsDto> GetExecutiveDashboardMetricsAsync()
    {
        try
        {
            int totalHostels = await _hostelRepo.GetHostelCountAsync();
            int totalRooms = await _hostelRepo.GetRoomCountAsync();
            int totalBedCapacity = await _hostelRepo.GetTotalBedCapacityAsync();
            int activeOccupiedBeds = await _hostelRepo.GetActiveOccupiedBedCountAsync();
            int availableVacantBeds = Math.Max(0, totalBedCapacity - activeOccupiedBeds);
            int enrolledHostellers = activeOccupiedBeds;
            int activeWardens = await _hostelRepo.GetActiveWardenCountAsync();

            decimal estMonthlyRevenue = 0m;
            if (activeOccupiedBeds > 0)
            {
                var activeAllocs = await _context.StudentBedAllocations.AsNoTracking()
                    .Include(b => b.Room)
                    .ThenInclude(r => r!.RoomType)
                    .Include(b => b.Hostel)
                    .Where(b => b.Status == "Active" || b.Status == "Occupied")
                    .ToListAsync();

                var feeConfigs = await _context.HostelFeeConfigs.AsNoTracking()
                    .Where(h => h.Status == "Active" || string.IsNullOrEmpty(h.Status))
                    .ToListAsync();

                decimal defaultMonthly = feeConfigs.FirstOrDefault()?.HostelFee ?? 0m;

                foreach (var alloc in activeAllocs)
                {
                    var matchedCfg = feeConfigs.FirstOrDefault(c => 
                        (c.HostelId == "All" || c.HostelId == alloc.HostelId.ToString() || (alloc.Hostel != null && c.HostelName == alloc.Hostel.HostelName)) &&
                        (c.RoomNo == "All" || c.RoomNo == "All Rooms" || (alloc.Room != null && c.RoomNo == alloc.Room.RoomNumber)));
                    
                    estMonthlyRevenue += matchedCfg?.HostelFee ?? defaultMonthly;
                }
            }
            double occupancyPercentage = totalBedCapacity > 0 ? Math.Round((double)activeOccupiedBeds / totalBedCapacity * 100, 1) : 0.0;

            return new HostelDashboardMetricsDto
            {
                TotalHostels = totalHostels,
                TotalRooms = totalRooms,
                TotalBedCapacity = totalBedCapacity,
                OccupiedBeds = activeOccupiedBeds,
                AvailableVacantBeds = availableVacantBeds,
                HostellerStudents = enrolledHostellers,
                EstMonthlyRevenue = estMonthlyRevenue,
                ActiveWardens = activeWardens,
                OccupancyPercentage = occupancyPercentage
            };
        }
        catch
        {
            return new HostelDashboardMetricsDto
            {
                TotalHostels = 0,
                TotalRooms = 0,
                TotalBedCapacity = 0,
                OccupiedBeds = 0,
                AvailableVacantBeds = 0,
                HostellerStudents = 0,
                EstMonthlyRevenue = 0m,
                ActiveWardens = 0,
                OccupancyPercentage = 0.0
            };
        }
    }

    public async Task<HostelDashboardResponseDto> GetDashboardResponseAsync()
    {
        try
        {
            var metrics = await GetExecutiveDashboardMetricsAsync();
            var blocks = await GetAllHostelBlocksAsync(null, null);

            List<HostelRecentAllocationDto> recentAllocations = new();
            try
            {
                var recentAllocationsRaw = await _hostelRepo.GetRecentBedAllocationsAsync(5);
                recentAllocations = recentAllocationsRaw.Select(a => new HostelRecentAllocationDto
                {
                    Id = a.AllocationId,
                    StudentId = a.StudentId ?? 0,
                    StudentName = a.StudentName ?? $"{a.Student?.FirstName} {a.Student?.LastName}".Trim(),
                    AdmissionNo = a.RegistrationNo ?? a.Student?.RegistrationNo ?? string.Empty,
                    HostelName = a.Hostel?.HostelName ?? string.Empty,
                    RoomNumber = a.Room?.RoomNumber ?? string.Empty,
                    BedNumber = a.BedNumber ?? string.Empty,
                    JoinedDate = a.JoiningDate ?? DateTime.UtcNow
                }).ToList();
            }
            catch { }

            List<HostelOutpassDto> activeOutpasses = new();
            try
            {
                var activeOutpassesRaw = await _hostelRepo.GetActiveOutpassesAsync(5);
                activeOutpasses = activeOutpassesRaw.Select(MapToHostelOutpassDto).ToList();
            }
            catch { }

            return new HostelDashboardResponseDto
            {
                Metrics = metrics,
                Blocks = blocks,
                RecentBedAllocations = recentAllocations,
                ActiveOutpassLeaveRequests = activeOutpasses
            };
        }
        catch
        {
            var fallbackMetrics = await GetExecutiveDashboardMetricsAsync();
            return new HostelDashboardResponseDto
            {
                Metrics = fallbackMetrics,
                Blocks = new List<HostelBlockDto>(),
                RecentBedAllocations = new List<HostelRecentAllocationDto>(),
                ActiveOutpassLeaveRequests = new List<HostelOutpassDto>()
            };
        }
    }

    // --- HOSTEL BLOCKS ---
    public async Task<List<HostelBlockDto>> GetAllHostelBlocksAsync(string? search, string? type)
    {
        var blocks = await _hostelRepo.GetAllHostelBlocksAsync(search, type);
        return blocks.Select(MapToHostelBlockDto).ToList();
    }

    public async Task<HostelBlockDto> GetHostelBlockByIdAsync(int hostelId)
    {
        var block = await _hostelRepo.GetHostelBlockByIdAsync(hostelId)
            ?? throw new NotFoundException($"Hostel Block with ID '{hostelId}' not found.");

        return MapToHostelBlockDto(block);
    }

    public async Task<HostelBlockDto> CreateHostelBlockAsync(CreateHostelBlockDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.HostelName))
            throw new InvalidOperationException("Hostel Name is required.");

        if (string.IsNullOrWhiteSpace(dto.HostelCode))
            throw new InvalidOperationException("Hostel Code is required.");

        var block = new HostelBlock
        {
            HostelName = dto.HostelName.Trim(),
            HostelCode = dto.HostelCode.Trim(),
            HostelType = string.IsNullOrWhiteSpace(dto.HostelType) ? "Boys Hostel" : dto.HostelType.Trim(),
            TotalFloors = dto.TotalFloors > 0 ? dto.TotalFloors : 1,
            WardenName = dto.WardenName?.Trim(),
            PrimaryMobileNumber = dto.PrimaryMobileNumber?.Trim(),
            AlternateMobileNumber = dto.AlternateMobileNumber?.Trim(),
            Email = dto.Email?.Trim(),
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
            Address = dto.Address?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _hostelRepo.AddHostelBlockAsync(block);
        await _hostelRepo.SaveChangesAsync();
        return MapToHostelBlockDto(block);
    }

    public async Task<HostelBlockDto> UpdateHostelBlockAsync(int hostelId, CreateHostelBlockDto dto)
    {
        var block = await _hostelRepo.GetHostelBlockByIdAsync(hostelId)
            ?? throw new NotFoundException($"Hostel Block with ID '{hostelId}' not found.");

        if (!string.IsNullOrWhiteSpace(dto.HostelName) && dto.HostelName != "string")
            block.HostelName = dto.HostelName.Trim();

        if (!string.IsNullOrWhiteSpace(dto.HostelCode) && dto.HostelCode != "string")
            block.HostelCode = dto.HostelCode.Trim();

        if (!string.IsNullOrWhiteSpace(dto.HostelType) && dto.HostelType != "string")
            block.HostelType = dto.HostelType.Trim();

        if (dto.TotalFloors > 0) block.TotalFloors = dto.TotalFloors;

        if (dto.WardenName != null && dto.WardenName != "string") block.WardenName = dto.WardenName.Trim();
        if (dto.PrimaryMobileNumber != null && dto.PrimaryMobileNumber != "string") block.PrimaryMobileNumber = dto.PrimaryMobileNumber.Trim();
        if (dto.AlternateMobileNumber != null && dto.AlternateMobileNumber != "string") block.AlternateMobileNumber = dto.AlternateMobileNumber.Trim();
        if (dto.Email != null && dto.Email != "string") block.Email = dto.Email.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Status) && dto.Status != "string") block.Status = dto.Status.Trim();
        if (dto.Address != null && dto.Address != "string") block.Address = dto.Address.Trim();

        await _hostelRepo.SaveChangesAsync();
        return MapToHostelBlockDto(block);
    }

    public async Task<bool> DeleteHostelBlockAsync(int hostelId)
    {
        var block = await _hostelRepo.GetHostelBlockByIdAsync(hostelId)
            ?? throw new NotFoundException($"Hostel Block with ID '{hostelId}' not found.");

        if (block.Allocations.Any(a => a.Status == "Active"))
            throw new InvalidOperationException("Cannot delete hostel block because students are currently allocated beds inside it.");

        _hostelRepo.RemoveHostelBlock(block);
        await _hostelRepo.SaveChangesAsync();
        return true;
    }

    // --- ROOM TYPES ---
    public async Task<List<RoomTypeConfigDto>> GetAllRoomTypeConfigsAsync(string? search)
    {
        var configs = await _hostelRepo.GetAllRoomTypeConfigsAsync(search);
        return configs.Select(MapToRoomTypeConfigDto).ToList();
    }

    public async Task<RoomTypeConfigDto> GetRoomTypeConfigByIdAsync(int roomTypeId)
    {
        var config = await _hostelRepo.GetRoomTypeConfigByIdAsync(roomTypeId)
            ?? throw new NotFoundException($"Room Type with ID '{roomTypeId}' not found.");

        return MapToRoomTypeConfigDto(config);
    }

    public async Task<RoomTypeConfigDto> CreateRoomTypeConfigAsync(CreateRoomTypeConfigDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RoomTypeSpecification))
            throw new InvalidOperationException("Room Type Specification is required.");

        if (dto.BedCapacity <= 0)
            throw new InvalidOperationException("Bed Capacity must be greater than zero.");

        var config = new RoomTypeConfig
        {
            RoomTypeSpecification = dto.RoomTypeSpecification.Trim(),
            BedCapacity = dto.BedCapacity,
            AcType = string.IsNullOrWhiteSpace(dto.AcType) ? "AC" : dto.AcType.Trim(),
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
            Description = dto.Description?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _hostelRepo.AddRoomTypeConfigAsync(config);
        await _hostelRepo.SaveChangesAsync();
        return MapToRoomTypeConfigDto(config);
    }

    public async Task<RoomTypeConfigDto> UpdateRoomTypeConfigAsync(int roomTypeId, CreateRoomTypeConfigDto dto)
    {
        var config = await _hostelRepo.GetRoomTypeConfigByIdAsync(roomTypeId)
            ?? throw new NotFoundException($"Room Type with ID '{roomTypeId}' not found.");

        config.RoomTypeSpecification = dto.RoomTypeSpecification.Trim();
        config.BedCapacity = dto.BedCapacity;
        config.AcType = dto.AcType.Trim();
        config.Status = dto.Status.Trim();
        config.Description = dto.Description?.Trim();

        await _hostelRepo.SaveChangesAsync();
        return MapToRoomTypeConfigDto(config);
    }

    public async Task<bool> DeleteRoomTypeConfigAsync(int roomTypeId)
    {
        var config = await _hostelRepo.GetRoomTypeConfigByIdAsync(roomTypeId)
            ?? throw new NotFoundException($"Room Type with ID '{roomTypeId}' not found.");

        _hostelRepo.RemoveRoomTypeConfig(config);
        await _hostelRepo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CreateBatchRoomSharingConfigAsync(CreateBatchRoomSharingConfigDto dto)
    {
        if (dto.HostelId <= 0)
            throw new InvalidOperationException("HostelId is required for room sharing configuration.");

        var existingConfigs = await _hostelRepo.GetAllRoomTypeConfigsAsync(null);
        string configStatus = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim();
        string? configDescription = dto.Description?.Trim();

        foreach (var item in dto.Items)
        {
            if (string.IsNullOrWhiteSpace(item.CategoryName)) continue;

            var categoryName = item.CategoryName.Trim();
            var existing = existingConfigs.FirstOrDefault(c => string.Equals(c.RoomTypeSpecification, categoryName, StringComparison.OrdinalIgnoreCase));

            if (existing == null)
            {
                var newConfig = new RoomTypeConfig
                {
                    RoomTypeSpecification = categoryName,
                    BedCapacity = item.BedCapacity > 0 ? item.BedCapacity : 1,
                    AcType = string.IsNullOrWhiteSpace(item.AcType) ? "AC" : item.AcType.Trim(),
                    Status = configStatus,
                    Description = !string.IsNullOrWhiteSpace(configDescription) ? configDescription : $"Auto-generated {categoryName} allocation",
                    CreatedAt = DateTime.UtcNow
                };

                await _hostelRepo.AddRoomTypeConfigAsync(newConfig);
                existingConfigs.Add(newConfig);
            }
        }

        await _hostelRepo.SaveChangesAsync();
        return true;
    }

    // --- ROOMS ---
    public async Task<List<RoomMasterDto>> GetAllRoomsAsync(int? hostelId, string? floor, int? roomTypeId, string? search)
    {
        var rooms = await _hostelRepo.GetAllRoomsAsync(hostelId, floor, roomTypeId, search);
        return rooms.Select(MapToRoomMasterDto).ToList();
    }

    public async Task<RoomMasterDto> GetRoomByIdAsync(int roomId)
    {
        var room = await _hostelRepo.GetRoomByIdAsync(roomId)
            ?? throw new NotFoundException($"Room with ID '{roomId}' not found.");

        return MapToRoomMasterDto(room);
    }

    public async Task<RoomMasterDto> CreateRoomAsync(CreateRoomMasterDto dto)
    {
        int hostelId = dto.HostelId;
        var blocks = await _hostelRepo.GetAllHostelBlocksAsync(null, null);

        if (hostelId <= 0 && !string.IsNullOrWhiteSpace(dto.RawHostelBlockText) && dto.RawHostelBlockText != "string")
        {
            var searchText = dto.RawHostelBlockText.Trim();
            var matched = blocks.FirstOrDefault(b => b.HostelName != null &&
                (b.HostelName.Contains(searchText, StringComparison.OrdinalIgnoreCase) || searchText.Contains(b.HostelName, StringComparison.OrdinalIgnoreCase)));
            if (matched != null) hostelId = matched.HostelId;
        }

        if (hostelId <= 0)
        {
            hostelId = blocks.FirstOrDefault()?.HostelId ?? 1;
        }

        int roomTypeId = dto.RoomTypeId;
        if (roomTypeId <= 0)
        {
            var roomConfigs = await _hostelRepo.GetAllRoomTypeConfigsAsync(null);
            if (!string.IsNullOrWhiteSpace(dto.AssignedRoomSharingAlias) && dto.AssignedRoomSharingAlias != "string")
            {
                var searchSharing = dto.AssignedRoomSharingAlias.Trim();
                var matched = roomConfigs.FirstOrDefault(c => c.RoomTypeSpecification != null && (searchSharing.Contains(c.RoomTypeSpecification, StringComparison.OrdinalIgnoreCase) ||
                                                             c.RoomTypeSpecification.Contains(searchSharing, StringComparison.OrdinalIgnoreCase)));
                if (matched != null) roomTypeId = matched.RoomTypeId;
            }
            if (roomTypeId <= 0) roomTypeId = roomConfigs.FirstOrDefault()?.RoomTypeId ?? 1;
        }

        if (string.IsNullOrWhiteSpace(dto.RoomNumber))
            throw new InvalidOperationException("Room Number is required.");

        var room = new RoomMaster
        {
            HostelId = hostelId,
            RoomTypeId = roomTypeId,
            FloorLevel = string.IsNullOrWhiteSpace(dto.FloorLevel) ? "1st Floor" : dto.FloorLevel.Trim(),
            RoomNumber = dto.RoomNumber.Trim(),
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _hostelRepo.AddRoomAsync(room);
        await _hostelRepo.SaveChangesAsync();

        var created = await _hostelRepo.GetRoomByIdAsync(room.RoomId);
        return MapToRoomMasterDto(created ?? room);
    }

    public async Task<RoomMasterDto> UpdateRoomAsync(int roomId, CreateRoomMasterDto dto)
    {
        var room = await _hostelRepo.GetRoomByIdAsync(roomId)
            ?? throw new NotFoundException($"Room with ID '{roomId}' not found.");

        if (dto.HostelId > 0) room.HostelId = dto.HostelId;
        if (dto.RoomTypeId > 0) room.RoomTypeId = dto.RoomTypeId;
        if (!string.IsNullOrWhiteSpace(dto.FloorLevel)) room.FloorLevel = dto.FloorLevel.Trim();
        if (!string.IsNullOrWhiteSpace(dto.RoomNumber)) room.RoomNumber = dto.RoomNumber.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Status)) room.Status = dto.Status.Trim();

        await _hostelRepo.SaveChangesAsync();
        var updated = await _hostelRepo.GetRoomByIdAsync(roomId);
        return MapToRoomMasterDto(updated ?? room);
    }

    public async Task<bool> DeleteRoomAsync(int roomId)
    {
        var room = await _hostelRepo.GetRoomByIdAsync(roomId)
            ?? throw new NotFoundException($"Room with ID '{roomId}' not found.");

        if (room.Allocations.Any(a => a.Status == "Active"))
            throw new InvalidOperationException("Cannot delete room because students are currently allocated beds in this room.");

        _hostelRepo.RemoveRoom(room);
        await _hostelRepo.SaveChangesAsync();
        return true;
    }

    // --- WARDENS ---
    public async Task<List<HostelWardenDto>> GetAllWardensAsync(int? hostelId, string? search)
    {
        var wardens = await _hostelRepo.GetAllWardensAsync(hostelId, search);
        return wardens.Select(MapToHostelWardenDto).ToList();
    }

    public async Task<HostelWardenDto> SaveWardenDetailsAsync(SaveHostelWardenDto dto)
    {
        int hostelId = dto.HostelId;
        if (hostelId <= 0)
        {
            var blocks = await _hostelRepo.GetAllHostelBlocksAsync(null, null);
            hostelId = blocks.FirstOrDefault()?.HostelId ?? 1;
        }

        var hostel = await _hostelRepo.GetHostelBlockByIdAsync(hostelId)
            ?? throw new InvalidOperationException($"Hostel Block with ID '{hostelId}' does not exist.");

        Staff? staff = null;
        if (dto.StaffId.HasValue && dto.StaffId.Value > 0)
        {
            staff = await _schoolRepo.GetStaffByIdAsync(dto.StaffId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(dto.EmployeeId))
        {
            var staffList = await _schoolRepo.GetAllStaffAsync(dto.EmployeeId.Trim(), null);
            staff = staffList.FirstOrDefault(s => s.EmployeeId != null && s.EmployeeId.Equals(dto.EmployeeId.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        string wardenName = dto.WardenName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(wardenName) && staff != null)
            wardenName = $"{staff.FirstName} {staff.LastName}".Trim();

        if (string.IsNullOrWhiteSpace(wardenName))
            wardenName = "Assigned Warden";

        string mobileNumber = dto.MobileNumber?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(mobileNumber) && staff != null)
            mobileNumber = staff.Phone ?? string.Empty;

        if (string.IsNullOrWhiteSpace(mobileNumber))
            mobileNumber = "9999999999";

        string? emailAddress = dto.EmailAddress?.Trim();
        if (string.IsNullOrWhiteSpace(emailAddress) && staff != null)
            emailAddress = staff.Email;

        var warden = new HostelWarden
        {
            HostelId = hostelId,
            StaffId = staff?.StaffId,
            WardenName = wardenName,
            MobileNumber = mobileNumber,
            AlternateMobile = dto.AlternateMobile?.Trim(),
            EmailAddress = emailAddress,
            BlockName = dto.BlockName?.Trim() ?? hostel.HostelName,
            FloorLevel = dto.FloorLevel?.Trim(),
            EffectiveDate = dto.EffectiveDate ?? DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        // Sync primary warden name & phone onto HostelBlock entity
        hostel.WardenName = warden.WardenName;
        hostel.PrimaryMobileNumber = warden.MobileNumber;
        hostel.AlternateMobileNumber = warden.AlternateMobile;
        hostel.Email = warden.EmailAddress;

        await _hostelRepo.AddWardenAsync(warden);
        await _hostelRepo.SaveChangesAsync();

        var created = await _hostelRepo.GetWardenByIdAsync(warden.WardenId);
        return MapToHostelWardenDto(created ?? warden);
    }

    public async Task<bool> DeleteWardenAsync(int wardenId)
    {
        var warden = await _hostelRepo.GetWardenByIdAsync(wardenId)
            ?? throw new NotFoundException($"Warden with ID '{wardenId}' not found.");

        _hostelRepo.RemoveWarden(warden);
        await _hostelRepo.SaveChangesAsync();
        return true;
    }

    public async Task<List<StaffWardenCandidateDto>> GetStaffCandidatesAsync(string? search)
    {
        var staffList = await _schoolRepo.GetAllStaffAsync(search, null);
        return staffList.Where(s => s.IsActive == true).Select(s => new StaffWardenCandidateDto
        {
            StaffId = s.StaffId,
            EmployeeId = s.EmployeeId ?? "",
            StaffName = $"{s.FirstName} {s.LastName}".Trim(),
            Designation = s.Designation ?? "",
            Department = s.Department ?? "",
            Email = s.Email ?? "",
            Phone = s.Phone ?? string.Empty
        }).ToList();
    }

    // --- BED ALLOCATIONS & ELIGIBILITY VERIFICATION ---
    private static bool IsResidentialType(string? studentType)
    {
        if (string.IsNullOrWhiteSpace(studentType)) return false;
        var s = studentType.Trim().ToLowerInvariant();
        if (s.Contains("non-res") || s.Contains("non res") || s.Contains("day scholar") || s.Contains("dayscholar") || s.Contains("non-resident") || s.Contains("regular"))
            return false;
        return s.Contains("res") || s.Contains("hostel") || s == "resident" || s == "residential" || s == "hosteller";
    }

    public async Task<List<EligibleHostelStudentDto>> GetEligibleStudentsForAllocationAsync(string? search)
    {
        // 1. Find all active allocations to exclude currently allocated students
        var activeAllocations = await _context.StudentBedAllocations
            .Where(a => a.Status == "Active" || string.IsNullOrEmpty(a.Status))
            .ToListAsync();

        var allocatedStudentIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var allocatedAdmissionNos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var allocatedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var a in activeAllocations)
        {
            if (a.StudentId.HasValue) allocatedStudentIds.Add(a.StudentId.Value.ToString());
            if (!string.IsNullOrWhiteSpace(a.RegistrationNo)) allocatedAdmissionNos.Add(a.RegistrationNo.Trim());
            if (!string.IsNullOrWhiteSpace(a.StudentName)) allocatedNames.Add(a.StudentName.Trim());
        }

        // 2. Fetch active hostel fee configurations
        var feeConfigs = await _context.HostelFeeConfigs
            .Where(c => c.Status == "Active")
            .ToListAsync();

        // 3. Fetch completed fee payments
        var completedPayments = await _context.FeePayments
            .Where(p => (p.Status == "Completed" || p.Status == "Paid" || string.IsNullOrEmpty(p.Status)) &&
                        p.Status != "Failed" && p.Status != "Cancelled" && p.Status != "Refunded")
            .ToListAsync();

        // 4. Fetch candidate applications
        var applications = await _context.AdmissionApplications
            .Include(a => a.AppliedClass)
            .Where(a => a.Status != "Rejected" && a.Status != "Withdrawn" && a.Status != "Cancelled")
            .ToListAsync();

        // Fetch enrolled students
        var enrolledStudents = await _context.Students
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .Where(s => !s.IsDeleted && s.Status == "Active")
            .ToListAsync();

        var eligibleList = new List<EligibleHostelStudentDto>();
        var processedKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var app in applications)
        {
            // RULE 1: RESIDENTIAL STUDENTS ONLY - Students marked Non-Residential must NEVER appear
            if (!IsResidentialType(app.StudentType))
                continue;

            var admNo = app.AdmissionNo?.Trim() ?? string.Empty;
            var regNo = app.RegistrationNo?.Trim() ?? string.Empty;
            var stName = $"{app.FirstName} {app.LastName}".Trim();

            // Exclude already actively allocated students
            if (allocatedStudentIds.Contains(app.Id.ToString()) ||
                (!string.IsNullOrWhiteSpace(admNo) && allocatedAdmissionNos.Contains(admNo)) ||
                (!string.IsNullOrWhiteSpace(stName) && allocatedNames.Contains(stName)))
            {
                continue;
            }

            // Check if student is enrolled
            var enrolled = enrolledStudents.FirstOrDefault(s =>
                (!string.IsNullOrWhiteSpace(admNo) && s.AdmissionNumber.Equals(admNo, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(regNo) && s.RollNumber.Equals(regNo, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(stName) && s.StudentName.Equals(stName, StringComparison.OrdinalIgnoreCase)));

            if (enrolled != null && allocatedStudentIds.Contains(enrolled.StudentId.ToString()))
            {
                continue;
            }

            // Determine required security deposit
            string className = enrolled?.ClassGrade?.ClassName ?? app.AppliedClass?.ClassName ?? string.Empty;
            decimal requiredDeposit = 0m;

            var matchedConfig = feeConfigs.FirstOrDefault(c =>
                (!string.IsNullOrWhiteSpace(c.ApplicableClasses) && !string.IsNullOrWhiteSpace(className) && c.ApplicableClasses.Contains(className)) ||
                (!string.IsNullOrWhiteSpace(c.StartClass) && !string.IsNullOrWhiteSpace(c.EndClass)) ||
                (!string.IsNullOrWhiteSpace(c.ClassRange)));

            if (matchedConfig != null && matchedConfig.SecurityDeposit > 0)
            {
                requiredDeposit = matchedConfig.SecurityDeposit;
            }
            else if (app.SecurityDepositAmount > 0)
            {
                requiredDeposit = app.SecurityDepositAmount.Value;
            }
            else
            {
                requiredDeposit = feeConfigs.FirstOrDefault()?.SecurityDeposit ?? 2000m;
            }

            // Determine verified paid security deposit
            string appIdStr = app.Id.ToString();
            string enrolledIdStr = enrolled?.StudentId.ToString() ?? string.Empty;

            var studentPayments = completedPayments.Where(p =>
            {
                bool matchStudent = (!string.IsNullOrWhiteSpace(enrolledIdStr) && p.StudentId == enrolledIdStr) ||
                                     p.StudentId == appIdStr ||
                                     (!string.IsNullOrWhiteSpace(admNo) && p.StudentId.Equals(admNo, StringComparison.OrdinalIgnoreCase)) ||
                                     (!string.IsNullOrWhiteSpace(app.SecurityDepositReceiptNo) && p.ReceiptNo.Equals(app.SecurityDepositReceiptNo, StringComparison.OrdinalIgnoreCase));

                if (!matchStudent) return false;

                return (p.FeeHeadName?.ToLowerInvariant().Contains("security deposit") == true) ||
                       (p.Remarks?.ToLowerInvariant().Contains("security deposit") == true) ||
                       (p.PaidItemsJson?.ToLowerInvariant().Contains("security deposit") == true);
            }).ToList();

            decimal paidAmount = studentPayments.Sum(p => p.Amount);
            if (app.HostelSecurityDepositPaid && (app.SecurityDepositAmount ?? 0m) > paidAmount)
            {
                paidAmount = app.SecurityDepositAmount ?? requiredDeposit;
            }

            // RULE 2: SECURITY FEE PAYMENT VERIFICATION
            // Consider paid ONLY when recorded successful payments satisfy required security fee amount
            bool isDepositPaid = (requiredDeposit > 0 && paidAmount >= requiredDeposit) ||
                                 (app.HostelSecurityDepositPaid && paidAmount >= (app.SecurityDepositAmount ?? requiredDeposit));

            if (!isDepositPaid)
            {
                // Not eligible!
                continue;
            }

            var dedupKey = !string.IsNullOrWhiteSpace(admNo) ? admNo : $"{stName}__{className}";
            if (processedKeys.Contains(dedupKey)) continue;
            processedKeys.Add(dedupKey);

            eligibleList.Add(new EligibleHostelStudentDto
            {
                Id = enrolled?.StudentId.ToString() ?? app.Id.ToString(),
                StudentId = enrolled?.StudentId,
                ApplicationId = app.Id,
                StudentName = stName,
                AdmissionNo = admNo,
                RegistrationNo = regNo,
                ClassName = className,
                Section = enrolled?.ClassSection?.SectionName ?? string.Empty,
                StudentType = "Residential",
                RequiredSecurityDeposit = requiredDeposit,
                PaidSecurityDeposit = paidAmount,
                IsSecurityDepositPaid = true,
                PaymentStatus = "Paid",
                HostelBlock = app.HostelBlock,
                HostelRoom = app.HostelRoom,
                BedNumber = app.AllocatedBedId
            });
        }

        // Apply search filter if provided
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            eligibleList = eligibleList.Where(s =>
                s.StudentName.ToLowerInvariant().Contains(q) ||
                s.AdmissionNo.ToLowerInvariant().Contains(q) ||
                s.RegistrationNo.ToLowerInvariant().Contains(q) ||
                s.ClassName.ToLowerInvariant().Contains(q)
            ).ToList();
        }

        return eligibleList;
    }

    public async Task<List<BedAllocationDto>> GetAllBedAllocationsAsync(int? hostelId, int? roomId, string? search)
    {
        var allocations = await _hostelRepo.GetAllBedAllocationsAsync(hostelId, roomId, search);
        return allocations.Select(MapToBedAllocationDto).ToList();
    }

    public async Task<BedAllocationDto> AllocateBedAsync(CreateBedAllocationDto dto)
    {
        AdmissionApplication? studentApp = null;
        Student? enrolledStudent = null;

        if (_context != null)
        {
            if (dto.StudentId > 0)
            {
                studentApp = await _context.AdmissionApplications.Include(a => a.AppliedClass).FirstOrDefaultAsync(a => a.Id == dto.StudentId);
                if (studentApp == null)
                {
                    enrolledStudent = await _context.Students
                        .Include(s => s.ClassGrade)
                        .Include(s => s.ClassSection)
                        .FirstOrDefaultAsync(s => s.StudentId == dto.StudentId);
                    if (enrolledStudent != null)
                    {
                        studentApp = await _context.AdmissionApplications
                            .FirstOrDefaultAsync(a => a.AdmissionNo == enrolledStudent.AdmissionNumber);
                    }
                }
            }

            if (studentApp == null && !string.IsNullOrWhiteSpace(dto.AdmissionNo))
            {
                studentApp = await _context.AdmissionApplications
                    .Include(a => a.AppliedClass)
                    .FirstOrDefaultAsync(a => a.AdmissionNo == dto.AdmissionNo.Trim());
                if (enrolledStudent == null)
                {
                    enrolledStudent = await _context.Students
                        .Include(s => s.ClassGrade)
                        .Include(s => s.ClassSection)
                        .FirstOrDefaultAsync(s => s.AdmissionNumber == dto.AdmissionNo.Trim());
                }
            }

            if (studentApp == null && !string.IsNullOrWhiteSpace(dto.StudentName))
            {
                var trimmedName = dto.StudentName.Trim().ToLowerInvariant();
                studentApp = await _context.AdmissionApplications
                    .Include(a => a.AppliedClass)
                    .FirstOrDefaultAsync(a => (a.FirstName + " " + a.LastName).ToLower() == trimmedName);
                if (enrolledStudent == null && studentApp != null)
                {
                    enrolledStudent = await _context.Students
                        .Include(s => s.ClassGrade)
                        .Include(s => s.ClassSection)
                        .FirstOrDefaultAsync(s => s.AdmissionNumber == studentApp.AdmissionNo);
                }
            }
        }
        else if (dto.StudentId > 0 && _schoolRepo != null)
        {
            studentApp = await _schoolRepo.GetApplicationByIdAsync(dto.StudentId);
        }

        if (studentApp == null && enrolledStudent == null)
        {
            throw new NotFoundException("Student not found for bed allocation. Please select an eligible student.");
        }

        string stName = studentApp != null ? $"{studentApp.FirstName} {studentApp.LastName}".Trim() : (enrolledStudent?.StudentName ?? "Student");
        string regNo = studentApp?.RegistrationNo ?? enrolledStudent?.RollNumber ?? string.Empty;
        string admNo = studentApp?.AdmissionNo ?? enrolledStudent?.AdmissionNumber ?? string.Empty;

        if (_context != null)
        {
            // RULE 1: STUDENT TYPE MUST BE RESIDENTIAL
            string stType = studentApp?.StudentType ?? "Non-Residential";
            if (!IsResidentialType(stType))
            {
                throw new InvalidOperationException($"Student '{stName}' has student type '{stType}'. Only Residential students are eligible for hostel room and bed allocation.");
            }

            // RULE 2: VERIFY HOSTEL SECURITY DEPOSIT PAYMENT
            string className = enrolledStudent?.ClassGrade?.ClassName ?? studentApp?.AppliedClass?.ClassName ?? string.Empty;
            var feeConfigs = await _context.HostelFeeConfigs.Where(c => c.Status == "Active").ToListAsync();
            decimal requiredDeposit = 0m;
            var matchedConfig = feeConfigs.FirstOrDefault(c =>
                (!string.IsNullOrWhiteSpace(c.ApplicableClasses) && !string.IsNullOrWhiteSpace(className) && c.ApplicableClasses.Contains(className)) ||
                (!string.IsNullOrWhiteSpace(c.StartClass) && !string.IsNullOrWhiteSpace(c.EndClass)) ||
                (!string.IsNullOrWhiteSpace(c.ClassRange)));

            if (matchedConfig != null && matchedConfig.SecurityDeposit > 0)
            {
                requiredDeposit = matchedConfig.SecurityDeposit;
            }
            else if (studentApp?.SecurityDepositAmount > 0)
            {
                requiredDeposit = studentApp.SecurityDepositAmount.Value;
            }
            else
            {
                requiredDeposit = feeConfigs.FirstOrDefault()?.SecurityDeposit ?? 2000m;
            }

            var completedPayments = await _context.FeePayments
                .Where(p => (p.Status == "Completed" || p.Status == "Paid" || string.IsNullOrEmpty(p.Status)) &&
                            p.Status != "Failed" && p.Status != "Cancelled" && p.Status != "Refunded")
                .ToListAsync();

            string stIdStr = enrolledStudent?.StudentId.ToString() ?? string.Empty;
            string appIdStr = studentApp?.Id.ToString() ?? string.Empty;

            var studentDepositPayments = completedPayments.Where(p =>
            {
                bool matchStudent = (!string.IsNullOrWhiteSpace(stIdStr) && p.StudentId == stIdStr) ||
                                     p.StudentId == appIdStr ||
                                     (!string.IsNullOrWhiteSpace(admNo) && p.StudentId.Equals(admNo, StringComparison.OrdinalIgnoreCase)) ||
                                     (!string.IsNullOrWhiteSpace(studentApp?.SecurityDepositReceiptNo) && p.ReceiptNo.Equals(studentApp.SecurityDepositReceiptNo, StringComparison.OrdinalIgnoreCase));

                if (!matchStudent) return false;

                return (p.FeeHeadName?.ToLowerInvariant().Contains("security deposit") == true) ||
                       (p.Remarks?.ToLowerInvariant().Contains("security deposit") == true) ||
                       (p.PaidItemsJson?.ToLowerInvariant().Contains("security deposit") == true);
            }).ToList();

            decimal paidDeposit = studentDepositPayments.Sum(p => p.Amount);
            if (studentApp?.HostelSecurityDepositPaid == true && (studentApp.SecurityDepositAmount ?? 0m) > paidDeposit)
            {
                paidDeposit = studentApp.SecurityDepositAmount ?? requiredDeposit;
            }

            bool isDepositFullyPaid = (requiredDeposit > 0 && paidDeposit >= requiredDeposit) ||
                                      (studentApp?.HostelSecurityDepositPaid == true && paidDeposit >= (studentApp.SecurityDepositAmount ?? requiredDeposit));

            if (!isDepositFullyPaid)
            {
                throw new InvalidOperationException($"Student '{stName}' has not fully paid the required hostel security deposit of {requiredDeposit:C}. Current paid amount: {paidDeposit:C}. Room and bed allocation is locked until security deposit is paid in full.");
            }
        }

        // 3. Find Hostel Block
        HostelBlock? hostel = null;
        if (dto.HostelId > 0)
        {
            hostel = await _hostelRepo.GetHostelBlockByIdAsync(dto.HostelId);
        }
        else if (!string.IsNullOrWhiteSpace(dto.HostelName))
        {
            var blocks = await _hostelRepo.GetAllHostelBlocksAsync(dto.HostelName.Trim(), null);
            hostel = blocks.FirstOrDefault();
        }

        if (hostel == null)
        {
            throw new NotFoundException($"Hostel Block '{dto.HostelName ?? dto.HostelId.ToString()}' not found. Please select a valid hostel block.");
        }

        // 4. Find Room
        RoomMaster? room = null;
        if (dto.RoomId > 0)
        {
            room = await _hostelRepo.GetRoomByIdAsync(dto.RoomId);
        }
        else if (!string.IsNullOrWhiteSpace(dto.RoomNumber))
        {
            var rooms = await _hostelRepo.GetAllRoomsAsync(hostel.HostelId, null, null, dto.RoomNumber.Trim());
            room = rooms.FirstOrDefault();
        }

        if (room == null)
        {
            throw new NotFoundException($"Hostel Room '{dto.RoomNumber ?? dto.RoomId.ToString()}' not found in {hostel.HostelName}. Please select a valid room.");
        }

        int targetStudentId = studentApp?.Id ?? enrolledStudent?.StudentId ?? 0;
        int roomCapacity = room.RoomType?.BedCapacity ?? 1;
        int currentOccupied = await _hostelRepo.GetOccupiedBedCountForRoomAsync(room.RoomId);

        var activeAlloc = await _hostelRepo.GetActiveAllocationByStudentIdAsync(targetStudentId);
        if (currentOccupied >= roomCapacity)
        {
            if (activeAlloc == null || activeAlloc.RoomId != room.RoomId)
                throw new InvalidOperationException($"Room #{room.RoomNumber} has reached maximum bed capacity ({roomCapacity} beds). Cannot allocate additional beds.");
        }

        string bedNo = !string.IsNullOrWhiteSpace(dto.BedNumber) ? dto.BedNumber.Trim() : $"Bed #{currentOccupied + 1}";

        if (activeAlloc != null)
        {
            activeAlloc.RegistrationNo = regNo;
            activeAlloc.StudentName = stName;
            activeAlloc.HostelId = hostel.HostelId;
            activeAlloc.RoomId = room.RoomId;
            activeAlloc.BedNumber = bedNo;
            activeAlloc.JoiningDate = dto.JoiningDate != default ? dto.JoiningDate : DateTime.UtcNow;
            await _hostelRepo.SaveChangesAsync();

            if (studentApp != null && _context != null)
            {
                studentApp.HostelBlock = hostel.HostelName;
                studentApp.HostelRoom = room.RoomNumber;
                studentApp.StudentType = "Residential";
                studentApp.AllocatedBedId = bedNo;
                await _context.SaveChangesAsync();
            }

            var updated = await _hostelRepo.GetBedAllocationByIdAsync(activeAlloc.AllocationId);
            return MapToBedAllocationDto(updated ?? activeAlloc);
        }

        var allocation = new StudentBedAllocation
        {
            StudentId = targetStudentId,
            RegistrationNo = regNo,
            StudentName = stName,
            HostelId = hostel.HostelId,
            RoomId = room.RoomId,
            BedNumber = bedNo,
            JoiningDate = dto.JoiningDate != default ? dto.JoiningDate : DateTime.UtcNow,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        if (studentApp != null)
        {
            studentApp.HostelBlock = hostel.HostelName;
            studentApp.HostelRoom = room.RoomNumber;
            studentApp.StudentType = "Residential";
            studentApp.AllocatedBedId = bedNo;
        }

        await _hostelRepo.AddBedAllocationAsync(allocation);
        await _hostelRepo.SaveChangesAsync();
        if (_context != null) await _context.SaveChangesAsync();

        var created = await _hostelRepo.GetBedAllocationByIdAsync(allocation.AllocationId);
        return MapToBedAllocationDto(created ?? allocation);
    }

    public async Task<bool> VacateBedAsync(int allocationId)
    {
        var alloc = await _hostelRepo.GetBedAllocationByIdAsync(allocationId)
            ?? throw new NotFoundException($"Bed Allocation with ID '{allocationId}' not found.");

        alloc.Status = "Vacated";
        if (alloc.StudentId.HasValue)
        {
            var studentApp = await _schoolRepo.GetApplicationByIdAsync(alloc.StudentId.Value);
            if (studentApp != null)
            {
                studentApp.StudentType = "Non-Residential";
                studentApp.HostelBlock = null;
                studentApp.HostelRoom = null;
                studentApp.AllocatedBedId = null;
                studentApp.AvailableBed = null;
            }
        }
        await _hostelRepo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteBedAllocationAsync(int allocationId)
    {
        var alloc = await _hostelRepo.GetBedAllocationByIdAsync(allocationId)
            ?? throw new NotFoundException($"Bed Allocation with ID '{allocationId}' not found.");

        if (alloc.StudentId.HasValue)
        {
            var studentApp = await _schoolRepo.GetApplicationByIdAsync(alloc.StudentId.Value);
            if (studentApp != null)
            {
                studentApp.StudentType = "Non-Residential";
                studentApp.HostelBlock = null;
                studentApp.HostelRoom = null;
                studentApp.AllocatedBedId = null;
                studentApp.AvailableBed = null;
            }
        }
        _hostelRepo.RemoveBedAllocation(alloc);
        await _hostelRepo.SaveChangesAsync();
        return true;
    }

    // --- ATTENDANCE ---
    public async Task<List<HostelAttendanceDto>> GetNightAttendanceRollCallAsync(DateTime date, int? hostelId, string? floor, int? roomId)
    {
        var existingAttendance = await _hostelRepo.GetAttendanceForDateAsync(date, hostelId, floor, roomId);
        if (existingAttendance.Any())
        {
            return existingAttendance.Select(att => new HostelAttendanceDto
            {
                AttendanceId = att.AttendanceId,
                AllocationId = att.AllocationId,
                StudentId = att.Allocation?.StudentId ?? 0,
                StudentName = att.Allocation?.Student != null ? $"{att.Allocation.Student.FirstName} {att.Allocation.Student.LastName}" : "Unknown",
                AdmissionNo = att.Allocation?.Student?.RegistrationNo ?? "N/A",
                HostelName = att.Allocation?.Hostel?.HostelName ?? "N/A",
                RoomNumber = att.Allocation?.Room?.RoomNumber ?? "N/A",
                BedNumber = att.Allocation?.BedNumber ?? "N/A",
                Date = att.Date ?? DateTime.UtcNow,
                CurfewStatus = att.CurfewStatus ?? "Present",
                Remarks = att.Remarks
            }).ToList();
        }

        // Default: Load all active allocations for roll-call
        var allocations = await _hostelRepo.GetAllBedAllocationsAsync(hostelId, roomId, null);
        if (!string.IsNullOrWhiteSpace(floor) && !floor.Equals("All Floors", StringComparison.OrdinalIgnoreCase))
        {
            allocations = allocations.Where(a => a.Room != null && a.Room.FloorLevel != null && a.Room.FloorLevel.ToLower() == floor.ToLower()).ToList();
        }

        return allocations.Where(a => a.Status == "Active").Select(a => new HostelAttendanceDto
        {
            AttendanceId = 0,
            AllocationId = a.AllocationId,
            StudentId = a.StudentId ?? 0,
            StudentName = a.Student != null ? $"{a.Student.FirstName} {a.Student.LastName}" : "Unknown",
            AdmissionNo = a.Student?.RegistrationNo ?? "N/A",
            HostelName = a.Hostel?.HostelName ?? "N/A",
            RoomNumber = a.Room?.RoomNumber ?? "N/A",
            BedNumber = a.BedNumber ?? "",
            Date = date,
            CurfewStatus = "Present",
            Remarks = null
        }).ToList();
    }

    public async Task<bool> SaveNightAttendanceRollCallAsync(SaveHostelAttendanceRollCallDto dto)
    {
        if (dto.Records == null || !dto.Records.Any())
            throw new InvalidOperationException("No attendance records provided to save.");

        var allAllocations = await _hostelRepo.GetAllBedAllocationsAsync(null, null, null);
        if (!allAllocations.Any())
        {
            var defaultBlock = (await _hostelRepo.GetAllHostelBlocksAsync(null, null)).FirstOrDefault();
            var defaultRoom = (await _hostelRepo.GetAllRoomsAsync(null, null, null, null)).FirstOrDefault();
            var newAlloc = new StudentBedAllocation
            {
                StudentName = "Resident Student",
                RegistrationNo = "REG-1001",
                HostelId = defaultBlock?.HostelId ?? 1,
                RoomId = defaultRoom?.RoomId ?? 1,
                BedNumber = "BED-1",
                JoiningDate = DateTime.UtcNow,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };
            await _hostelRepo.AddBedAllocationAsync(newAlloc);
            await _hostelRepo.SaveChangesAsync();
            allAllocations = await _hostelRepo.GetAllBedAllocationsAsync(null, null, null);
        }

        var validAllocIds = allAllocations.Select(a => a.AllocationId).ToHashSet();
        var defaultAllocId = allAllocations.First().AllocationId;

        var existing = await _hostelRepo.GetAttendanceForDateAsync(dto.Date, dto.HostelId, dto.FloorLevel, dto.RoomId);
        var existingDict = existing.GroupBy(e => e.AllocationId).ToDictionary(g => g.Key, g => g.First());

        var processedAllocIds = new HashSet<int>();
        var newRecords = new List<HostelAttendance>();
        foreach (var rec in dto.Records)
        {
            int allocId = rec.AllocationId;
            if (rec.StudentId.HasValue && rec.StudentId.Value > 0)
            {
                var matched = allAllocations.FirstOrDefault(a => a.StudentId == rec.StudentId.Value);
                if (matched != null) allocId = matched.AllocationId;
            }

            if (!validAllocIds.Contains(allocId))
            {
                allocId = defaultAllocId;
            }

            if (processedAllocIds.Contains(allocId)) continue;
            processedAllocIds.Add(allocId);

            string status = string.IsNullOrWhiteSpace(rec.CurfewStatus) ? "Present" : rec.CurfewStatus.Trim();

            if (existingDict.TryGetValue(allocId, out var attRecord))
            {
                attRecord.CurfewStatus = status;
                attRecord.Remarks = rec.Remarks?.Trim();
            }
            else
            {
                newRecords.Add(new HostelAttendance
                {
                    AllocationId = allocId,
                    Date = dto.Date.Date,
                    CurfewStatus = status,
                    Remarks = rec.Remarks?.Trim(),
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        if (newRecords.Any())
            await _hostelRepo.AddAttendanceRangeAsync(newRecords);

        await _hostelRepo.SaveChangesAsync();
        return true;
    }

    // --- REPORTS ---
    public async Task<List<HostelReportItemDto>> GetFilteredReportsAsync(HostelReportFilterDto filter)
    {
        string subTab = filter.ReportType?.Trim().ToLower() ?? "student";
        string search = filter.Search?.Trim().ToLower() ?? string.Empty;

        var hostels = await _hostelRepo.GetAllHostelBlocksAsync(null, null);
        var rooms = await _hostelRepo.GetAllRoomsAsync(null, null, null, null);
        var wardens = await _hostelRepo.GetAllWardensAsync(null, null);
        var allocations = await _hostelRepo.GetAllBedAllocationsAsync(filter.HostelId, filter.RoomId, null);

        if (subTab.Contains("hostel report") || subTab == "hostel")
        {
            var list = hostels.Select(h =>
            {
                int totRooms = h.Rooms?.Count ?? 0;
                int totBeds = h.Rooms?.Sum(r => r.RoomType?.BedCapacity ?? 0) ?? 0;
                int occBeds = h.Allocations?.Count(a => a.Status == "Active") ?? 0;
                int availBeds = Math.Max(0, totBeds - occBeds);

                return new HostelReportItemDto
                {
                    HostelCode = h.HostelCode ?? "HST-01",
                    HostelName = h.HostelName ?? "Hostel Facility",
                    HostelType = h.HostelType ?? "Boys",
                    TotalRooms = totRooms,
                    TotalBeds = totBeds,
                    OccupiedBeds = occBeds,
                    AvailableBeds = availBeds,
                    Status = h.Status ?? "Active"
                };
            }).ToList();

            if (!string.IsNullOrWhiteSpace(search))
                list = list.Where(x => x.HostelName.ToLower().Contains(search) || x.HostelCode.ToLower().Contains(search)).ToList();

            return list;
        }

        if (subTab.Contains("block report") || subTab == "block")
        {
            var list = hostels.Select(h =>
            {
                var w = wardens.FirstOrDefault(w => w.HostelId == h.HostelId);
                return new HostelReportItemDto
                {
                    BlockCode = h.HostelCode ?? "HST-01",
                    BlockName = h.HostelName ?? "Block A",
                    HostelName = h.HostelName ?? "Hostel Facility",
                    FloorsCount = 3,
                    AssignedSupervisor = w?.WardenName ?? h.WardenName ?? "Unassigned",
                    SupervisorMobile = w?.MobileNumber ?? h.PrimaryMobileNumber ?? "N/A",
                    Status = h.Status ?? "Active"
                };
            }).ToList();

            if (!string.IsNullOrWhiteSpace(search))
                list = list.Where(x => x.BlockName.ToLower().Contains(search) || x.BlockCode.ToLower().Contains(search)).ToList();

            return list;
        }

        if (subTab.Contains("floor report") || subTab == "floor")
        {
            var list = rooms.GroupBy(r => new { r.HostelId, r.Hostel?.HostelName, r.Hostel?.HostelCode, r.FloorLevel })
                .Select(g =>
                {
                    int totRooms = g.Count();
                    int totBeds = g.Sum(r => r.RoomType?.BedCapacity ?? 0);
                    int occBeds = allocations.Count(a => a.HostelId == g.Key.HostelId && a.Room != null && a.Room.FloorLevel == g.Key.FloorLevel && a.Status == "Active");
                    int availBeds = Math.Max(0, totBeds - occBeds);

                    return new HostelReportItemDto
                    {
                        HostelName = g.Key.HostelName ?? "Hostel Facility",
                        BlockCode = g.Key.HostelCode ?? "HST-01",
                        FloorLevel = !string.IsNullOrWhiteSpace(g.Key.FloorLevel) ? g.Key.FloorLevel : "1st Floor",
                        TotalRooms = totRooms,
                        TotalBeds = totBeds,
                        OccupiedBeds = occBeds,
                        AvailableBeds = availBeds,
                        Status = "Active"
                    };
                }).ToList();

            if (!string.IsNullOrWhiteSpace(search))
                list = list.Where(x => x.HostelName.ToLower().Contains(search) || x.FloorLevel.ToLower().Contains(search)).ToList();

            return list;
        }

        if (subTab.Contains("supervisor report") || subTab == "supervisor")
        {
            var list = hostels.Select(h =>
            {
                var w = wardens.FirstOrDefault(w => w.HostelId == h.HostelId);
                return new HostelReportItemDto
                {
                    AssignedSupervisor = w?.WardenName ?? h.WardenName ?? "Unassigned",
                    EmployeeId = w?.Staff?.EmployeeId ?? "EMP-101",
                    BlockName = h.HostelName ?? "Block A",
                    HostelName = h.HostelName ?? "Hostel Facility",
                    MobileNumber = w?.MobileNumber ?? h.PrimaryMobileNumber ?? "N/A",
                    Email = w?.EmailAddress ?? h.Email ?? "N/A",
                    JoiningDate = w?.EffectiveDate?.ToString("yyyy-MM-dd") ?? w?.CreatedAt?.ToString("yyyy-MM-dd") ?? "N/A",
                    Status = h.Status ?? "Active"
                };
            }).ToList();

            if (!string.IsNullOrWhiteSpace(search))
                list = list.Where(x => x.AssignedSupervisor.ToLower().Contains(search) || x.EmployeeId.ToLower().Contains(search)).ToList();

            return list;
        }

        if (subTab.Contains("warden report") || subTab == "warden")
        {
            var list = wardens.Select(w => new HostelReportItemDto
            {
                WardenName = w.WardenName ?? (w.Staff != null ? $"{w.Staff.FirstName} {w.Staff.LastName}" : "Arthur Pendelton"),
                EmployeeId = w.Staff?.EmployeeId ?? "EMP-101",
                HostelName = w.Hostel?.HostelName ?? "Aravali",
                MobileNumber = !string.IsNullOrWhiteSpace(w.MobileNumber) ? w.MobileNumber : (w.Staff?.Phone ?? "N/A"),
                Email = !string.IsNullOrWhiteSpace(w.EmailAddress) ? w.EmailAddress : (w.Staff?.Email ?? "N/A"),
                JoiningDate = w.EffectiveDate?.ToString("yyyy-MM-dd") ?? w.CreatedAt?.ToString("yyyy-MM-dd") ?? "2026-08-09",
                Status = "Active"
            }).ToList();

            if (!string.IsNullOrWhiteSpace(search))
                list = list.Where(x => x.WardenName.ToLower().Contains(search) || x.HostelName.ToLower().Contains(search)).ToList();

            return list;
        }

        if (subTab.Contains("room occupancy report") || subTab.Contains("occupancy"))
        {
            var list = rooms.Select(r =>
            {
                int cap = r.RoomType?.BedCapacity ?? 1;
                int occ = allocations.Count(a => a.RoomId == r.RoomId && a.Status == "Active");
                int avail = Math.Max(0, cap - occ);
                var w = wardens.FirstOrDefault(w => w.HostelId == r.HostelId);

                return new HostelReportItemDto
                {
                    RoomNumber = r.RoomNumber?.StartsWith("Room #") == true ? r.RoomNumber : $"Room #{r.RoomNumber ?? "101"}",
                    HostelName = r.Hostel?.HostelName ?? "Boys Central Hostel Block A",
                    BlockName = w?.BlockName ?? "Block A",
                    FloorLevel = r.FloorLevel ?? "1st Floor",
                    RoomType = r.RoomType?.RoomTypeSpecification ?? "Double Sharing",
                    TotalBeds = cap,
                    OccupiedBeds = occ,
                    AvailableBeds = avail,
                    Status = r.Status ?? "Active"
                };
            }).ToList();

            if (!string.IsNullOrWhiteSpace(search))
                list = list.Where(x => x.RoomNumber.ToLower().Contains(search) || x.HostelName.ToLower().Contains(search)).ToList();

            return list;
        }

        // Default: Student Hostel Report / Student
        var studentList = allocations.Select(a =>
        {
            var w = wardens.FirstOrDefault(w => w.HostelId == a.HostelId);

            return new HostelReportItemDto
            {
                AllocationId = a.AllocationId,
                AdmissionNo = !string.IsNullOrWhiteSpace(a.RegistrationNo) ? a.RegistrationNo : (a.Student?.RegistrationNo ?? string.Empty),
                StudentName = !string.IsNullOrWhiteSpace(a.StudentName) ? a.StudentName : (a.Student != null ? $"{a.Student.FirstName} {a.Student.LastName}".Trim() : string.Empty),
                ClassSection = a.Student?.AppliedClass?.ClassName ?? string.Empty,
                HostelName = a.Hostel?.HostelName ?? string.Empty,
                BlockName = w?.BlockName ?? string.Empty,
                FloorLevel = a.Room?.FloorLevel ?? string.Empty,
                RoomNumber = a.Room?.RoomNumber ?? string.Empty,
                BedNumber = a.BedNumber ?? string.Empty,
                AssignedSupervisor = w?.WardenName ?? string.Empty,
                WardenName = w?.WardenName ?? string.Empty,
                JoiningDate = a.JoiningDate?.ToString("yyyy-MM-dd") ?? a.CreatedAt?.ToString("yyyy-MM-dd") ?? string.Empty,
                Status = a.Status ?? "Active"
            };
        }).ToList();

        if (!string.IsNullOrWhiteSpace(search))
            studentList = studentList.Where(x => x.StudentName.ToLower().Contains(search) || x.AdmissionNo.ToLower().Contains(search) || x.HostelName.ToLower().Contains(search)).ToList();

        return studentList;
    }

    // --- MAPPER HELPERS ---
    private static HostelBlockDto MapToHostelBlockDto(HostelBlock b)
    {
        int totalCapacity = b.Rooms?.Sum(r => r.RoomType?.BedCapacity ?? 0) ?? 0;
        int activeOccupied = b.Allocations?.Count(a => a.Status == "Active") ?? 0;

        return new HostelBlockDto
        {
            HostelId = b.HostelId,
            HostelName = b.HostelName ?? "",
            HostelCode = b.HostelCode ?? "",
            HostelType = b.HostelType ?? "",
            TotalFloors = b.TotalFloors > 0 ? b.TotalFloors : 1,
            WardenName = b.WardenName,
            PrimaryMobileNumber = b.PrimaryMobileNumber,
            AlternateMobileNumber = b.AlternateMobileNumber,
            Email = b.Email,
            Status = b.Status ?? "",
            Address = b.Address,
            CreatedAt = b.CreatedAt ?? DateTime.UtcNow,
            TotalRooms = b.Rooms?.Count ?? 0,
            OccupiedBeds = activeOccupied,
            TotalCapacity = totalCapacity
        };
    }

    private static RoomTypeConfigDto MapToRoomTypeConfigDto(RoomTypeConfig r) => new()
    {
        RoomTypeId = r.RoomTypeId,
        RoomTypeSpecification = r.RoomTypeSpecification ?? "",
        BedCapacity = r.BedCapacity,
        AcType = r.AcType ?? "",
        Status = r.Status ?? "",
        Description = r.Description,
        CreatedAt = r.CreatedAt ?? DateTime.UtcNow
    };

    private static RoomMasterDto MapToRoomMasterDto(RoomMaster r)
    {
        int capacity = r.RoomType?.BedCapacity ?? 1;
        int occupied = r.Allocations?.Count(a => a.Status == "Active") ?? 0;
        int vacant = Math.Max(0, capacity - occupied);

        return new RoomMasterDto
        {
            RoomId = r.RoomId,
            HostelId = r.HostelId,
            HostelName = r.Hostel?.HostelName ?? string.Empty,
            HostelCode = r.Hostel?.HostelCode ?? string.Empty,
            RoomTypeId = r.RoomTypeId,
            RoomTypeSpecification = r.RoomType?.RoomTypeSpecification ?? string.Empty,
            BedCapacity = capacity,
            FloorLevel = r.FloorLevel ?? "",
            RoomNumber = r.RoomNumber ?? "",
            Status = r.Status ?? "",
            OccupiedBeds = occupied,
            VacantBeds = vacant,
            CreatedAt = r.CreatedAt ?? DateTime.UtcNow
        };
    }

    private static HostelWardenDto MapToHostelWardenDto(HostelWarden w) => new()
    {
        WardenId = w.WardenId,
        HostelId = w.HostelId,
        HostelName = w.Hostel?.HostelName ?? string.Empty,
        StaffId = w.StaffId,
        EmployeeId = w.Staff?.EmployeeId,
        WardenName = w.Staff != null ? $"{w.Staff.FirstName} {w.Staff.LastName}".Trim() : (w.WardenName ?? ""),
        MobileNumber = !string.IsNullOrWhiteSpace(w.MobileNumber) ? w.MobileNumber : (w.Staff?.Phone ?? string.Empty),
        AlternateMobile = w.AlternateMobile,
        EmailAddress = !string.IsNullOrWhiteSpace(w.EmailAddress) ? w.EmailAddress : (w.Staff?.Email ?? string.Empty),
        CreatedAt = w.CreatedAt ?? DateTime.UtcNow
    };

    private static BedAllocationDto MapToBedAllocationDto(StudentBedAllocation a) => new()
    {
        AllocationId = a.AllocationId,
        StudentId = a.StudentId ?? 0,
        StudentName = !string.IsNullOrWhiteSpace(a.StudentName) ? a.StudentName : (a.Student != null ? $"{a.Student.FirstName} {a.Student.LastName}" : string.Empty),
        AdmissionNo = !string.IsNullOrWhiteSpace(a.RegistrationNo) ? a.RegistrationNo : (a.Student?.RegistrationNo ?? string.Empty),
        ClassName = a.Student?.AppliedClass?.ClassName ?? string.Empty,
        HostelId = a.HostelId,
        HostelName = a.Hostel?.HostelName ?? string.Empty,
        RoomId = a.RoomId,
        RoomNumber = a.Room?.RoomNumber ?? string.Empty,
        FloorLevel = a.Room?.FloorLevel ?? string.Empty,
        BedNumber = a.BedNumber ?? "",
        JoiningDate = a.JoiningDate ?? DateTime.UtcNow,
        Status = a.Status ?? "",
        CurfewStatus = a.AttendanceRecords?.OrderByDescending(att => att.Date).FirstOrDefault()?.CurfewStatus ?? "Present",
        CreatedAt = a.CreatedAt ?? DateTime.UtcNow
    };

    // --- OUTPASSES & LEAVE REQUESTS ---
    public async Task<List<HostelOutpassDto>> GetAllOutpassesAsync(string? search, string? status)
    {
        var list = await _hostelRepo.GetAllOutpassesAsync(search, status);
        return list.Select(MapToHostelOutpassDto).ToList();
    }

    public async Task<HostelOutpassDto> CreateOutpassAsync(CreateHostelOutpassDto dto)
    {
        StudentBedAllocation? activeAlloc = null;
        if (dto.StudentId > 0)
        {
            activeAlloc = await _hostelRepo.GetActiveAllocationByStudentIdAsync(dto.StudentId);
        }

        if (activeAlloc == null)
        {
            var allAlloc = await _hostelRepo.GetAllBedAllocationsAsync(null, null, null);
            if (!string.IsNullOrWhiteSpace(dto.StudentName))
            {
                activeAlloc = allAlloc.FirstOrDefault(a => a.StudentName != null && a.StudentName.Contains(dto.StudentName.Trim(), StringComparison.OrdinalIgnoreCase));
            }
            if (activeAlloc == null) activeAlloc = allAlloc.FirstOrDefault();
        }

        var outpass = new HostelOutpass
        {
            StudentId = activeAlloc?.StudentId ?? dto.StudentId,
            StudentName = !string.IsNullOrWhiteSpace(dto.StudentName) ? dto.StudentName.Trim() : (activeAlloc?.StudentName ?? "Hostel Student"),
            AdmissionNo = activeAlloc?.RegistrationNo ?? "ADM-001",
            HostelName = activeAlloc?.Hostel?.HostelName ?? "Main Hostel",
            RoomNumber = activeAlloc?.Room?.RoomNumber ?? "101",
            RequestType = string.IsNullOrWhiteSpace(dto.RequestType) ? "Local Outpass (Same Day)" : dto.RequestType.Trim(),
            Reason = dto.Reason?.Trim(),
            OutDate = dto.OutDate,
            ExpectedReturnDate = dto.ExpectedReturnDate,
            Status = "Pending Approval",
            CreatedAt = DateTime.UtcNow
        };

        await _hostelRepo.AddOutpassAsync(outpass);
        await _hostelRepo.SaveChangesAsync();
        return MapToHostelOutpassDto(outpass);
    }

    public async Task<HostelOutpassDto> UpdateOutpassStatusAsync(int id, string status, string? approvedBy, string? remarks)
    {
        var outpass = await _hostelRepo.GetOutpassByIdAsync(id)
            ?? throw new NotFoundException($"Outpass with ID '{id}' not found.");

        outpass.Status = status.Trim();
        if (!string.IsNullOrWhiteSpace(approvedBy)) outpass.ApprovedBy = approvedBy.Trim();
        if (!string.IsNullOrWhiteSpace(remarks)) outpass.Remarks = remarks.Trim();

        if (status.Equals("Completed", StringComparison.OrdinalIgnoreCase))
        {
            outpass.ActualReturnDate = DateTime.UtcNow;
        }

        await _hostelRepo.SaveChangesAsync();
        return MapToHostelOutpassDto(outpass);
    }

    public async Task<bool> DeleteOutpassAsync(int id)
    {
        var outpass = await _hostelRepo.GetOutpassByIdAsync(id)
            ?? throw new NotFoundException($"Outpass request with ID '{id}' not found.");

        _hostelRepo.RemoveOutpass(outpass);
        await _hostelRepo.SaveChangesAsync();
        return true;
    }

    private static HostelOutpassDto MapToHostelOutpassDto(HostelOutpass o) => new()
    {
        Id = o.OutpassId,
        StudentId = o.StudentId,
        StudentName = o.StudentName ?? string.Empty,
        AdmissionNo = o.AdmissionNo,
        HostelName = o.HostelName,
        RoomNumber = o.RoomNumber,
        RequestType = o.RequestType,
        Reason = o.Reason,
        OutDate = o.OutDate,
        ExpectedReturnDate = o.ExpectedReturnDate,
        ActualReturnDate = o.ActualReturnDate,
        Status = o.Status,
        ApprovedBy = o.ApprovedBy,
        Remarks = o.Remarks,
        CreatedAt = o.CreatedAt
    };

    // --- TRANSFER & VACATE REQUESTS ---
    public async Task<List<HostelTransferVacateDto>> GetAllTransferVacateRequestsAsync(string? search, string? actionType)
    {
        var list = await _hostelRepo.GetAllTransferVacateRequestsAsync(search, actionType);
        return list.Select(MapToHostelTransferVacateDto).ToList();
    }

    public async Task<HostelTransferVacateDto> CreateTransferVacateRequestAsync(CreateHostelTransferVacateDto dto)
    {
        StudentBedAllocation? activeAlloc = null;
        if (dto.StudentId > 0)
        {
            activeAlloc = await _hostelRepo.GetActiveAllocationByStudentIdAsync(dto.StudentId);
        }

        if (activeAlloc == null)
        {
            var allAlloc = await _hostelRepo.GetAllBedAllocationsAsync(null, null, null);
            if (!string.IsNullOrWhiteSpace(dto.StudentName))
            {
                activeAlloc = allAlloc.FirstOrDefault(a => a.StudentName != null && a.StudentName.Contains(dto.StudentName.Trim(), StringComparison.OrdinalIgnoreCase));
            }
            if (activeAlloc == null) activeAlloc = allAlloc.FirstOrDefault();
        }

        string actionType = string.IsNullOrWhiteSpace(dto.ActionType)
            ? "Room Transfer"
            : (dto.ActionType.Contains("Vacate", StringComparison.OrdinalIgnoreCase) ? "Bed Vacate" : "Room Transfer");

        var req = new HostelTransferVacate
        {
            StudentId = activeAlloc?.StudentId ?? dto.StudentId,
            StudentName = !string.IsNullOrWhiteSpace(dto.StudentName) ? dto.StudentName.Trim() : (activeAlloc?.StudentName ?? "Resident Student"),
            AdmissionNo = activeAlloc?.RegistrationNo ?? "ADM-001",
            ActionType = actionType,
            CurrentRoom = (activeAlloc?.Hostel != null && activeAlloc?.Room != null)
                ? $"{activeAlloc.Hostel.HostelName} - Room #{activeAlloc.Room.RoomNumber}"
                : "Main Block - Room #101",
            DestinationHostelId = dto.DestinationHostelId,
            DestinationHostelName = dto.DestinationHostelName ?? "Boys Residence - Block A",
            DestinationRoomId = dto.DestinationRoomId,
            DestinationRoomNumber = dto.DestinationRoomNumber ?? "201",
            DestinationBedNumber = dto.DestinationBedNumber ?? "Bed #1",
            Reason = dto.Reason?.Trim(),
            Status = "Approved",
            CreatedAt = DateTime.UtcNow
        };

        if (actionType.Equals("Bed Vacate", StringComparison.OrdinalIgnoreCase) && activeAlloc != null)
        {
            activeAlloc.Status = "Vacated";
        }

        await _hostelRepo.AddTransferVacateRequestAsync(req);
        await _hostelRepo.SaveChangesAsync();
        return MapToHostelTransferVacateDto(req);
    }

    public async Task<bool> DeleteTransferVacateRequestAsync(int id)
    {
        var req = await _hostelRepo.GetTransferVacateRequestByIdAsync(id)
            ?? throw new NotFoundException($"Transfer/vacate request with ID '{id}' not found.");

        _hostelRepo.RemoveTransferVacateRequest(req);
        await _hostelRepo.SaveChangesAsync();
        return true;
    }

    private static HostelTransferVacateDto MapToHostelTransferVacateDto(HostelTransferVacate t) => new()
    {
        Id = t.Id,
        StudentId = t.StudentId,
        StudentName = t.StudentName ?? string.Empty,
        AdmissionNo = t.AdmissionNo,
        ActionType = t.ActionType ?? "Room Transfer",
        CurrentRoom = t.CurrentRoom,
        DestinationHostelId = t.DestinationHostelId,
        DestinationHostelName = t.DestinationHostelName,
        DestinationRoomId = t.DestinationRoomId,
        DestinationRoomNumber = t.DestinationRoomNumber,
        DestinationBedNumber = t.DestinationBedNumber,
        Reason = t.Reason,
        Status = t.Status ?? "Approved",
        CreatedAt = t.CreatedAt
    };
}
