using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        // Replaces CALL sp_GetUserForLogin
        public async Task<User?> GetByIdentifierAsync(string identifier)
        {
            return await _context.Users
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.Email == identifier || u.MobileNumber == identifier);
        }

        // Replaces CALL sp_RegisterUser
        public async Task RegisterUserProcedureAsync(string fullName, string? email, string mobileNumber, string passwordHash, int roleId)
        {
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null)
            {
                throw new InvalidOperationException($"Role with ID {roleId} does not exist.");
            }

            var user = new User
            {
                FullName = fullName,
                Email = email,
                MobileNumber = mobileNumber,
                PasswordHash = passwordHash,
                UserType = role.RoleName,
                IsEmailVerified = false,
                IsMobileVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            user.Roles.Add(role);

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        // Replaces CALL sp_ResetPassword
        public async Task UpdatePasswordAsync(int userId, string newPasswordHash)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.PasswordHash = newPasswordHash;
                await _context.SaveChangesAsync();
            }
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
}