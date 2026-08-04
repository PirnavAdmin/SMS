using System;
using System.Collections.Generic;
using System.Linq;
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
            .Include(s => s.Users)
            .FirstOrDefaultAsync(s => s.SchoolId == schoolId);
    }

    public async Task<School?> GetSchoolByCodeAsync(string schoolCode)
    {
        return await _context.Schools
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

    public async Task<List<User>> GetAdminsAsync(string? search)
    {
        var query = _context.Users
            .Include(u => u.School)
            .Include(u => u.Roles)
            .Where(u => u.Role == "Admin" || u.Roles.Any(r => r.RoleName == "Admin"))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanSearch = search.Trim();
            query = query.Where(u => u.FullName.Contains(cleanSearch) || (u.Email != null && u.Email.Contains(cleanSearch)));
        }

        return await query.OrderByDescending(u => u.CreatedAt).ToListAsync();
    }

    public async Task<User?> GetAdminByIdAsync(int adminId)
    {
        return await _context.Users
            .Include(u => u.School)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.UserId == adminId && (u.Role == "Admin" || u.Roles.Any(r => r.RoleName == "Admin")));
    }

    public async Task<Role?> GetRoleByNameAsync(string roleName)
    {
        return await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == roleName);
    }

    public async Task AddUserAsync(User user)
    {
        await _context.Users.AddAsync(user);
    }

    public async Task<bool> UserEmailExistsAsync(string email, int? excludeUserId = null)
    {
        if (excludeUserId.HasValue)
        {
            return await _context.Users.AnyAsync(u => u.Email == email && u.UserId != excludeUserId.Value);
        }
        return await _context.Users.AnyAsync(u => u.Email == email);
    }

    // --- Stats & Aggregations ---

    public async Task<int> GetCountByRoleAsync(string roleName, int? schoolId = null)
    {
        var query = _context.Users.AsQueryable();

        if (schoolId.HasValue)
        {
            query = query.Where(u => u.SchoolId == schoolId.Value);
        }

        // Match either Role column or list of Roles relationship
        return await query.CountAsync(u => u.Role == roleName || u.Roles.Any(r => r.RoleName == roleName));
    }

    public async Task<int> GetTotalUsersCountAsync(int? schoolId = null)
    {
        var query = _context.Users.AsQueryable();

        if (schoolId.HasValue)
        {
            query = query.Where(u => u.SchoolId == schoolId.Value);
        }

        return await query.CountAsync();
    }

    public async Task<List<KeyValuePair<string, int>>> GetSchoolGrowthMonthlyAsync()
    {
        var schools = await _context.Schools.AsNoTracking().ToListAsync();
        
        // Group by month and year in memory to avoid translation failures
        return schools
            .GroupBy(s => s.CreatedAt.ToString("MMM yyyy"))
            .Select(g => new KeyValuePair<string, int>(g.Key, g.Count()))
            .ToList();
    }

    // --- Audit Logging ---

    public async Task<List<AuditLog>> GetAuditLogsAsync(int? schoolId = null, int limit = 100)
    {
        var query = _context.AuditLogs.AsQueryable();

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
        var query = _context.SystemNotifications.AsQueryable();

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
}
