using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos;
using SMS.Api.Dtos.Auth;

namespace SMS.Api.Services.Interfaces;

public interface ISuperAdminService
{
    // Authentication
    Task<AuthResponseDto> SuperAdminLoginAsync(LoginRequestDto dto);
    Task<AuthResponseDto> RefreshTokenAsync(string token);
    Task LogoutAsync(int userId);

    // Dashboard
    Task<SuperAdminDashboardSummaryDto> GetDashboardSummaryAsync();

    // School Management
    Task<SchoolResponseDto> CreateSchoolAsync(SchoolCreateDto dto, int requestedByUserId);
    Task<SchoolResponseDto> UpdateSchoolAsync(int schoolId, SchoolUpdateDto dto, int requestedByUserId);
    Task DeleteSchoolAsync(int schoolId, int requestedByUserId);
    Task<SchoolResponseDto> ToggleSchoolStatusAsync(int schoolId, string status, int requestedByUserId);
    Task<SchoolResponseDto> GetSchoolByIdAsync(int schoolId);
    Task<List<SchoolResponseDto>> GetAllSchoolsAsync(string? search);
    Task<SchoolUsersSummaryDto> GetSchoolUsersSummaryAsync(int schoolId);

    // Admin Management
    Task<AdminResponseDto> CreateAdminAsync(AdminCreateDto dto, int requestedByUserId);
    Task<AdminResponseDto> UpdateAdminAsync(int adminId, AdminUpdateDto dto, int requestedByUserId);
    Task ResetAdminPasswordAsync(int adminId, string newPassword, int requestedByUserId);
    Task<List<AdminResponseDto>> GetAdminsAsync(string? search);

    // User Statistics
    Task<UserStatisticsDto> GetUserStatisticsAsync();

    // Audit & Monitoring
    Task<List<AuditLogResponseDto>> GetAuditLogsAsync(int? schoolId = null, int limit = 100);
    Task<List<SystemNotificationResponseDto>> GetNotificationsAsync(int? schoolId = null);
}
