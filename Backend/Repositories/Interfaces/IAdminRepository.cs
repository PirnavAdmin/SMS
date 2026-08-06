using System.Threading.Tasks;
using SMS.Api.Models;

namespace SMS.Api.Repositories.Interfaces;

public interface IAdminRepository
{
    Task<Admin?> GetByIdentifierAsync(string identifier);
    Task<Admin?> GetByIdAsync(int adminId);
    Task UpdatePasswordAsync(int adminId, string newPasswordHash);
    Task<bool> ExistsAsync(string mobileNumber, string? email);
    Task AddAsync(Admin admin);
    Task<Role?> GetRoleByIdAsync(int roleId);
    Task SaveChangesAsync();
}
