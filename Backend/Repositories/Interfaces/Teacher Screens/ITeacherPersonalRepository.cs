namespace SMS.Api.Repositories.Interfaces.TeacherScreens;

using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;

public interface ITeacherPersonalRepository
{
    Task<int?> ResolveStaffIdAsync(int? userId, string? email);
    Task<TeacherPersonalInfoDto?> GetPersonalInfoByStaffIdAsync(int staffId);
    Task<TeacherPersonalInfoDto?> CreatePersonalInfoAsync(int staffId, CreateTeacherPersonalInfoDto dto);
    Task<TeacherPersonalInfoDto?> UpdatePersonalInfoAsync(int staffId, UpdateTeacherPersonalInfoDto dto);
    Task<bool> DeletePersonalInfoAsync(int staffId);
}
