namespace SMS.Api.Repositories.Interfaces.TeacherScreens;

using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;

public interface ITeacherExperienceRepository
{
    Task<int?> ResolveStaffIdAsync(int? userId, string? email);
    Task<List<TeacherExperienceDto>> GetExperiencesByStaffIdAsync(int staffId);
    Task<TeacherExperienceDto?> GetExperienceByIdAsync(int staffId, int experienceId);
    Task<TeacherExperienceDto?> AddExperienceAsync(int staffId, CreateTeacherExperienceDto dto);
    Task<TeacherExperienceDto?> UpdateExperienceAsync(int staffId, int experienceId, UpdateTeacherExperienceDto dto);
    Task<List<TeacherExperienceDto>> BulkUpdateExperiencesAsync(int staffId, List<CreateTeacherExperienceDto> dtoList);
    Task<bool> DeleteExperienceAsync(int staffId, int experienceId);
}
