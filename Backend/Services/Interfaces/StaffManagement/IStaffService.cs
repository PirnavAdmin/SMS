namespace SMS.Api.Services.Interfaces.StaffManagement;

using SMS.Api.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IStaffService
{
    Task<string> GetNextEmployeeIdAsync();
    Task<List<StaffResponseDto>> GetAllStaffAsync(string? search, string? department);
    Task<StaffResponseDto> GetStaffByIdAsync(int id);
    Task<List<StaffDropdownDto>> GetTeachersForDropdownAsync(string? search);
    Task<List<TeacherDto>> GetAllTeachersAsync(string? search, string? subject);
    Task<TeacherDto?> GetTeacherByIdAsync(int id);
    Task<StaffResponseDto> CreateStaffAsync(StaffCreateDto dto);
    Task<StaffResponseDto> UpdateStaffAsync(int id, StaffCreateDto dto);
    Task<bool> DeleteStaffAsync(int id);

    // Attendance Operations
    Task<DailyAttendanceSummaryDto> GetDailyAttendanceSummaryAsync(string date, string? department);
    Task<List<StaffAttendanceResponseDto>> GetDailyAttendanceAsync(string date, string? department);
    Task<List<StaffAttendanceResponseDto>> GetMonthlyAttendanceAsync(int month, int year, string? department);
    Task<bool> SaveBulkAttendanceAsync(BulkAttendanceDto dto);
}
