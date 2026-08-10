using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations;

public class AdminRepository : IAdminRepository
{
    private readonly AppDbContext _context;

    public AdminRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Admin?> GetByIdentifierAsync(string identifier)
    {
        try
        {
            return await _context.Admins
                .AsNoTracking()
                .Include(a => a.Roles)
                .FirstOrDefaultAsync(a => a.Email == identifier || a.MobileNumber == identifier);
        }
        catch
        {
            return await _context.Admins
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Email == identifier || a.MobileNumber == identifier);
        }
    }

    public async Task<Admin?> GetByIdAsync(int adminId)
    {
        return await _context.Admins
            .AsNoTracking()
            .Include(a => a.Roles)
            .FirstOrDefaultAsync(a => a.AdminId == adminId);
    }

    public async Task UpdatePasswordAsync(int adminId, string newPasswordHash)
    {
        var admin = await _context.Admins.FindAsync(adminId);
        if (admin != null)
        {
            admin.PasswordHash = newPasswordHash;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(string mobileNumber, string? email)
    {
        return await _context.Admins.AnyAsync(a =>
            a.MobileNumber == mobileNumber || (!string.IsNullOrEmpty(email) && a.Email == email));
    }

    public async Task AddAsync(Admin admin) => await _context.Admins.AddAsync(admin);

    public async Task<Role?> GetRoleByIdAsync(int roleId) => await _context.Roles.FindAsync(roleId);

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}
