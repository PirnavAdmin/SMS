namespace SMS.Api.Services.Implementations.TeacherScreens;

using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Repositories.Interfaces.TeacherScreens;
using SMS.Api.Services.Interfaces.TeacherScreens;

public class TeacherEducationService : ITeacherEducationService
{
    private readonly ITeacherEducationRepository _repository;

    public TeacherEducationService(ITeacherEducationRepository repository)
    {
        _repository = repository;
    }

    public async Task<int?> ResolveStaffIdAsync(int? userId, string? email)
    {
        return await _repository.ResolveStaffIdAsync(userId, email);
    }

    public async Task<List<TeacherEducationDto>> GetQualificationsAsync(int staffId)
    {
        return await _repository.GetQualificationsByStaffIdAsync(staffId);
    }

    public async Task<TeacherEducationDto?> GetQualificationByIdAsync(int staffId, int qualificationId)
    {
        return await _repository.GetQualificationByIdAsync(staffId, qualificationId);
    }

    public async Task<TeacherEducationDto?> AddQualificationAsync(int staffId, CreateTeacherEducationDto dto)
    {
        return await _repository.AddQualificationAsync(staffId, dto);
    }

    public async Task<TeacherEducationDto?> UpdateQualificationAsync(int staffId, int qualificationId, UpdateTeacherEducationDto dto)
    {
        return await _repository.UpdateQualificationAsync(staffId, qualificationId, dto);
    }

    public async Task<List<TeacherEducationDto>> BulkUpdateQualificationsAsync(int staffId, List<CreateTeacherEducationDto> dtoList)
    {
        return await _repository.BulkUpdateQualificationsAsync(staffId, dtoList);
    }

    public async Task<bool> DeleteQualificationAsync(int staffId, int qualificationId)
    {
        return await _repository.DeleteQualificationAsync(staffId, qualificationId);
    }
}
