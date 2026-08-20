namespace SMS.Api.Services.Implementations.TeacherScreens;

using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Repositories.Interfaces.TeacherScreens;
using SMS.Api.Services.Interfaces.TeacherScreens;

public class TeacherExperienceService : ITeacherExperienceService
{
    private readonly ITeacherExperienceRepository _repository;

    public TeacherExperienceService(ITeacherExperienceRepository repository)
    {
        _repository = repository;
    }

    public async Task<int?> ResolveStaffIdAsync(int? userId, string? email)
    {
        return await _repository.ResolveStaffIdAsync(userId, email);
    }

    public async Task<List<TeacherExperienceDto>> GetExperiencesAsync(int staffId)
    {
        return await _repository.GetExperiencesByStaffIdAsync(staffId);
    }

    public async Task<TeacherExperienceDto?> GetExperienceByIdAsync(int staffId, int experienceId)
    {
        return await _repository.GetExperienceByIdAsync(staffId, experienceId);
    }

    public async Task<TeacherExperienceDto?> AddExperienceAsync(int staffId, CreateTeacherExperienceDto dto)
    {
        return await _repository.AddExperienceAsync(staffId, dto);
    }

    public async Task<TeacherExperienceDto?> UpdateExperienceAsync(int staffId, int experienceId, UpdateTeacherExperienceDto dto)
    {
        return await _repository.UpdateExperienceAsync(staffId, experienceId, dto);
    }

    public async Task<List<TeacherExperienceDto>> BulkUpdateExperiencesAsync(int staffId, List<CreateTeacherExperienceDto> dtoList)
    {
        return await _repository.BulkUpdateExperiencesAsync(staffId, dtoList);
    }

    public async Task<bool> DeleteExperienceAsync(int staffId, int experienceId)
    {
        return await _repository.DeleteExperienceAsync(staffId, experienceId);
    }
}
