namespace SMS.Api.Repositories.Implementations;

using System;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;
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
        var users = await _context.Users
            .FromSqlRaw("CALL sp_GetUserForLogin({0})", identifier)
            .ToListAsync();

        var user = users.FirstOrDefault();
        if (user != null)
        {
            // Explicitly load roles if the navigation property is not pre-populated
            var userWithRoles = await _context.Users
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.UserId == user.UserId);

            if (userWithRoles != null && userWithRoles.Roles.Any())
            {
                user.Roles = userWithRoles.Roles;
            }
        }

        return user;
    }

    public async Task RegisterUserProcedureAsync(string fullName, string? email, string mobileNumber, string passwordHash, int roleId)
    {
        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "CALL sp_RegisterUser({0}, {1}, {2}, {3}, {4})",
                fullName,
                email ?? (object)DBNull.Value,
                mobileNumber,
                passwordHash,
                roleId
            );
        }
        catch (MySqlException ex) when (ex.Number == 1644)
        {
            throw new InvalidOperationException(ex.Message);
        }
    }

    public async Task UpdatePasswordAsync(int userId, string newPasswordHash)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "CALL sp_ResetPassword({0}, {1})",
            userId,
            newPasswordHash
        );
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

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}