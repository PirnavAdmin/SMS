using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SMS.Api.Dtos;
using SMS.Api.Dtos.Auth;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations;

public class SuperAdminService : ISuperAdminService
{
    private readonly ISuperAdminRepository _saRepository;
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _config;

    public SuperAdminService(
        ISuperAdminRepository saRepository,
        IUserRepository userRepository,
        IConfiguration config)
    {
        _saRepository = saRepository;
        _userRepository = userRepository;
        _config = config;
    }

    // --- Authentication ---

    public async Task<AuthResponseDto> SuperAdminLoginAsync(LoginRequestDto dto)
    {
        var identifier = dto.EmailOrPhone.Trim();
        var user = await _userRepository.GetByIdentifierAsync(identifier);

        if (user == null)
            throw new AppException("Invalid email/mobile number or password.", HttpStatusCode.Unauthorized);

        var passwordMatches = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!passwordMatches)
            throw new AppException("Invalid email/mobile number or password.", HttpStatusCode.Unauthorized);

        // Verify the user is a Super Admin
        var roles = user.Roles.Select(r => r.RoleName).ToList();
        if (!string.IsNullOrEmpty(user.Role)) roles.Add(user.Role);
        roles = roles.Distinct().ToList();

        if (!roles.Contains("SuperAdmin"))
            throw new AppException("Access denied. Authorized for Super Admin only.", HttpStatusCode.Forbidden);

        var token = GenerateJwtToken(user, roles);

        // Log login action
        await LogActivityAsync(user.UserId, user.FullName, "SuperAdmin", "Login", "Super Admin logged in successfully.");

