using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Models;

namespace SMS.Api.Repositories.Interfaces;

public interface ISuperAdminRepository
{
    // School Management
    Task<List<School>> GetSchoolsAsync(string? search);
    Task<School?> GetSchoolByIdAsync(int schoolId);
    Task<School?> GetSchoolByCodeAsync(string schoolCode);
    Task AddSchoolAsync(School school);
    void DeleteSchool(School school);

    // User/Admin Management
    Task<List<User>> GetAdminsAsync(string? search);
    Task<User?> GetAdminByIdAsync(int adminId);
    Task<Role?> GetRoleByNameAsync(string roleName);
    Task AddUserAsync(User user);
    Task<bool> UserEmailExistsAsync(string email, int? excludeUserId = null);

    // Stats & Aggregations
    Task<int> GetCountByRoleAsync(string roleName, int? schoolId = null);
    Task<int> GetTotalUsersCountAsync(int? schoolId = null);
    Task<List<KeyValuePair<string, int>>> GetSchoolGrowthMonthlyAsync();

    // Audit Logging
    Task<List<AuditLog>> GetAuditLogsAsync(int? schoolId = null, int limit = 100);
    Task AddAuditLogAsync(AuditLog log);

    // Notifications
    Task<List<SystemNotification>> GetNotificationsAsync(int? schoolId = null);
    Task AddNotificationAsync(SystemNotification notification);

    // Save Changes
    Task SaveChangesAsync();
}
