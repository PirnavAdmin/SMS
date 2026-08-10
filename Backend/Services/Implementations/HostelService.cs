namespace SMS.Api.Services.Implementations;

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

    public HostelService(IHostelRepository hostelRepo, ISchoolRepository schoolRepo)
    {
        _hostelRepo = hostelRepo;
        _schoolRepo = schoolRepo;
    }

    // --- DASHBOARD METRICS ---
    public async Task<HostelDashboardMetricsDto> GetExecutiveDashboardMetricsAsync()
    {
        int totalHostels = await _hostelRepo.GetHostelCountAsync();
        int totalRooms = await _hostelRepo.GetRoomCountAsync();
        int totalBedCapacity = await _hostelRepo.GetTotalBedCapacityAsync();
        int activeOccupiedBeds = await _hostelRepo.GetActiveOccupiedBedCountAsync();
        int availableVacantBeds = Math.Max(0, totalBedCapacity - activeOccupiedBeds);
        int enrolledHostellers = activeOccupiedBeds;

        decimal estMonthlyRevenue = activeOccupiedBeds * 7500m;
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
            OccupancyPercentage = occupancyPercentage
        };
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

        block.HostelName = dto.HostelName.Trim();
        block.HostelCode = dto.HostelCode.Trim();
        block.HostelType = dto.HostelType.Trim();
        block.WardenName = dto.WardenName?.Trim();
        block.PrimaryMobileNumber = dto.PrimaryMobileNumber?.Trim();
        block.AlternateMobileNumber = dto.AlternateMobileNumber?.Trim();
        block.Email = dto.Email?.Trim();
        block.Status = dto.Status.Trim();
        block.Address = dto.Address?.Trim();

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
        var hostel = await _hostelRepo.GetHostelBlockByIdAsync(dto.HostelId)
            ?? throw new InvalidOperationException($"Hostel Block with ID '{dto.HostelId}' does not exist.");

        var roomType = await _hostelRepo.GetRoomTypeConfigByIdAsync(dto.RoomTypeId)
            ?? throw new InvalidOperationException($"Room Type with ID '{dto.RoomTypeId}' does not exist.");

        if (string.IsNullOrWhiteSpace(dto.RoomNumber))
            throw new InvalidOperationException("Room Number is required.");

        var room = new RoomMaster
        {
            HostelId = dto.HostelId,
            RoomTypeId = dto.RoomTypeId,
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

        room.HostelId = dto.HostelId;
        room.RoomTypeId = dto.RoomTypeId;
        room.FloorLevel = dto.FloorLevel.Trim();
        room.RoomNumber = dto.RoomNumber.Trim();
        room.Status = dto.Status.Trim();

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
        var hostel = await _hostelRepo.GetHostelBlockByIdAsync(dto.HostelId)
            ?? throw new InvalidOperationException($"Hostel Block with ID '{dto.HostelId}' does not exist.");

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
            throw new InvalidOperationException("Warden / Staff Name is required.");

        string mobileNumber = dto.MobileNumber?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(mobileNumber) && staff != null)
            mobileNumber = staff.Phone ?? string.Empty;

        if (string.IsNullOrWhiteSpace(mobileNumber))
            throw new InvalidOperationException("Mobile Number is required.");

        string? emailAddress = dto.EmailAddress?.Trim();
        if (string.IsNullOrWhiteSpace(emailAddress) && staff != null)
            emailAddress = staff.Email;

        var warden = new HostelWarden
        {
            HostelId = dto.HostelId,
            StaffId = staff?.StaffId,
            WardenName = wardenName,
            MobileNumber = mobileNumber,
            AlternateMobile = dto.AlternateMobile?.Trim(),
            EmailAddress = emailAddress,
            BlockName = dto.BlockName?.Trim(),
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

    // --- BED ALLOCATIONS ---
    public async Task<List<BedAllocationDto>> GetAllBedAllocationsAsync(int? hostelId, int? roomId, string? search)
    {
        var allocations = await _hostelRepo.GetAllBedAllocationsAsync(hostelId, roomId, search);
        return allocations.Select(MapToBedAllocationDto).ToList();
    }

    public async Task<BedAllocationDto> AllocateBedAsync(CreateBedAllocationDto dto)
    {
        AdmissionApplication? student = null;
        if (dto.StudentId > 0)
        {
            student = await _schoolRepo.GetApplicationByIdAsync(dto.StudentId);
        }
        else if (!string.IsNullOrWhiteSpace(dto.AdmissionNo))
        {
            var apps = await _schoolRepo.GetAllApplicationsAsync(dto.AdmissionNo.Trim(), null, null, null);
            student = apps.FirstOrDefault();
        }
        else if (!string.IsNullOrWhiteSpace(dto.StudentName))
        {
            var apps = await _schoolRepo.GetAllApplicationsAsync(dto.StudentName.Trim(), null, null, null);
            student = apps.FirstOrDefault();
        }

        if (student == null)
        {
            var apps = await _schoolRepo.GetAllApplicationsAsync(null, null, null, null);
            student = apps.FirstOrDefault()
                ?? throw new InvalidOperationException($"No student application found to allocate bed.");
        }

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
            var blocks = await _hostelRepo.GetAllHostelBlocksAsync(null, null);
            hostel = blocks.FirstOrDefault();
            if (hostel == null)
            {
                hostel = new HostelBlock { HostelName = !string.IsNullOrWhiteSpace(dto.HostelName) ? dto.HostelName.Trim() : "Main Block", HostelCode = "HST-01", HostelType = "Boys Hostel", Status = "Active" };
                await _hostelRepo.AddHostelBlockAsync(hostel);
                await _hostelRepo.SaveChangesAsync();
            }
        }

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
            var rooms = await _hostelRepo.GetAllRoomsAsync(hostel.HostelId, null, null, null);
            room = rooms.FirstOrDefault();
            if (room == null)
            {
                var roomTypes = await _hostelRepo.GetAllRoomTypeConfigsAsync(null);
                var roomType = roomTypes.FirstOrDefault();
                if (roomType == null)
                {
                    roomType = new RoomTypeConfig { RoomTypeSpecification = "Standard Room", BedCapacity = 4, AcType = "AC", Status = "Active" };
                    await _hostelRepo.AddRoomTypeConfigAsync(roomType);
                    await _hostelRepo.SaveChangesAsync();
                }

                room = new RoomMaster
                {
                    HostelId = hostel.HostelId,
                    RoomTypeId = roomType.RoomTypeId,
                    RoomNumber = !string.IsNullOrWhiteSpace(dto.RoomNumber) ? dto.RoomNumber.Trim() : "Room 101",
                    FloorLevel = "1st Floor",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };
                await _hostelRepo.AddRoomAsync(room);
                await _hostelRepo.SaveChangesAsync();
            }
        }

        int roomCapacity = room.RoomType?.BedCapacity ?? 1;
        int currentOccupied = await _hostelRepo.GetOccupiedBedCountForRoomAsync(room.RoomId);

        var activeAlloc = await _hostelRepo.GetActiveAllocationByStudentIdAsync(student.Id);
        if (currentOccupied >= roomCapacity)
        {
            var existing = await _hostelRepo.GetActiveAllocationByStudentIdAsync(student.Id);
            if (existing == null || existing.RoomId != room.RoomId)
                throw new InvalidOperationException($"Room #{room.RoomNumber} has reached maximum bed capacity ({roomCapacity} beds). Cannot allocate additional beds.");
        }

        string bedNo = !string.IsNullOrWhiteSpace(dto.BedNumber) ? dto.BedNumber.Trim() : $"Bed #{currentOccupied + 1}";
        string regNo = student.RegistrationNo ?? string.Empty;
        string stName = $"{student.FirstName} {student.LastName}".Trim();

        if (activeAlloc != null)
        {
            activeAlloc.RegistrationNo = regNo;
            activeAlloc.StudentName = stName;
            activeAlloc.HostelId = hostel.HostelId;
            activeAlloc.RoomId = room.RoomId;
            activeAlloc.BedNumber = bedNo;
            activeAlloc.JoiningDate = dto.JoiningDate != default ? dto.JoiningDate : DateTime.UtcNow;
            await _hostelRepo.SaveChangesAsync();

            var updated = await _hostelRepo.GetBedAllocationByIdAsync(activeAlloc.AllocationId);
            return MapToBedAllocationDto(updated ?? activeAlloc);
        }

        var allocation = new StudentBedAllocation
        {
            StudentId = student.Id,
            RegistrationNo = regNo,
            StudentName = stName,
            HostelId = hostel.HostelId,
            RoomId = room.RoomId,
            BedNumber = bedNo,
            JoiningDate = dto.JoiningDate != default ? dto.JoiningDate : DateTime.UtcNow,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        await _hostelRepo.AddBedAllocationAsync(allocation);
        await _hostelRepo.SaveChangesAsync();

        var created = await _hostelRepo.GetBedAllocationByIdAsync(allocation.AllocationId);
        return MapToBedAllocationDto(created ?? allocation);
    }

    public async Task<bool> VacateBedAsync(int allocationId)
    {
        var alloc = await _hostelRepo.GetBedAllocationByIdAsync(allocationId)
            ?? throw new NotFoundException($"Bed Allocation with ID '{allocationId}' not found.");

        alloc.Status = "Vacated";
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

        var existing = await _hostelRepo.GetAttendanceForDateAsync(dto.Date, dto.HostelId, dto.FloorLevel, dto.RoomId);
        var existingDict = existing.ToDictionary(e => e.AllocationId);

        var newRecords = new List<HostelAttendance>();
        foreach (var rec in dto.Records)
        {
            if (existingDict.TryGetValue(rec.AllocationId, out var attRecord))
            {
                attRecord.CurfewStatus = string.IsNullOrWhiteSpace(rec.CurfewStatus) ? "Present" : rec.CurfewStatus.Trim();
                attRecord.Remarks = rec.Remarks?.Trim();
            }
            else
            {
                newRecords.Add(new HostelAttendance
                {
                    AllocationId = rec.AllocationId,
                    Date = dto.Date.Date,
                    CurfewStatus = string.IsNullOrWhiteSpace(rec.CurfewStatus) ? "Present" : rec.CurfewStatus.Trim(),
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
                AdmissionNo = !string.IsNullOrWhiteSpace(a.RegistrationNo) ? a.RegistrationNo : (a.Student?.RegistrationNo ?? "ADM2024-002"),
                StudentName = !string.IsNullOrWhiteSpace(a.StudentName) ? a.StudentName : (a.Student != null ? $"{a.Student.FirstName} {a.Student.LastName}" : "Sophia Montgomery"),
                ClassSection = a.Student?.AppliedClass?.ClassName ?? "Class 10 - A",
                HostelName = a.Hostel?.HostelName ?? "Girls Excellence Residence Block B",
                BlockName = w?.BlockName ?? "Block A",
                FloorLevel = a.Room?.FloorLevel ?? "1st Floor",
                RoomNumber = a.Room?.RoomNumber ?? "201",
                BedNumber = a.BedNumber ?? "BED-1",
                AssignedSupervisor = w?.WardenName ?? "Robert Langdon",
                WardenName = w?.WardenName ?? "Marcus Vance",
                JoiningDate = a.JoiningDate?.ToString("yyyy-MM-dd") ?? a.CreatedAt?.ToString("yyyy-MM-dd") ?? "2026-06-01",
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
}
