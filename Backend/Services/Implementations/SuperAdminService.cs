using System;
using System.Collections.Generic;
using System.IO;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Dtos.Auth;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SMS.Api.Services.Implementations;

public class SuperAdminService : ISuperAdminService
{
    private readonly ISuperAdminRepository _saRepository;
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _config;
    private readonly TenantStoreDbContext? _tenantStore;

    public SuperAdminService(
        ISuperAdminRepository saRepository,
        IUserRepository userRepository,
        IConfiguration config,
        TenantStoreDbContext? tenantStore = null)
    {
        _saRepository = saRepository;
        _userRepository = userRepository;
        _config = config;
        _tenantStore = tenantStore;
    }

    // --- Authentication & Super Admin Account Management ---

    public async Task<int> GetSuperAdminCountAsync()
    {
        return await _saRepository.GetSuperAdminCountAsync();
    }

    public async Task<SuperAdminResponseDto> CreateSuperAdminAsync(SuperAdminCreateDto dto, int? requestedByUserId = null)
    {
        var cleanEmail = dto.Email.Trim().ToLower();
        var cleanMobile = dto.MobileNumber.Trim();

        if (await _saRepository.UserExistsAsync(cleanEmail, cleanMobile))
            throw new AppException($"User with email '{dto.Email}' or mobile number '{dto.MobileNumber}' already exists.", HttpStatusCode.Conflict);

        var superAdminRole = await _saRepository.GetRoleByNameAsync("SuperAdmin")
            ?? await _saRepository.GetRoleByNameAsync("Super Admin");

        var superAdminRoleSpace = await _saRepository.GetRoleByNameAsync("Super Admin");

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = cleanEmail,
            MobileNumber = cleanMobile,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "SuperAdmin",
            IsEmailVerified = true,
            IsMobileVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        if (superAdminRole != null)
        {
            user.Roles.Add(superAdminRole);
        }
        if (superAdminRoleSpace != null && superAdminRoleSpace.RoleId != superAdminRole?.RoleId)
        {
            user.Roles.Add(superAdminRoleSpace);
        }

        await _saRepository.AddUserAsync(user);
        await _saRepository.SaveChangesAsync();

        var requester = requestedByUserId.HasValue ? await _userRepository.GetByIdAsync(requestedByUserId.Value) : null;
        await LogActivityAsync(
            requestedByUserId ?? user.UserId,
            requester?.FullName ?? user.FullName,
            "SuperAdmin",
            "Create SuperAdmin",
            $"Created new Super Admin: {user.FullName} ({user.Email})");

        return new SuperAdminResponseDto
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            MobileNumber = user.MobileNumber,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }

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
        var roles = user.Roles != null ? user.Roles.Select(r => r.RoleName).ToList() : new List<string>();
        if (!string.IsNullOrEmpty(user.Role)) roles.Add(user.Role);
        roles = roles.Distinct().ToList();

        bool isSuperAdmin = roles.Any(r => r.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
                                           r.Equals("Super Admin", StringComparison.OrdinalIgnoreCase));

        if (!isSuperAdmin)
            throw new AppException("Access denied. Authorized for Super Admin only.", HttpStatusCode.Forbidden);

        if (!roles.Contains("SuperAdmin")) roles.Add("SuperAdmin");
        if (!roles.Contains("Super Admin")) roles.Add("Super Admin");

        var token = GenerateJwtToken(user, roles);

        // Log login action
        await LogActivityAsync(user.UserId, user.FullName, "SuperAdmin", "Login", "Super Admin logged in successfully.");

