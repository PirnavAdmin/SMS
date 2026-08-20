namespace SMS.Api.Services.Implementations.TeacherScreens;

using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Repositories.Interfaces.TeacherScreens;
using SMS.Api.Services.Interfaces.TeacherScreens;

public class TeacherAddressService : ITeacherAddressService
{
    private readonly ITeacherAddressRepository _repository;

    public TeacherAddressService(ITeacherAddressRepository repository)
    {
        _repository = repository;
    }

    public async Task<int?> ResolveStaffIdAsync(int? userId, string? email)
    {
        return await _repository.ResolveStaffIdAsync(userId, email);
    }

    public async Task<TeacherAddressDto?> GetAddressAsync(int staffId)
    {
        return await _repository.GetAddressByStaffIdAsync(staffId);
    }

    public async Task<TeacherAddressDto?> CreateAddressAsync(int staffId, CreateTeacherAddressDto dto)
    {
        return await _repository.CreateAddressAsync(staffId, dto);
    }

    public async Task<TeacherAddressDto?> UpdateAddressAsync(int staffId, UpdateTeacherAddressDto dto)
    {
        return await _repository.UpdateAddressAsync(staffId, dto);
    }

    public async Task<bool> DeleteAddressAsync(int staffId)
    {
        return await _repository.DeleteAddressAsync(staffId);
    }
}
