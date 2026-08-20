namespace SMS.Api.Repositories.Interfaces.TeacherScreens;

using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;

public interface ITeacherAddressRepository
{
    Task<int?> ResolveStaffIdAsync(int? userId, string? email);
    Task<TeacherAddressDto?> GetAddressByStaffIdAsync(int staffId);
    Task<TeacherAddressDto?> CreateAddressAsync(int staffId, CreateTeacherAddressDto dto);
    Task<TeacherAddressDto?> UpdateAddressAsync(int staffId, UpdateTeacherAddressDto dto);
    Task<bool> DeleteAddressAsync(int staffId);
}
