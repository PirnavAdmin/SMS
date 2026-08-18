namespace SMS.Api.Repositories.Interfaces;

using SMS.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IHostelRepository
{
    // Dashboard Aggregate Metrics
    Task<int> GetHostelCountAsync();
    Task<int> GetRoomCountAsync();
    Task<int> GetTotalBedCapacityAsync();
    Task<int> GetActiveOccupiedBedCountAsync();

    // Hostel Blocks
    Task<List<HostelBlock>> GetAllHostelBlocksAsync(string? search, string? type);
    Task<HostelBlock?> GetHostelBlockByIdAsync(int hostelId);
    Task AddHostelBlockAsync(HostelBlock block);
    void RemoveHostelBlock(HostelBlock block);

    // Room Types
    Task<List<RoomTypeConfig>> GetAllRoomTypeConfigsAsync(string? search);
    Task<RoomTypeConfig?> GetRoomTypeConfigByIdAsync(int roomTypeId);
    Task AddRoomTypeConfigAsync(RoomTypeConfig config);
    void RemoveRoomTypeConfig(RoomTypeConfig config);

    // Rooms
    Task<List<RoomMaster>> GetAllRoomsAsync(int? hostelId, string? floor, int? roomTypeId, string? search);
    Task<RoomMaster?> GetRoomByIdAsync(int roomId);
    Task AddRoomAsync(RoomMaster room);
    void RemoveRoom(RoomMaster room);

    // Wardens
    Task<List<HostelWarden>> GetAllWardensAsync(int? hostelId, string? search);
    Task<HostelWarden?> GetWardenByIdAsync(int wardenId);
    Task AddWardenAsync(HostelWarden warden);
    void RemoveWarden(HostelWarden warden);

    // Bed Allocations
    Task<List<StudentBedAllocation>> GetAllBedAllocationsAsync(int? hostelId, int? roomId, string? search);
    Task<StudentBedAllocation?> GetBedAllocationByIdAsync(int allocationId);
    Task<StudentBedAllocation?> GetActiveAllocationByStudentIdAsync(int studentId);
    Task<int> GetOccupiedBedCountForRoomAsync(int roomId);
    Task AddBedAllocationAsync(StudentBedAllocation allocation);

    // Attendance
    Task<List<HostelAttendance>> GetAttendanceForDateAsync(DateTime date, int? hostelId, string? floor, int? roomId);
    Task AddAttendanceRangeAsync(IEnumerable<HostelAttendance> records);

    // Outpasses & Leave Requests
    Task<int> GetActiveWardenCountAsync();
    Task<List<StudentBedAllocation>> GetRecentBedAllocationsAsync(int count = 5);
    Task<List<HostelOutpass>> GetActiveOutpassesAsync(int count = 5);
    Task<List<HostelOutpass>> GetAllOutpassesAsync(string? search, string? status);
    Task<HostelOutpass?> GetOutpassByIdAsync(int id);
    Task AddOutpassAsync(HostelOutpass outpass);
    void RemoveOutpass(HostelOutpass outpass);
    void RemoveBedAllocation(StudentBedAllocation allocation);

    // Transfer & Vacate Requests
    Task<List<HostelTransferVacate>> GetAllTransferVacateRequestsAsync(string? search, string? actionType);
    Task<HostelTransferVacate?> GetTransferVacateRequestByIdAsync(int id);
    Task AddTransferVacateRequestAsync(HostelTransferVacate request);
    void RemoveTransferVacateRequest(HostelTransferVacate request);

    Task SaveChangesAsync();
}
