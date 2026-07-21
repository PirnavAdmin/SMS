namespace SMS.Api.Repositories.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdentifierAsync(string identifier)
    {
        return await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == identifier || u.MobileNumber == identifier);
    }

    public async Task<User?> GetByIdAsync(int userId)
    {
        return await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    public async Task<bool> ExistsAsync(string mobileNumber, string? email)
    {
        return await _context.Users.AnyAsync(u =>
            u.MobileNumber == mobileNumber || (!string.IsNullOrEmpty(email) && u.Email == email));
    }

    public async Task AddAsync(User user) => await _context.Users.AddAsync(user);

    public async Task<Role?> GetRoleByIdAsync(int roleId) => await _context.Roles.FindAsync(roleId);

    public async Task UpdatePasswordAsync(int userId, string newPasswordHash)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null) user.PasswordHash = newPasswordHash;
    }

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}

