namespace SMS.Api.Services.Interfaces.TeacherScreens;

using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;

public interface ITeacherAddressService
{
    Task<int?> ResolveStaffIdAsync(int? userId, string? email);
    Task<TeacherAddressDto?> GetAddressAsync(int staffId);
    Task<TeacherAddressDto?> CreateAddressAsync(int staffId, CreateTeacherAddressDto dto);
    Task<TeacherAddressDto?> UpdateAddressAsync(int staffId, UpdateTeacherAddressDto dto);
    Task<bool> DeleteAddressAsync(int staffId);
}
