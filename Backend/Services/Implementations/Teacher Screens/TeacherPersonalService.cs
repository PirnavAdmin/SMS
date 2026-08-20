namespace SMS.Api.Services.Implementations.TeacherScreens;

using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Repositories.Interfaces.TeacherScreens;
using SMS.Api.Services.Interfaces.TeacherScreens;

public class TeacherPersonalService : ITeacherPersonalService
{
    private readonly ITeacherPersonalRepository _repository;

    public TeacherPersonalService(ITeacherPersonalRepository repository)
    {
        _repository = repository;
    }

    public async Task<int?> ResolveStaffIdAsync(int? userId, string? email)
    {
        return await _repository.ResolveStaffIdAsync(userId, email);
    }

    public async Task<TeacherPersonalInfoDto?> GetPersonalInfoAsync(int staffId)
    {
        return await _repository.GetPersonalInfoByStaffIdAsync(staffId);
    }

    public async Task<TeacherPersonalInfoDto?> CreatePersonalInfoAsync(int staffId, CreateTeacherPersonalInfoDto dto)
    {
        return await _repository.CreatePersonalInfoAsync(staffId, dto);
    }

    public async Task<TeacherPersonalInfoDto?> UpdatePersonalInfoAsync(int staffId, UpdateTeacherPersonalInfoDto dto)
    {
        return await _repository.UpdatePersonalInfoAsync(staffId, dto);
    }

    public async Task<bool> DeletePersonalInfoAsync(int staffId)
    {
        return await _repository.DeletePersonalInfoAsync(staffId);
    }
}