        return new AuthResponseDto(user.UserId, user.FullName, token, roles, user.Email, user.MobileNumber, user.Avatar, string.Empty);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);

        try
        {
            var issuer = _config["Jwt:Issuer"];
            var audience = _config["Jwt:Audience"];
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = !string.IsNullOrWhiteSpace(issuer),
                ValidIssuer = issuer,
                ValidateAudience = !string.IsNullOrWhiteSpace(audience),
                ValidAudience = audience,
                ValidateLifetime = true,
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

            bool isSuperAdmin = roles.Any(r => r.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
                                               r.Equals("Super Admin", StringComparison.OrdinalIgnoreCase));
            if (!isSuperAdmin)
                throw new AppException("Access denied. Authorized for Super Admin only.", HttpStatusCode.Forbidden);

            if (!roles.Contains("SuperAdmin")) roles.Add("SuperAdmin");
            if (!roles.Contains("Super Admin")) roles.Add("Super Admin");

            var newToken = GenerateJwtToken(user, roles);
            return new AuthResponseDto(user.UserId, user.FullName, newToken, roles, user.Email, user.MobileNumber, user.Avatar, string.Empty);
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new AppException("Invalid or expired token.", HttpStatusCode.Unauthorized);
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

        if (_tenantStore != null)
        {
            try
            {
                var cleanSlug = dto.SchoolCode.Trim().ToLower();
                var tenant = new AppTenantInfo
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Identifier = cleanSlug,
                    Name = school.SchoolName,
                    CompanyName = school.SchoolName,
                    PrimaryColor = "#0284c7",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                await _tenantStore.AppTenants.AddAsync(tenant);
                await _tenantStore.SaveChangesAsync();
            }
            catch { }
        }

        var adminUser = await _userRepository.GetByIdAsync(requestedByUserId);
        await LogActivityAsync(requestedByUserId, adminUser?.FullName ?? "SuperAdmin", "SuperAdmin", "Create School", $"Created school: {school.SchoolName} ({school.SchoolCode})");

        return MapToSchoolResponseDto(school, new List<Admin>());
    }

    public async Task<InstitutionRegisterResponseDto> RegisterInstitutionAsync(InstitutionRegisterDto dto, int requestedByUserId)
    {
        var cleanCode = dto.SchoolCode.Trim().ToLower();
        var existingSchool = await _saRepository.GetSchoolByCodeAsync(cleanCode);
        if (existingSchool != null)
        {
            throw new AppException($"The subdomain code '{cleanCode}' is already taken by another institution. Please choose a different subdomain.", HttpStatusCode.Conflict);
        }

        var cleanEmail = dto.Email.Trim().ToLower();
        if (await _saRepository.AdminEmailExistsAsync(cleanEmail))
        {
            throw new AppException($"The administrator email '{cleanEmail}' is already registered in the system. Please use a different email.", HttpStatusCode.Conflict);
        }

        var existingUser = await _userRepository.GetByIdentifierAsync(cleanEmail);
        if (existingUser != null)
        {
            throw new AppException($"An account with email '{cleanEmail}' already exists. Please use a unique administrator email.", HttpStatusCode.Conflict);
        }

        // 1. Create School Entity
        var school = new School
        {
            SchoolName = dto.SchoolName.Trim(),
            SchoolCode = cleanCode.ToUpper(),
            Address = dto.Address?.Trim(),
            Phone = dto.Phone?.Trim(),
            Email = cleanEmail,
            Website = dto.Website?.Trim(),
            PrincipalName = dto.PrincipalName?.Trim(),
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status,
            CreatedAt = DateTime.UtcNow
        };

        await _saRepository.AddSchoolAsync(school);
        await _saRepository.SaveChangesAsync();

        string? tenantId = null;
        if (_tenantStore != null)
        {
            try
            {
                tenantId = Guid.NewGuid().ToString("N");
                var tenant = new AppTenantInfo
                {
                    Id = tenantId,
                    Identifier = cleanCode,
                    Name = school.SchoolName,
                    CompanyName = school.SchoolName,
                    PrimaryColor = "#0284c7",
                    IsActive = school.Status == "Active",
                    CreatedAt = DateTime.UtcNow
                };
                await _tenantStore.AppTenants.AddAsync(tenant);
                await _tenantStore.SaveChangesAsync();
            }
            catch { }
        }

        // 2. Create School Admin Entity
        var adminRole = await _saRepository.GetRoleByNameAsync("Admin")
            ?? throw new AppException("Role 'Admin' not configured in DB.", HttpStatusCode.InternalServerError);

        var adminFullName = !string.IsNullOrWhiteSpace(dto.PrincipalName)
            ? dto.PrincipalName.Trim()
            : $"{school.SchoolName} Administrator";

        var admin = new Admin
        {
            FullName = adminFullName,
            Email = cleanEmail,
            MobileNumber = dto.Phone?.Trim() ?? string.Empty,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Admin",
            SchoolId = school.SchoolId,
            TenantId = tenantId,
            IsEmailVerified = true,
            IsMobileVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        admin.Roles.Add(adminRole);

        await _saRepository.AddAdminAsync(admin);

        var user = new User
        {
            FullName = admin.FullName,
            Email = admin.Email,
            MobileNumber = admin.MobileNumber,
            PasswordHash = admin.PasswordHash,
            Role = "Admin",
            SchoolId = school.SchoolId,
            TenantId = tenantId,
            IsEmailVerified = true,
            IsMobileVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        user.Roles.Add(adminRole);
        await _saRepository.AddUserAsync(user);

        await _saRepository.SaveChangesAsync();

        // 3. Log Audit Activity
        var adminUser = await _userRepository.GetByIdAsync(requestedByUserId);
        await LogActivityAsync(
            requestedByUserId,
            adminUser?.FullName ?? "SuperAdmin",
            "SuperAdmin",
            "Register Institution",
            $"Registered institution '{school.SchoolName}' ({cleanCode}) and created administrator '{cleanEmail}'."
        );

        var schoolDto = MapToSchoolResponseDto(school, new List<Admin> { admin });

        return new InstitutionRegisterResponseDto
        {
            School = schoolDto,
            Admin = new AdminResponseDto
            {
                UserId = admin.AdminId,
                FullName = admin.FullName,
                Email = admin.Email ?? cleanEmail,
                MobileNumber = admin.MobileNumber,
                SchoolId = school.SchoolId,
                SchoolName = school.SchoolName,
                Role = "Admin",
                CreatedAt = admin.CreatedAt
            },
            LoginUrl = "/#login",
            TemporaryPassword = dto.Password
        };
    }

    public async Task<List<PackagePlanDto>> GetPackagesAsync()
    {
        try
        {
            var dbEntities = await _saRepository.GetSubscriptionPackagesAsync();
            if (dbEntities != null && dbEntities.Count > 0)
            {
                return dbEntities.Select(MapEntityToDto).ToList();
            }
        }
        catch { }

        return new List<PackagePlanDto>();
    }

    public async Task<List<PackagePlanDto>> SavePackagesAsync(List<PackagePlanDto> packages)
    {
        if (packages == null) packages = new List<PackagePlanDto>();

        var entities = packages.Select(dto =>
        {
            var id = string.IsNullOrWhiteSpace(dto.Id) ? $"plan-{Guid.NewGuid():N}" : dto.Id.Trim();
            var featJson = JsonSerializer.Serialize(dto.Features ?? new List<string>());

            return new SubscriptionPackage
            {
                Id = id,
                Name = dto.Name?.Trim() ?? string.Empty,
                Tagline = dto.Tagline?.Trim() ?? string.Empty,
                MonthlyPrice = dto.MonthlyPrice,
                YearlyPrice = dto.YearlyPrice,
                Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "INR" : dto.Currency.Trim(),
                MaxStudents = dto.MaxStudents,
                MaxStaff = dto.MaxStaff,
                MaxBranches = dto.MaxBranches,
                StorageGb = dto.StorageGb,
                IsPopular = dto.IsPopular,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
                FeaturesJson = featJson,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }).ToList();

        var savedEntities = await _saRepository.SaveSubscriptionPackagesAsync(entities);
        return savedEntities.Select(MapEntityToDto).ToList();
    }

    private static PackagePlanDto MapEntityToDto(SubscriptionPackage entity)
    {
        List<string> features;
        try
        {
            features = JsonSerializer.Deserialize<List<string>>(entity.FeaturesJson ?? "[]") ?? new List<string>();
        }
        catch
        {
            features = new List<string>();
        }

        return new PackagePlanDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Tagline = entity.Tagline,
            MonthlyPrice = entity.MonthlyPrice,
            YearlyPrice = entity.YearlyPrice,
            Currency = entity.Currency,
            MaxStudents = entity.MaxStudents,
            MaxStaff = entity.MaxStaff,
            MaxBranches = entity.MaxBranches,
            StorageGb = entity.StorageGb,
            IsPopular = entity.IsPopular,
            Status = entity.Status,
            Features = features
        };
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

        if (_tenantStore != null)
        {
            try
            {
                var sCode = school.SchoolCode.Trim().ToLower();
                var tenant = await _tenantStore.AppTenants.FirstOrDefaultAsync(t => (t.Identifier != null && t.Identifier.ToLower() == sCode) || t.Name == school.SchoolName);
                if (tenant != null)
                {
                    _tenantStore.AppTenants.Remove(tenant);
                    await _tenantStore.SaveChangesAsync();
                }
            }
            catch { }
        }

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

        if (_tenantStore != null)
        {
            try
            {
                var sCode = school.SchoolCode.Trim().ToLower();
                var tenant = await _tenantStore.AppTenants.FirstOrDefaultAsync(t => (t.Identifier != null && t.Identifier.ToLower() == sCode) || t.Name == school.SchoolName);
                if (tenant != null)
                {
                    tenant.IsActive = (status == "Active");
                    tenant.UpdatedAt = DateTime.UtcNow;
                    await _tenantStore.SaveChangesAsync();
                }
            }
            catch { }
        }

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
        var school = await _saRepository.GetSchoolByIdAsync(dto.SchoolId)
            ?? throw new NotFoundException($"School with ID '{dto.SchoolId}' not found.");

        var adminRole = await _saRepository.GetRoleByNameAsync("Admin")
            ?? throw new AppException("Role 'Admin' not configured in DB.", HttpStatusCode.InternalServerError);

        string? tenantId = null;
        if (_tenantStore != null)
        {
            var sCode = school.SchoolCode.Trim().ToLower();
            var tenant = await _tenantStore.AppTenants.FirstOrDefaultAsync(t => (t.Identifier != null && t.Identifier.ToLower() == sCode) || t.Name == school.SchoolName);
            if (tenant == null)
            {
                tenant = new AppTenantInfo
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Identifier = sCode,
                    Name = school.SchoolName,
                    CompanyName = school.SchoolName,
                    PrimaryColor = "#0284c7",
                    IsActive = school.Status == "Active",
                    CreatedAt = DateTime.UtcNow
                };
                await _tenantStore.AppTenants.AddAsync(tenant);
                await _tenantStore.SaveChangesAsync();
            }
            else if (tenant.Identifier != sCode)
            {
                tenant.Identifier = sCode;
                tenant.UpdatedAt = DateTime.UtcNow;
                await _tenantStore.SaveChangesAsync();
            }
            tenantId = tenant.Id;
        }

        // Check if an admin record already exists for this school
        var allAdmins = await _saRepository.GetAdminsAsync(null);
        var existingAdmin = allAdmins.FirstOrDefault(a => a.SchoolId == school.SchoolId);

        // Check uniqueness of email and mobile for other institutions
        var cleanEmail = dto.Email.Trim().ToLower();
        var cleanPhone = dto.MobileNumber.Trim();

        var emailTaken = allAdmins.Any(a => a.Email != null && a.Email.ToLower() == cleanEmail && a.AdminId != (existingAdmin?.AdminId ?? 0));
        if (emailTaken)
            throw new AppException($"User with email '{dto.Email}' already exists for another institution.", HttpStatusCode.Conflict);

        var phoneTaken = allAdmins.Any(a => a.MobileNumber == cleanPhone && a.AdminId != (existingAdmin?.AdminId ?? 0));
        if (phoneTaken)
            throw new AppException($"User with mobile number '{cleanPhone}' already exists for another institution.", HttpStatusCode.Conflict);

        Admin admin;
        if (existingAdmin != null)
        {
            existingAdmin.FullName = dto.FullName.Trim();
            existingAdmin.Email = cleanEmail;
            existingAdmin.MobileNumber = cleanPhone;
            existingAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            existingAdmin.Role = "Admin";
            existingAdmin.TenantId = tenantId;
            if (existingAdmin.Roles.All(r => r.RoleName != "Admin"))
            {
                existingAdmin.Roles.Add(adminRole);
            }
            admin = existingAdmin;
        }
        else
        {
            admin = new Admin
            {
                FullName = dto.FullName.Trim(),
                Email = cleanEmail,
                MobileNumber = cleanPhone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "Admin",
                SchoolId = school.SchoolId,
                TenantId = tenantId,
                IsEmailVerified = true,
                IsMobileVerified = true,
                CreatedAt = DateTime.UtcNow
            };
            admin.Roles.Add(adminRole);
            await _saRepository.AddAdminAsync(admin);
        }

        // Synchronize corresponding User record for authentication & user listings
        var existingUser = await _userRepository.GetByIdentifierAsync(admin.Email ?? cleanPhone);
        if (existingUser != null)
        {
            existingUser.FullName = admin.FullName;
            existingUser.Email = admin.Email;
            existingUser.MobileNumber = admin.MobileNumber;
            existingUser.PasswordHash = admin.PasswordHash;
            existingUser.Role = "Admin";
            existingUser.SchoolId = school.SchoolId;
            existingUser.TenantId = tenantId;
            if (existingUser.Roles.All(r => r.RoleName != "Admin"))
            {
                existingUser.Roles.Add(adminRole);
            }
        }
        else
        {
            var user = new User
            {
                FullName = admin.FullName,
                Email = admin.Email,
                MobileNumber = admin.MobileNumber,
                PasswordHash = admin.PasswordHash,
                Role = "Admin",
                SchoolId = school.SchoolId,
                TenantId = tenantId,
                IsEmailVerified = true,
                IsMobileVerified = true,
                CreatedAt = DateTime.UtcNow
            };
            user.Roles.Add(adminRole);
            await _saRepository.AddUserAsync(user);
        }

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

        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        admin.PasswordHash = newPasswordHash;
        await _saRepository.SaveChangesAsync();

        if (!string.IsNullOrEmpty(admin.Email))
        {
            var userByEmail = await _userRepository.GetByIdentifierAsync(admin.Email);
            if (userByEmail != null)
            {
                await _userRepository.UpdatePasswordAsync(userByEmail.UserId, newPasswordHash);
            }
        }

        if (!string.IsNullOrEmpty(admin.MobileNumber))
        {
            var userByPhone = await _userRepository.GetByIdentifierAsync(admin.MobileNumber);
            if (userByPhone != null)
            {
                await _userRepository.UpdatePasswordAsync(userByPhone.UserId, newPasswordHash);
            }
        }

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
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // --- Platform Company Profile & Branding ---

    public async Task<PlatformCompanyProfileDto> GetCompanyProfileAsync()
    {
        var profile = await _saRepository.GetCompanyProfileAsync();
        return new PlatformCompanyProfileDto
        {
            Id = profile.Id,
            CompanyName = profile.CompanyName,
            Tagline = profile.Tagline,
            LogoUrl = profile.LogoUrl,
            SupportEmail = profile.SupportEmail,
            SupportPhone = profile.SupportPhone,
            WebsiteUrl = profile.WebsiteUrl,
            PrimaryColor = profile.PrimaryColor,
            UpdatedAt = profile.UpdatedAt
        };
    }

    public async Task<PlatformCompanyProfileDto> UpdateCompanyProfileAsync(PlatformCompanyProfileDto dto, int? requestedByUserId = null)
    {
        var model = new PlatformCompanyProfile
        {
            Id = dto.Id > 0 ? dto.Id : 1,
            CompanyName = dto.CompanyName?.Trim() ?? string.Empty,
            Tagline = dto.Tagline?.Trim() ?? string.Empty,
            LogoUrl = dto.LogoUrl?.Trim() ?? string.Empty,
            SupportEmail = dto.SupportEmail?.Trim() ?? string.Empty,
            SupportPhone = dto.SupportPhone?.Trim() ?? string.Empty,
            WebsiteUrl = dto.WebsiteUrl?.Trim() ?? string.Empty,
            PrimaryColor = string.IsNullOrWhiteSpace(dto.PrimaryColor) ? "#0284c7" : dto.PrimaryColor.Trim(),
            UpdatedAt = DateTime.UtcNow
        };

        var updated = await _saRepository.UpdateCompanyProfileAsync(model);

        if (requestedByUserId.HasValue && requestedByUserId.Value > 0)
        {
            try
            {
                var adminUser = await _userRepository.GetByIdAsync(requestedByUserId.Value);
                await LogActivityAsync(requestedByUserId.Value, adminUser?.FullName ?? "SuperAdmin", "SuperAdmin", "Update Company Profile", $"Updated platform company branding: {updated.CompanyName}");
            }
            catch { }
        }

        return new PlatformCompanyProfileDto
        {
            Id = updated.Id,
            CompanyName = updated.CompanyName,
            Tagline = updated.Tagline,
            LogoUrl = updated.LogoUrl,
            SupportEmail = updated.SupportEmail,
            SupportPhone = updated.SupportPhone,
            WebsiteUrl = updated.WebsiteUrl,
            PrimaryColor = updated.PrimaryColor,
            UpdatedAt = updated.UpdatedAt
        };
    }
}
