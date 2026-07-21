namespace SMS.Api.Repositories.Interfaces;

using SMS.Api.Models;

public interface IUserRepository
{
    Task<User?> GetByIdentifierAsync(string identifier);
    Task<User?> GetByIdAsync(int userId);
    Task<bool> ExistsAsync(string mobileNumber, string? email);
    Task AddAsync(User user);
    Task<Role?> GetRoleByIdAsync(int roleId);
    Task UpdatePasswordAsync(int userId, string newPasswordHash);
    Task SaveChangesAsync();
}