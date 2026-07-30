namespace SMS.Api.Repositories.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class HostelRepository : IHostelRepository
{
    private readonly AppDbContext _context;

    public HostelRepository(AppDbContext context)
    {
        _context = context;
    }

    // --- DASHBOARD AGGREGATES ---
    public async Task<int> GetHostelCountAsync() =>
        await _context.HostelBlocks.CountAsync();

    public async Task<int> GetRoomCountAsync() =>
        await _context.RoomMasters.CountAsync();

    public async Task<int> GetTotalBedCapacityAsync() =>
        await _context.RoomTypeConfigs.SumAsync(r => (int?)r.BedCapacity) ?? 0;

    public async Task<int> GetActiveOccupiedBedCountAsync() =>
        await _context.StudentBedAllocations.CountAsync(a => a.Status == "Active");

    // --- HOSTEL BLOCKS ---
    public async Task<List<HostelBlock>> GetAllHostelBlocksAsync(string? search, string? type)
    {
        var query = _context.HostelBlocks
            .Include(h => h.Rooms).ThenInclude(r => r.RoomType)
            .Include(h => h.Wardens)
            .Include(h => h.Allocations)
            .AsNoTracking()
            .AsSplitQuery()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("All Hostel Types", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(h => h.HostelType != null && h.HostelType.ToLower() == type.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.ToLower();
            query = query.Where(h => (h.HostelName != null && h.HostelName.ToLower().Contains(q)) ||
                                     (h.HostelCode != null && h.HostelCode.ToLower().Contains(q)) ||
                                     (h.WardenName != null && h.WardenName.ToLower().Contains(q)));
        }

        return await query.OrderBy(h => h.HostelName).ToListAsync();
    }

    public async Task<HostelBlock?> GetHostelBlockByIdAsync(int hostelId) =>
        await _context.HostelBlocks
            .Include(h => h.Rooms).ThenInclude(r => r.RoomType)
            .Include(h => h.Wardens)
            .Include(h => h.Allocations)
            .FirstOrDefaultAsync(h => h.HostelId == hostelId);

    public async Task AddHostelBlockAsync(HostelBlock block) => await _context.HostelBlocks.AddAsync(block);

    public void RemoveHostelBlock(HostelBlock block) => _context.HostelBlocks.Remove(block);

    // --- ROOM TYPES ---
    public async Task<List<RoomTypeConfig>> GetAllRoomTypeConfigsAsync(string? search)
    {
        var query = _context.RoomTypeConfigs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.ToLower();
            query = query.Where(r => (r.RoomTypeSpecification != null && r.RoomTypeSpecification.ToLower().Contains(q)) ||
                                     (r.AcType != null && r.AcType.ToLower().Contains(q)));
        }

        return await query.OrderBy(r => r.RoomTypeSpecification).ToListAsync();
    }

    public async Task<RoomTypeConfig?> GetRoomTypeConfigByIdAsync(int roomTypeId) =>
        await _context.RoomTypeConfigs.FirstOrDefaultAsync(r => r.RoomTypeId == roomTypeId);

    public async Task AddRoomTypeConfigAsync(RoomTypeConfig config) => await _context.RoomTypeConfigs.AddAsync(config);

    public void RemoveRoomTypeConfig(RoomTypeConfig config) => _context.RoomTypeConfigs.Remove(config);

    // --- ROOMS ---
    public async Task<List<RoomMaster>> GetAllRoomsAsync(int? hostelId, string? floor, int? roomTypeId, string? search)
    {
        var query = _context.RoomMasters
            .Include(r => r.Hostel)
            .Include(r => r.RoomType)
            .Include(r => r.Allocations.Where(a => a.Status == "Active"))
            .AsNoTracking()
            .AsQueryable();

        if (hostelId.HasValue && hostelId.Value > 0)
            query = query.Where(r => r.HostelId == hostelId.Value);

        if (!string.IsNullOrWhiteSpace(floor) && !floor.Equals("All Floors", StringComparison.OrdinalIgnoreCase))
            query = query.Where(r => r.FloorLevel != null && r.FloorLevel.ToLower() == floor.ToLower());

        if (roomTypeId.HasValue && roomTypeId.Value > 0)
            query = query.Where(r => r.RoomTypeId == roomTypeId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.ToLower();
            query = query.Where(r => (r.RoomNumber != null && r.RoomNumber.ToLower().Contains(q)) ||
                                     (r.FloorLevel != null && r.FloorLevel.ToLower().Contains(q)) ||
                                     (r.Hostel != null && r.Hostel.HostelName != null && r.Hostel.HostelName.ToLower().Contains(q)));
        }

        return await query.OrderBy(r => r.RoomNumber).ToListAsync();
    }

    public async Task<RoomMaster?> GetRoomByIdAsync(int roomId) =>
        await _context.RoomMasters
            .Include(r => r.Hostel)
            .Include(r => r.RoomType)
            .Include(r => r.Allocations.Where(a => a.Status == "Active"))
            .FirstOrDefaultAsync(r => r.RoomId == roomId);

    public async Task AddRoomAsync(RoomMaster room) => await _context.RoomMasters.AddAsync(room);

    public void RemoveRoom(RoomMaster room) => _context.RoomMasters.Remove(room);

    // --- WARDENS ---
    public async Task<List<HostelWarden>> GetAllWardensAsync(int? hostelId, string? search)
    {
        var query = _context.HostelWardens
            .Include(w => w.Hostel)
            .Include(w => w.Staff)
            .AsNoTracking()
            .AsQueryable();

        if (hostelId.HasValue && hostelId.Value > 0)
            query = query.Where(w => w.HostelId == hostelId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.ToLower();
            query = query.Where(w => (w.WardenName != null && w.WardenName.ToLower().Contains(q)) ||
                                     (w.MobileNumber != null && w.MobileNumber.ToLower().Contains(q)) ||
                                     (w.Staff != null && ((w.Staff.FirstName != null && w.Staff.FirstName.ToLower().Contains(q)) || (w.Staff.LastName != null && w.Staff.LastName.ToLower().Contains(q)) || (w.Staff.EmployeeId != null && w.Staff.EmployeeId.ToLower().Contains(q)))) ||
                                     (w.Hostel != null && w.Hostel.HostelName != null && w.Hostel.HostelName.ToLower().Contains(q)));
        }

        return await query.OrderBy(w => w.WardenName).ToListAsync();
    }

    public async Task<HostelWarden?> GetWardenByIdAsync(int wardenId) =>
        await _context.HostelWardens
            .Include(w => w.Hostel)
            .Include(w => w.Staff)
            .FirstOrDefaultAsync(w => w.WardenId == wardenId);

    public async Task AddWardenAsync(HostelWarden warden) => await _context.HostelWardens.AddAsync(warden);

    public void RemoveWarden(HostelWarden warden) => _context.HostelWardens.Remove(warden);

    // --- BED ALLOCATIONS ---
    public async Task<List<StudentBedAllocation>> GetAllBedAllocationsAsync(int? hostelId, int? roomId, string? search)
    {
        var query = _context.StudentBedAllocations
            .Include(a => a.Student!).ThenInclude(s => s.AppliedClass)
            .Include(a => a.Hostel)
            .Include(a => a.Room!).ThenInclude(r => r.RoomType)
            .Include(a => a.AttendanceRecords)
            .AsNoTracking()
            .AsSplitQuery()
            .AsQueryable();

        if (hostelId.HasValue && hostelId.Value > 0)
            query = query.Where(a => a.HostelId == hostelId.Value);

        if (roomId.HasValue && roomId.Value > 0)
            query = query.Where(a => a.RoomId == roomId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.ToLower();
            query = query.Where(a => (a.Student != null && ((a.Student.FirstName != null && a.Student.FirstName.ToLower().Contains(q)) || (a.Student.LastName != null && a.Student.LastName.ToLower().Contains(q)) || (a.Student.RegistrationNo != null && a.Student.RegistrationNo.ToLower().Contains(q)))) ||
                                     (a.RegistrationNo != null && a.RegistrationNo.ToLower().Contains(q)) ||
                                     (a.StudentName != null && a.StudentName.ToLower().Contains(q)) ||
                                     (a.BedNumber != null && a.BedNumber.ToLower().Contains(q)) ||
                                     (a.Room != null && a.Room.RoomNumber != null && a.Room.RoomNumber.ToLower().Contains(q)));
        }

        return await query.OrderByDescending(a => a.JoiningDate).ToListAsync();
    }

    public async Task<StudentBedAllocation?> GetBedAllocationByIdAsync(int allocationId) =>
        await _context.StudentBedAllocations
            .Include(a => a.Student!).ThenInclude(s => s.AppliedClass)
            .Include(a => a.Hostel)
            .Include(a => a.Room!).ThenInclude(r => r.RoomType)
            .Include(a => a.AttendanceRecords)
            .FirstOrDefaultAsync(a => a.AllocationId == allocationId);

    public async Task<StudentBedAllocation?> GetActiveAllocationByStudentIdAsync(int studentId) =>
        await _context.StudentBedAllocations
            .FirstOrDefaultAsync(a => a.StudentId == studentId && a.Status == "Active");

    public async Task<int> GetOccupiedBedCountForRoomAsync(int roomId) =>
        await _context.StudentBedAllocations.CountAsync(a => a.RoomId == roomId && a.Status == "Active");

    public async Task AddBedAllocationAsync(StudentBedAllocation allocation) =>
        await _context.StudentBedAllocations.AddAsync(allocation);

    // --- ATTENDANCE ---
    public async Task<List<HostelAttendance>> GetAttendanceForDateAsync(DateTime date, int? hostelId, string? floor, int? roomId)
    {
        var query = _context.HostelAttendances
            .Include(att => att.Allocation!).ThenInclude(al => al.Student)
            .Include(att => att.Allocation!).ThenInclude(al => al.Hostel)
            .Include(att => att.Allocation!).ThenInclude(al => al.Room)
            .AsNoTracking()
            .Where(att => att.Date.HasValue && att.Date.Value.Date == date.Date)
            .AsQueryable();

        if (hostelId.HasValue && hostelId.Value > 0)
            query = query.Where(att => att.Allocation != null && att.Allocation.HostelId == hostelId.Value);

        if (!string.IsNullOrWhiteSpace(floor) && !floor.Equals("All Floors", StringComparison.OrdinalIgnoreCase))
            query = query.Where(att => att.Allocation != null && att.Allocation.Room != null && att.Allocation.Room.FloorLevel != null && att.Allocation.Room.FloorLevel.ToLower() == floor.ToLower());

        if (roomId.HasValue && roomId.Value > 0)
            query = query.Where(att => att.Allocation != null && att.Allocation.RoomId == roomId.Value);

        return await query.ToListAsync();
    }

    public async Task AddAttendanceRangeAsync(IEnumerable<HostelAttendance> records) =>
        await _context.HostelAttendances.AddRangeAsync(records);

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}
