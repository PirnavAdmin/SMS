namespace SMS.Api.Services.Interfaces.TeacherScreens;

using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;

public interface ITeacherEducationService
{
    Task<int?> ResolveStaffIdAsync(int? userId, string? email);
    Task<List<TeacherEducationDto>> GetQualificationsAsync(int staffId);
    Task<TeacherEducationDto?> GetQualificationByIdAsync(int staffId, int qualificationId);
    Task<TeacherEducationDto?> AddQualificationAsync(int staffId, CreateTeacherEducationDto dto);
    Task<TeacherEducationDto?> UpdateQualificationAsync(int staffId, int qualificationId, UpdateTeacherEducationDto dto);
    Task<List<TeacherEducationDto>> BulkUpdateQualificationsAsync(int staffId, List<CreateTeacherEducationDto> dtoList);
    Task<bool> DeleteQualificationAsync(int staffId, int qualificationId);
}
