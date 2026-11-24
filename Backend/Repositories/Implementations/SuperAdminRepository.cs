using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations;

public class SuperAdminRepository : ISuperAdminRepository
{
    private readonly AppDbContext _context;

    public SuperAdminRepository(AppDbContext context)
    {
        _context = context;
    }

    // --- School Management ---

    public async Task<List<School>> GetSchoolsAsync(string? search)
    {
        var query = _context.Schools
            .IgnoreQueryFilters()
            .Include(s => s.Users)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanSearch = search.Trim();
            query = query.Where(s => s.SchoolName.Contains(cleanSearch) || s.SchoolCode.Contains(cleanSearch));
        }

        return await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
    }

    public async Task<School?> GetSchoolByIdAsync(int schoolId)
    {
        return await _context.Schools
            .IgnoreQueryFilters()
            .Include(s => s.Users)
            .FirstOrDefaultAsync(s => s.SchoolId == schoolId);
    }

    public async Task<School?> GetSchoolByCodeAsync(string schoolCode)
    {
        return await _context.Schools
            .IgnoreQueryFilters()
            .Include(s => s.Users)
            .FirstOrDefaultAsync(s => s.SchoolCode == schoolCode);
    }

    public async Task AddSchoolAsync(School school)
    {
        await _context.Schools.AddAsync(school);
    }

    public void DeleteSchool(School school)
    {
        _context.Schools.Remove(school);
    }

    public async Task DeleteSchoolCascadeAsync(int schoolId, string? tenantId = null)
    {
        // 1. Gather all admin and user IDs belonging to this school or tenant
        var adminIds = await _context.Admins
            .IgnoreQueryFilters()
            .Where(a => a.SchoolId == schoolId || (tenantId != null && a.TenantId == tenantId))
            .Select(a => a.AdminId)
            .ToListAsync();

        var userIds = await _context.Users
            .IgnoreQueryFilters()
            .Where(u => u.SchoolId == schoolId || (tenantId != null && u.TenantId == tenantId))
            .Select(u => u.UserId)
            .ToListAsync();

        // 2. Remove OTP verifications for these users/admins
        var otps = await _context.OtpVerifications
            .IgnoreQueryFilters()
            .Where(o => (o.AdminId.HasValue && adminIds.Contains(o.AdminId.Value)) ||
                        (o.UserId.HasValue && userIds.Contains(o.UserId.Value)))
            .ToListAsync();

        if (otps.Any())
        {
            _context.OtpVerifications.RemoveRange(otps);
        }

        // 3. Remove Admins and their roles
        var admins = await _context.Admins
            .IgnoreQueryFilters()
            .Include(a => a.Roles)
            .Where(a => a.SchoolId == schoolId || (tenantId != null && a.TenantId == tenantId))
            .ToListAsync();

        foreach (var a in admins)
        {
            a.Roles.Clear();
        }
        if (admins.Any())
        {
            _context.Admins.RemoveRange(admins);
        }

        // 4. Remove Users and their roles
        var users = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Roles)
            .Where(u => u.SchoolId == schoolId || (tenantId != null && u.TenantId == tenantId))
            .ToListAsync();

        foreach (var u in users)
        {
            u.Roles.Clear();
        }
        if (users.Any())
        {
            _context.Users.RemoveRange(users);
        }

        // 5. Clear SchoolId on any remaining users/admins in database
        var remainingUsers = await _context.Users
            .IgnoreQueryFilters()
            .Where(u => u.SchoolId == schoolId)
            .ToListAsync();
        foreach (var u in remainingUsers)
        {
            u.SchoolId = null;
        }

        var remainingAdmins = await _context.Admins
            .IgnoreQueryFilters()
            .Where(a => a.SchoolId == schoolId)
            .ToListAsync();
        foreach (var a in remainingAdmins)
        {
            a.SchoolId = null;
        }

        // 6. Clear SchoolId on AuditLogs to preserve history without foreign key failure
        var auditLogs = await _context.AuditLogs
            .IgnoreQueryFilters()
            .Where(al => al.SchoolId == schoolId)
            .ToListAsync();
        foreach (var al in auditLogs)
        {
            al.SchoolId = null;
        }

        // 7. Remove SystemNotifications referencing this school
        var notifications = await _context.SystemNotifications
            .IgnoreQueryFilters()
            .Where(sn => sn.SchoolId == schoolId)
            .ToListAsync();
        if (notifications.Any())
        {
            _context.SystemNotifications.RemoveRange(notifications);
        }

        // 8. Clean up tenant-scoped records if tenantId is present
        if (!string.IsNullOrWhiteSpace(tenantId))
        {
            try
            {
                var staff = await _context.Staff.IgnoreQueryFilters().Where(s => EF.Property<string>(s, "TenantId") == tenantId).ToListAsync();
                if (staff.Any()) _context.Staff.RemoveRange(staff);

                var students = await _context.Students.IgnoreQueryFilters().Where(s => EF.Property<string>(s, "TenantId") == tenantId).ToListAsync();
                if (students.Any()) _context.Students.RemoveRange(students);

                var admissions = await _context.Admissions.IgnoreQueryFilters().Where(a => EF.Property<string>(a, "TenantId") == tenantId).ToListAsync();
                if (admissions.Any()) _context.Admissions.RemoveRange(admissions);

                var branches = await _context.Branches.IgnoreQueryFilters().Where(b => EF.Property<string>(b, "TenantId") == tenantId).ToListAsync();
                if (branches.Any()) _context.Branches.RemoveRange(branches);

                var departments = await _context.Departments.IgnoreQueryFilters().Where(d => EF.Property<string>(d, "TenantId") == tenantId).ToListAsync();
                if (departments.Any()) _context.Departments.RemoveRange(departments);

                var subjects = await _context.Subjects.IgnoreQueryFilters().Where(s => EF.Property<string>(s, "TenantId") == tenantId).ToListAsync();
                if (subjects.Any()) _context.Subjects.RemoveRange(subjects);

                var settings = await _context.SchoolSettings.IgnoreQueryFilters().Where(s => EF.Property<string>(s, "TenantId") == tenantId).ToListAsync();
                if (settings.Any()) _context.SchoolSettings.RemoveRange(settings);
            }
            catch { }
        }

        // Save child deletions first so foreign key dependencies are cleared
        await _context.SaveChangesAsync();

        // 9. Remove School entity itself
        var school = await _context.Schools
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.SchoolId == schoolId);

        if (school != null)
        {
            _context.Schools.Remove(school);
            await _context.SaveChangesAsync();
        }
    }

    // --- User/Admin Management ---

    public async Task<List<Admin>> GetAdminsAsync(string? search)
    {
        var query = _context.Admins
            .IgnoreQueryFilters()
            .Include(a => a.School)
            .Include(a => a.Roles)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanSearch = search.Trim();
            query = query.Where(a => (a.FullName != null && a.FullName.Contains(cleanSearch)) || (a.Email != null && a.Email.Contains(cleanSearch)));
        }

        return await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
    }

    public async Task<Admin?> GetAdminByIdAsync(int adminId)
    {
        return await _context.Admins
            .IgnoreQueryFilters()
            .Include(a => a.School)
            .Include(a => a.Roles)
            .FirstOrDefaultAsync(a => a.AdminId == adminId);
    }

    public async Task<Role?> GetRoleByNameAsync(string roleName)
    {
        return await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == roleName);
    }

    public async Task AddAdminAsync(Admin admin)
    {
        await _context.Admins.AddAsync(admin);
    }

    public async Task<bool> AdminEmailExistsAsync(string email, int? excludeAdminId = null)
    {
        if (excludeAdminId.HasValue)
        {
            return await _context.Admins.IgnoreQueryFilters().AnyAsync(a => a.Email == email && a.AdminId != excludeAdminId.Value);
        }
        return await _context.Admins.IgnoreQueryFilters().AnyAsync(a => a.Email == email);
    }

    // --- Super Admin Account Management ---

    public async Task<int> GetSuperAdminCountAsync()
    {
        return await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Roles)
            .CountAsync(u => u.Role == "SuperAdmin" || u.Role == "Super Admin" || u.Roles.Any(r => r.RoleName == "SuperAdmin" || r.RoleName == "Super Admin"));
    }

    public async Task<bool> UserExistsAsync(string email, string mobileNumber)
    {
        var cleanEmail = email.Trim().ToLower();
        var cleanMobile = mobileNumber.Trim();
        return await _context.Users.IgnoreQueryFilters().AnyAsync(u => (u.Email != null && u.Email.ToLower() == cleanEmail) || u.MobileNumber == cleanMobile);
    }

    public async Task AddUserAsync(User user)
    {
        await _context.Users.AddAsync(user);
    }

    // --- Stats & Aggregations ---

    public async Task<int> GetCountByRoleAsync(string roleName, int? schoolId = null)
    {
        if (roleName == "Admin")
        {
            var adminQuery = _context.Admins.IgnoreQueryFilters().AsQueryable();
            if (schoolId.HasValue)
            {
                adminQuery = adminQuery.Where(a => a.SchoolId == schoolId.Value);
            }
            return await adminQuery.CountAsync();
        }

        var query = _context.Users.IgnoreQueryFilters().AsQueryable();

        if (schoolId.HasValue)
        {
            query = query.Where(u => u.SchoolId == schoolId.Value);
        }

        // Match either Role column or list of Roles relationship
        return await query.CountAsync(u => u.Role == roleName || u.Roles.Any(r => r.RoleName == roleName));
    }

    public async Task<int> GetTotalUsersCountAsync(int? schoolId = null)
    {
        var usersQuery = _context.Users.IgnoreQueryFilters().AsQueryable();
        var adminsQuery = _context.Admins.IgnoreQueryFilters().AsQueryable();

        if (schoolId.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.SchoolId == schoolId.Value);
            adminsQuery = adminsQuery.Where(a => a.SchoolId == schoolId.Value);
        }

        return await usersQuery.CountAsync() + await adminsQuery.CountAsync();
    }

    public async Task<List<KeyValuePair<string, int>>> GetSchoolGrowthMonthlyAsync()
    {
        var schools = await _context.Schools.IgnoreQueryFilters().AsNoTracking().ToListAsync();
        
        // Group by month and year in memory to avoid translation failures
        return schools
            .GroupBy(s => s.CreatedAt.ToString("MMM yyyy"))
            .Select(g => new KeyValuePair<string, int>(g.Key, g.Count()))
            .ToList();
    }

    // --- Audit Logging ---

    public async Task<List<AuditLog>> GetAuditLogsAsync(int? schoolId = null, int limit = 100)
    {
        var query = _context.AuditLogs.IgnoreQueryFilters().AsQueryable();

        if (schoolId.HasValue)
        {
            query = query.Where(l => l.SchoolId == schoolId.Value);
        }

        return await query
            .OrderByDescending(l => l.Timestamp)
            .Take(limit)
            .ToListAsync();
    }

    public async Task AddAuditLogAsync(AuditLog log)
    {
        await _context.AuditLogs.AddAsync(log);
    }

    // --- Notifications ---

    public async Task<List<SystemNotification>> GetNotificationsAsync(int? schoolId = null)
    {
        var query = _context.SystemNotifications.IgnoreQueryFilters().AsQueryable();

        if (schoolId.HasValue)
        {
            query = query.Where(n => n.SchoolId == schoolId.Value);
        }

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task AddNotificationAsync(SystemNotification notification)
    {
        await _context.SystemNotifications.AddAsync(notification);
    }

    // --- Save Changes ---

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    // --- Platform Company Profile & Branding ---

    public async Task<PlatformCompanyProfile> GetCompanyProfileAsync()
    {
        var profile = await _context.PlatformCompanyProfiles.OrderBy(p => p.Id).FirstOrDefaultAsync();
        if (profile != null)
        {
            return profile;
        }

        var initial = new PlatformCompanyProfile
        {
            CompanyName = string.Empty,
            Tagline = string.Empty,
            LogoUrl = string.Empty,
            Address = string.Empty,
            SupportEmail = string.Empty,
            SupportPhone = string.Empty,
            WebsiteUrl = string.Empty,
            PrimaryColor = "#0284c7",
            UpdatedAt = DateTime.UtcNow
        };
        await _context.PlatformCompanyProfiles.AddAsync(initial);
        await _context.SaveChangesAsync();
        return initial;
    }

    public async Task<PlatformCompanyProfile> UpdateCompanyProfileAsync(PlatformCompanyProfile profile)
    {
        var existing = await _context.PlatformCompanyProfiles.OrderBy(p => p.Id).FirstOrDefaultAsync();
        if (existing == null)
        {
            profile.Id = 0;
            profile.UpdatedAt = DateTime.UtcNow;
            await _context.PlatformCompanyProfiles.AddAsync(profile);
            await _context.SaveChangesAsync();
            return profile;
        }
        else
        {
            existing.CompanyName = profile.CompanyName?.Trim() ?? string.Empty;
            existing.Tagline = profile.Tagline?.Trim() ?? string.Empty;
            existing.LogoUrl = profile.LogoUrl?.Trim() ?? string.Empty;
            existing.Address = profile.Address?.Trim() ?? string.Empty;
            existing.SupportEmail = profile.SupportEmail?.Trim() ?? string.Empty;
            existing.SupportPhone = profile.SupportPhone?.Trim() ?? string.Empty;
            existing.WebsiteUrl = profile.WebsiteUrl?.Trim() ?? string.Empty;
            existing.PrimaryColor = string.IsNullOrWhiteSpace(profile.PrimaryColor) ? "#0284c7" : profile.PrimaryColor.Trim();
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return existing;
        }
    }

    // --- Subscription Packages & SaaS Tiers ---

    public async Task<List<SubscriptionPackage>> GetSubscriptionPackagesAsync()
    {
        var dbPackages = await _context.SubscriptionPackages.OrderBy(p => p.CreatedAt).ToListAsync();
        return dbPackages ?? new List<SubscriptionPackage>();
    }

    public async Task<List<SubscriptionPackage>> SaveSubscriptionPackagesAsync(List<SubscriptionPackage> packages)
    {
        if (packages == null) packages = new List<SubscriptionPackage>();

        var existing = await _context.SubscriptionPackages.ToListAsync();
        var incomingIds = packages.Select(p => p.Id).ToHashSet();

        // Remove packages no longer present in incoming list
        var toRemove = existing.Where(e => !incomingIds.Contains(e.Id)).ToList();
        if (toRemove.Count > 0)
        {
            _context.SubscriptionPackages.RemoveRange(toRemove);
        }

        foreach (var item in packages)
        {
            var match = existing.FirstOrDefault(e => e.Id == item.Id);
            if (match == null)
            {
                item.CreatedAt = DateTime.UtcNow;
                item.UpdatedAt = DateTime.UtcNow;
                await _context.SubscriptionPackages.AddAsync(item);
            }
            else
            {
                match.Name = item.Name;
                match.Tagline = item.Tagline;
                match.MonthlyPrice = item.MonthlyPrice;
                match.YearlyPrice = item.YearlyPrice;
                match.Currency = item.Currency;
                match.MaxStudents = item.MaxStudents;
                match.MaxStaff = item.MaxStaff;
                match.MaxBranches = item.MaxBranches;
                match.StorageGb = item.StorageGb;
                match.IsPopular = item.IsPopular;
                match.Status = item.Status;
                match.FeaturesJson = item.FeaturesJson;
                match.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return await _context.SubscriptionPackages.OrderBy(p => p.CreatedAt).ToListAsync();
    }
}
