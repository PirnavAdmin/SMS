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
            query = query.Where(a => a.FullName.Contains(cleanSearch) || (a.Email != null && a.Email.Contains(cleanSearch)));
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
        try
        {
            var profile = await _context.PlatformCompanyProfiles.FirstOrDefaultAsync(p => p.Id == 1);
            if (profile != null)
            {
                return profile;
            }

            var initial = new PlatformCompanyProfile
            {
                Id = 1,
                CompanyName = "Main School",
                Tagline = "Multi-Tenant Educational Cloud Infrastructure",
                LogoUrl = "/pirnav-school-logo.png",
                SupportEmail = "superadmin@gmail.com",
                SupportPhone = "+91 9581768554",
                WebsiteUrl = "https://smscloud.portal",
                PrimaryColor = "#0284c7",
                UpdatedAt = DateTime.UtcNow
            };
            await _context.PlatformCompanyProfiles.AddAsync(initial);
            await _context.SaveChangesAsync();
            return initial;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SuperAdminRepository] GetCompanyProfileAsync fallback: {ex.Message}");
            return await LoadFallbackCompanyProfileFileAsync();
        }
    }

    public async Task<PlatformCompanyProfile> UpdateCompanyProfileAsync(PlatformCompanyProfile profile)
    {
        try
        {
            var existing = await _context.PlatformCompanyProfiles.FirstOrDefaultAsync(p => p.Id == 1);
            if (existing == null)
            {
                profile.Id = 1;
                profile.UpdatedAt = DateTime.UtcNow;
                await _context.PlatformCompanyProfiles.AddAsync(profile);
                existing = profile;
            }
            else
            {
                existing.CompanyName = profile.CompanyName;
                existing.Tagline = profile.Tagline;
                existing.LogoUrl = profile.LogoUrl;
                existing.SupportEmail = profile.SupportEmail;
                existing.SupportPhone = profile.SupportPhone;
                existing.WebsiteUrl = profile.WebsiteUrl;
                existing.PrimaryColor = profile.PrimaryColor;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
            await SaveFallbackCompanyProfileFileAsync(existing);
            return existing;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SuperAdminRepository] UpdateCompanyProfileAsync fallback: {ex.Message}");
            await SaveFallbackCompanyProfileFileAsync(profile);
            return profile;
        }
    }

    private static async Task<PlatformCompanyProfile> LoadFallbackCompanyProfileFileAsync()
    {
        var filePath = Path.Combine(AppContext.BaseDirectory, "platform_company_profile.json");
        if (File.Exists(filePath))
        {
            try
            {
                var json = await File.ReadAllTextAsync(filePath);
                var loaded = JsonSerializer.Deserialize<PlatformCompanyProfile>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (loaded != null) return loaded;
            }
            catch { }
        }

        return new PlatformCompanyProfile
        {
            Id = 1,
            CompanyName = "Main School",
            Tagline = "Multi-Tenant Educational Cloud Infrastructure",
            LogoUrl = "/pirnav-school-logo.png",
            SupportEmail = "superadmin@gmail.com",
            SupportPhone = "+91 9581768554",
            WebsiteUrl = "https://smscloud.portal",
            PrimaryColor = "#0284c7",
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static async Task SaveFallbackCompanyProfileFileAsync(PlatformCompanyProfile profile)
    {
        try
        {
            var filePath = Path.Combine(AppContext.BaseDirectory, "platform_company_profile.json");
            var json = JsonSerializer.Serialize(profile, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(filePath, json);
        }
        catch { }
    }
}
