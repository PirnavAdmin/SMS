namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IHostelService
{
    // Dashboard & Metrics
    Task<HostelDashboardMetricsDto> GetExecutiveDashboardMetricsAsync();

    // Hostel Blocks
    Task<List<HostelBlockDto>> GetAllHostelBlocksAsync(string? search, string? type);
    Task<HostelBlockDto> GetHostelBlockByIdAsync(int hostelId);
    Task<HostelBlockDto> CreateHostelBlockAsync(CreateHostelBlockDto dto);
    Task<HostelBlockDto> UpdateHostelBlockAsync(int hostelId, CreateHostelBlockDto dto);
    Task<bool> DeleteHostelBlockAsync(int hostelId);

    // Room Types
    Task<List<RoomTypeConfigDto>> GetAllRoomTypeConfigsAsync(string? search);
    Task<RoomTypeConfigDto> GetRoomTypeConfigByIdAsync(int roomTypeId);
    Task<RoomTypeConfigDto> CreateRoomTypeConfigAsync(CreateRoomTypeConfigDto dto);
    Task<RoomTypeConfigDto> UpdateRoomTypeConfigAsync(int roomTypeId, CreateRoomTypeConfigDto dto);
    Task<bool> DeleteRoomTypeConfigAsync(int roomTypeId);

    // Rooms
    Task<List<RoomMasterDto>> GetAllRoomsAsync(int? hostelId, string? floor, int? roomTypeId, string? search);
    Task<RoomMasterDto> GetRoomByIdAsync(int roomId);
    Task<RoomMasterDto> CreateRoomAsync(CreateRoomMasterDto dto);
    Task<RoomMasterDto> UpdateRoomAsync(int roomId, CreateRoomMasterDto dto);
    Task<bool> DeleteRoomAsync(int roomId);

    // Wardens & Staff Link
    Task<List<HostelWardenDto>> GetAllWardensAsync(int? hostelId, string? search);
    Task<HostelWardenDto> SaveWardenDetailsAsync(SaveHostelWardenDto dto);
    Task<bool> DeleteWardenAsync(int wardenId);
    Task<List<StaffWardenCandidateDto>> GetStaffCandidatesAsync(string? search);

    // Bed Allocations
    Task<List<BedAllocationDto>> GetAllBedAllocationsAsync(int? hostelId, int? roomId, string? search);
    Task<BedAllocationDto> AllocateBedAsync(CreateBedAllocationDto dto);
    Task<bool> VacateBedAsync(int allocationId);

    // Attendance
    Task<List<HostelAttendanceDto>> GetNightAttendanceRollCallAsync(DateTime date, int? hostelId, string? floor, int? roomId);
    Task<bool> SaveNightAttendanceRollCallAsync(SaveHostelAttendanceRollCallDto dto);

    // Reports
    Task<List<HostelReportItemDto>> GetFilteredReportsAsync(HostelReportFilterDto filter);
}