        return new AuthResponseDto(user.UserId, user.FullName, token, roles);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);

        try
        {
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = false, // Keep validation simple for refresh
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var userIdStr = jwtToken.Claims.First(x => x.Type == ClaimTypes.NameIdentifier || x.Type == "sub").Value;
            var user = await _userRepository.GetByIdAsync(int.Parse(userIdStr));

            if (user == null)
                throw new AppException("User not found.", HttpStatusCode.NotFound);

            var roles = user.Roles.Select(r => r.RoleName).ToList();
            if (!string.IsNullOrEmpty(user.Role)) roles.Add(user.Role);
            roles = roles.Distinct().ToList();

            var newToken = GenerateJwtToken(user, roles);
            return new AuthResponseDto(user.UserId, user.FullName, newToken, roles);
        }
        catch (Exception ex)
        {
            throw new AppException($"Invalid token validation: {ex.Message}", HttpStatusCode.Unauthorized);
        }
    }

    public async Task LogoutAsync(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user != null)
        {
            await LogActivityAsync(user.UserId, user.FullName, user.Role, "Logout", "User logged out.");
        }
    }

    // --- Dashboard Summary ---

    public async Task<SuperAdminDashboardSummaryDto> GetDashboardSummaryAsync()
    {
        var schools = await _saRepository.GetSchoolsAsync(null);
        var admins = await _saRepository.GetAdminsAsync(null);

        int totalSchools = schools.Count;
        int activeSchools = schools.Count(s => s.Status.Equals("Active", StringComparison.OrdinalIgnoreCase));
        int inactiveSchools = totalSchools - activeSchools;

        int totalAdmins = admins.Count;
        int totalTeachers = await _saRepository.GetCountByRoleAsync("Teacher");
        int totalStudents = await _saRepository.GetCountByRoleAsync("Student");
        int totalParents = await _saRepository.GetCountByRoleAsync("Parent");
        int totalStaff = await _saRepository.GetCountByRoleAsync("Staff");
        int totalUsers = await _saRepository.GetTotalUsersCountAsync();

        // Recent schools (top 5)
        var recentSchools = schools.Take(5).Select(s => MapToSchoolResponseDto(s, admins)).ToList();

        // Growth Monthly
        var growth = await _saRepository.GetSchoolGrowthMonthlyAsync();
        var growthList = growth.Select(g => new GrowthAnalyticsDto { Month = g.Key, Count = g.Value }).ToList();

        // School wise user counts
        var schoolWiseStats = new List<SchoolUsersSummaryDto>();
        foreach (var school in schools)
        {
            int sAdmins = admins.Count(a => a.SchoolId == school.SchoolId);
            int sTeachers = await _saRepository.GetCountByRoleAsync("Teacher", school.SchoolId);
            int sStudents = await _saRepository.GetCountByRoleAsync("Student", school.SchoolId);
            int sParents = await _saRepository.GetCountByRoleAsync("Parent", school.SchoolId);
            int sStaff = await _saRepository.GetCountByRoleAsync("Staff", school.SchoolId);
            int sTotal = await _saRepository.GetTotalUsersCountAsync(school.SchoolId);

            schoolWiseStats.Add(new SchoolUsersSummaryDto
            {
                SchoolId = school.SchoolId,
                SchoolName = school.SchoolName,
                SchoolCode = school.SchoolCode,
                AdminsCount = sAdmins,
                TeachersCount = sTeachers,
                StudentsCount = sStudents,
                ParentsCount = sParents,
                StaffCount = sStaff,
                TotalUsers = sTotal
            });
        }

        return new SuperAdminDashboardSummaryDto
        {
            TotalSchools = totalSchools,
            ActiveSchools = activeSchools,
            InactiveSchools = inactiveSchools,
            TotalAdmins = totalAdmins,
            TotalTeachers = totalTeachers,
            TotalStudents = totalStudents,
            TotalParents = totalParents,
            TotalStaff = totalStaff,
            TotalUsers = totalUsers,
            RecentSchools = recentSchools,
            GrowthAnalytics = growthList,
            SchoolWiseUserStats = schoolWiseStats
        };
    }

    // --- School Management ---

    public async Task<SchoolResponseDto> CreateSchoolAsync(SchoolCreateDto dto, int requestedByUserId)
    {
        var existing = await _saRepository.GetSchoolByCodeAsync(dto.SchoolCode.Trim());
        if (existing != null)
            throw new AppException($"School with code '{dto.SchoolCode}' already exists.", HttpStatusCode.Conflict);

        var school = new School
        {
            SchoolName = dto.SchoolName.Trim(),
            SchoolCode = dto.SchoolCode.Trim().ToUpper(),
            Address = dto.Address,
            Phone = dto.Phone,
            Email = dto.Email,
            Website = dto.Website,
            PrincipalName = dto.PrincipalName,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        await _saRepository.AddSchoolAsync(school);
        await _saRepository.SaveChangesAsync();

        var adminUser = await _userRepository.GetByIdAsync(requestedByUserId);
        await LogActivityAsync(requestedByUserId, adminUser?.FullName ?? "SuperAdmin", "SuperAdmin", "Create School", $"Created school: {school.SchoolName} ({school.SchoolCode})");

        return MapToSchoolResponseDto(school, new List<Admin>());
    }

    public async Task<SchoolResponseDto> UpdateSchoolAsync(int schoolId, SchoolUpdateDto dto, int requestedByUserId)
    {
        var school = await _saRepository.GetSchoolByIdAsync(schoolId)
            ?? throw new NotFoundException($"School with ID '{schoolId}' not found.");

        school.SchoolName = dto.SchoolName.Trim();
        school.Address = dto.Address;
        school.Phone = dto.Phone;
        school.Email = dto.Email;
        school.Website = dto.Website;
        school.PrincipalName = dto.PrincipalName;
        school.Status = dto.Status;
        school.UpdatedAt = DateTime.UtcNow;

        await _saRepository.SaveChangesAsync();

        var adminUser = await _userRepository.GetByIdAsync(requestedByUserId);
        await LogActivityAsync(requestedByUserId, adminUser?.FullName ?? "SuperAdmin", "SuperAdmin", "Update School", $"Updated school: {school.SchoolName}");

        var admins = await _saRepository.GetAdminsAsync(null);
        return MapToSchoolResponseDto(school, admins);
    }

    public async Task DeleteSchoolAsync(int schoolId, int requestedByUserId)
    {
        var school = await _saRepository.GetSchoolByIdAsync(schoolId)
            ?? throw new NotFoundException($"School with ID '{schoolId}' not found.");

        _saRepository.DeleteSchool(school);
        await _saRepository.SaveChangesAsync();

        var adminUser = await _userRepository.GetByIdAsync(requestedByUserId);
        await LogActivityAsync(requestedByUserId, adminUser?.FullName ?? "SuperAdmin", "SuperAdmin", "Delete School", $"Deleted school: {school.SchoolName}");
    }

    public async Task<SchoolResponseDto> ToggleSchoolStatusAsync(int schoolId, string status, int requestedByUserId)
    {
        var school = await _saRepository.GetSchoolByIdAsync(schoolId)
            ?? throw new NotFoundException($"School with ID '{schoolId}' not found.");

        school.Status = status;
        school.UpdatedAt = DateTime.UtcNow;

        await _saRepository.SaveChangesAsync();

        var adminUser = await _userRepository.GetByIdAsync(requestedByUserId);
        await LogActivityAsync(requestedByUserId, adminUser?.FullName ?? "SuperAdmin", "SuperAdmin", "Toggle School Status", $"Toggled school: {school.SchoolName} to {status}");

        var admins = await _saRepository.GetAdminsAsync(null);
        return MapToSchoolResponseDto(school, admins);
    }

    public async Task<SchoolResponseDto> GetSchoolByIdAsync(int schoolId)
    {
        var school = await _saRepository.GetSchoolByIdAsync(schoolId)
            ?? throw new NotFoundException($"School with ID '{schoolId}' not found.");

        var admins = await _saRepository.GetAdminsAsync(null);
        return MapToSchoolResponseDto(school, admins);
    }

    public async Task<List<SchoolResponseDto>> GetAllSchoolsAsync(string? search)
    {
        var schools = await _saRepository.GetSchoolsAsync(search);
        var admins = await _saRepository.GetAdminsAsync(null);
        return schools.Select(s => MapToSchoolResponseDto(s, admins)).ToList();
    }

    public async Task<SchoolUsersSummaryDto> GetSchoolUsersSummaryAsync(int schoolId)
    {
        var school = await _saRepository.GetSchoolByIdAsync(schoolId)
            ?? throw new NotFoundException($"School with ID '{schoolId}' not found.");

        int sAdmins = await _saRepository.GetCountByRoleAsync("Admin", schoolId);
        int sTeachers = await _saRepository.GetCountByRoleAsync("Teacher", schoolId);
        int sStudents = await _saRepository.GetCountByRoleAsync("Student", schoolId);
        int sParents = await _saRepository.GetCountByRoleAsync("Parent", schoolId);
        int sStaff = await _saRepository.GetCountByRoleAsync("Staff", schoolId);
        int sTotal = await _saRepository.GetTotalUsersCountAsync(schoolId);

        return new SchoolUsersSummaryDto
        {
            SchoolId = school.SchoolId,
            SchoolName = school.SchoolName,
            SchoolCode = school.SchoolCode,
            AdminsCount = sAdmins,
            TeachersCount = sTeachers,
            StudentsCount = sStudents,
            ParentsCount = sParents,
            StaffCount = sStaff,
            TotalUsers = sTotal
        };
    }

    // --- Admin Management ---

    public async Task<AdminResponseDto> CreateAdminAsync(AdminCreateDto dto, int requestedByUserId)
    {
        if (await _saRepository.AdminEmailExistsAsync(dto.Email.Trim()))
            throw new AppException($"User with email '{dto.Email}' already exists.", HttpStatusCode.Conflict);

        var school = await _saRepository.GetSchoolByIdAsync(dto.SchoolId)
            ?? throw new NotFoundException($"School with ID '{dto.SchoolId}' not found.");

        var adminRole = await _saRepository.GetRoleByNameAsync("Admin")
            ?? throw new AppException("Role 'Admin' not configured in DB.", HttpStatusCode.InternalServerError);

        var admin = new Admin
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            MobileNumber = dto.MobileNumber.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Admin",
            SchoolId = school.SchoolId,
            IsEmailVerified = true,
            IsMobileVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        admin.Roles.Add(adminRole);

        await _saRepository.AddAdminAsync(admin);
        await _saRepository.SaveChangesAsync();

        var saUser = await _userRepository.GetByIdAsync(requestedByUserId);
        await LogActivityAsync(requestedByUserId, saUser?.FullName ?? "SuperAdmin", "SuperAdmin", "Create Admin", $"Created admin user: {admin.FullName} for school: {school.SchoolName}");

        return MapToAdminResponseDto(admin);
    }

    public async Task<AdminResponseDto> UpdateAdminAsync(int adminId, AdminUpdateDto dto, int requestedByUserId)
    {
        var admin = await _saRepository.GetAdminByIdAsync(adminId)
            ?? throw new NotFoundException($"Admin with ID '{adminId}' not found.");

        if (await _saRepository.AdminEmailExistsAsync(dto.Email.Trim(), adminId))
            throw new AppException($"User with email '{dto.Email}' already exists.", HttpStatusCode.Conflict);

        admin.FullName = dto.FullName.Trim();
        admin.Email = dto.Email.Trim().ToLower();
        admin.MobileNumber = dto.MobileNumber.Trim();
        
        if (dto.AssignedSchoolId.HasValue)
        {
            var school = await _saRepository.GetSchoolByIdAsync(dto.AssignedSchoolId.Value)
                ?? throw new NotFoundException($"School with ID '{dto.AssignedSchoolId.Value}' not found.");
            admin.SchoolId = school.SchoolId;
        }

        await _saRepository.SaveChangesAsync();

        var saUser = await _userRepository.GetByIdAsync(requestedByUserId);
        await LogActivityAsync(requestedByUserId, saUser?.FullName ?? "SuperAdmin", "SuperAdmin", "Update Admin", $"Updated admin: {admin.FullName}");

        return MapToAdminResponseDto(admin);
    }

    public async Task ResetAdminPasswordAsync(int adminId, string newPassword, int requestedByUserId)
    {
        var admin = await _saRepository.GetAdminByIdAsync(adminId)
            ?? throw new NotFoundException($"Admin with ID '{adminId}' not found.");

        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _saRepository.SaveChangesAsync();

        var saUser = await _userRepository.GetByIdAsync(requestedByUserId);
        await LogActivityAsync(requestedByUserId, saUser?.FullName ?? "SuperAdmin", "SuperAdmin", "Reset Admin Password", $"Reset password for admin user: {admin.FullName}");
    }

    public async Task<List<AdminResponseDto>> GetAdminsAsync(string? search)
    {
        var admins = await _saRepository.GetAdminsAsync(search);
        return admins.Select(MapToAdminResponseDto).ToList();
    }

    // --- User Statistics ---

    public async Task<UserStatisticsDto> GetUserStatisticsAsync()
    {
        var schools = await _saRepository.GetSchoolsAsync(null);
        var admins = await _saRepository.GetAdminsAsync(null);

        int totalTeachers = await _saRepository.GetCountByRoleAsync("Teacher");
        int totalStudents = await _saRepository.GetCountByRoleAsync("Student");
        int totalParents = await _saRepository.GetCountByRoleAsync("Parent");
        int totalStaff = await _saRepository.GetCountByRoleAsync("Staff");
        int totalUsers = await _saRepository.GetTotalUsersCountAsync();

        var schoolWiseCounts = new List<SchoolUsersSummaryDto>();
        foreach (var school in schools)
        {
            int sAdmins = admins.Count(a => a.SchoolId == school.SchoolId);
            int sTeachers = await _saRepository.GetCountByRoleAsync("Teacher", school.SchoolId);
            int sStudents = await _saRepository.GetCountByRoleAsync("Student", school.SchoolId);
            int sParents = await _saRepository.GetCountByRoleAsync("Parent", school.SchoolId);
            int sStaff = await _saRepository.GetCountByRoleAsync("Staff", school.SchoolId);
            int sTotal = await _saRepository.GetTotalUsersCountAsync(school.SchoolId);

            schoolWiseCounts.Add(new SchoolUsersSummaryDto
            {
                SchoolId = school.SchoolId,
                SchoolName = school.SchoolName,
                SchoolCode = school.SchoolCode,
                AdminsCount = sAdmins,
                TeachersCount = sTeachers,
                StudentsCount = sStudents,
                ParentsCount = sParents,
                StaffCount = sStaff,
                TotalUsers = sTotal
            });
        }

        return new UserStatisticsDto
        {
            TotalUsers = totalUsers,
            TeachersCount = totalTeachers,
            StudentsCount = totalStudents,
            ParentsCount = totalParents,
            StaffCount = totalStaff,
            SchoolWiseCounts = schoolWiseCounts
        };
    }

    // --- Audit & Monitoring ---

    public async Task<List<AuditLogResponseDto>> GetAuditLogsAsync(int? schoolId = null, int limit = 100)
    {
        var logs = await _saRepository.GetAuditLogsAsync(schoolId, limit);
        var schools = await _saRepository.GetSchoolsAsync(null);

        return logs.Select(l => new AuditLogResponseDto
        {
            AuditLogId = l.AuditLogId,
            UserId = l.UserId,
            UserName = l.UserName,
            UserRole = l.UserRole,
            Action = l.Action,
            Details = l.Details,
            IpAddress = l.IpAddress,
            Timestamp = l.Timestamp,
            SchoolId = l.SchoolId,
            SchoolName = schools.FirstOrDefault(s => s.SchoolId == l.SchoolId)?.SchoolName
        }).ToList();
    }

    public async Task<List<SystemNotificationResponseDto>> GetNotificationsAsync(int? schoolId = null)
    {
        var notifications = await _saRepository.GetNotificationsAsync(schoolId);
        var schools = await _saRepository.GetSchoolsAsync(null);

        return notifications.Select(n => new SystemNotificationResponseDto
        {
            NotificationId = n.NotificationId,
            Title = n.Title,
            Message = n.Message,
            Type = n.Type,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt,
            SchoolId = n.SchoolId,
            SchoolName = schools.FirstOrDefault(s => s.SchoolId == n.SchoolId)?.SchoolName
        }).ToList();
    }

    // --- Private Helper Methods ---

    private async Task LogActivityAsync(int userId, string userName, string userRole, string action, string details)
    {
        var log = new AuditLog
        {
            UserId = userId,
            UserName = userName,
            UserRole = userRole,
            Action = action,
            Details = details,
            Timestamp = DateTime.UtcNow
        };
        await _saRepository.AddAuditLogAsync(log);
        await _saRepository.SaveChangesAsync();
    }

    private SchoolResponseDto MapToSchoolResponseDto(School school, List<Admin> admins)
    {
        int adminsCount = admins.Count(a => a.SchoolId == school.SchoolId);
        
        return new SchoolResponseDto
        {
            SchoolId = school.SchoolId,
            SchoolName = school.SchoolName,
            SchoolCode = school.SchoolCode,
            Address = school.Address,
            Phone = school.Phone,
            Email = school.Email,
            Website = school.Website,
            PrincipalName = school.PrincipalName,
            Status = school.Status,
            CreatedAt = school.CreatedAt,
            AdminsCount = adminsCount,
            // Lazy evaluations for other module components to prevent N+1 queries during aggregate stats loads
            TeachersCount = school.Users?.Count(u => u.Role == "Teacher" || u.Roles.Any(r => r.RoleName == "Teacher")) ?? 0,
            StudentsCount = school.Users?.Count(u => u.Role == "Student" || u.Roles.Any(r => r.RoleName == "Student")) ?? 0,
            ParentsCount = school.Users?.Count(u => u.Role == "Parent" || u.Roles.Any(r => r.RoleName == "Parent")) ?? 0,
            StaffCount = school.Users?.Count(u => u.Role == "Staff" || u.Roles.Any(r => r.RoleName == "Staff")) ?? 0,
            TotalUsersCount = school.Users?.Count ?? 0
        };
    }

    private AdminResponseDto MapToAdminResponseDto(Admin admin)
    {
        return new AdminResponseDto
        {
            UserId = admin.AdminId,
            FullName = admin.FullName,
            Email = admin.Email ?? string.Empty,
            MobileNumber = admin.MobileNumber,
            SchoolId = admin.SchoolId,
            SchoolName = admin.School?.SchoolName,
            Role = admin.Role,
            CreatedAt = admin.CreatedAt
        };
    }

    private string GenerateJwtToken(User user, List<string> roles)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.MobilePhone, user.MobileNumber)
        };

        if (!string.IsNullOrEmpty(user.Email))
            claims.Add(new Claim(ClaimTypes.Email, user.Email));

        if (user.SchoolId.HasValue)
            claims.Add(new Claim("schoolId", user.SchoolId.Value.ToString()));

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
