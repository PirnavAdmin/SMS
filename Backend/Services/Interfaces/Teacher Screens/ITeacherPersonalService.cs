namespace SMS.Api.Services.Interfaces.TeacherScreens;

using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;

public interface ITeacherPersonalService
{
    Task<int?> ResolveStaffIdAsync(int? userId, string? email);
    Task<TeacherPersonalInfoDto?> GetPersonalInfoAsync(int staffId);
    Task<TeacherPersonalInfoDto?> CreatePersonalInfoAsync(int staffId, CreateTeacherPersonalInfoDto dto);
    Task<TeacherPersonalInfoDto?> UpdatePersonalInfoAsync(int staffId, UpdateTeacherPersonalInfoDto dto);
    Task<bool> DeletePersonalInfoAsync(int staffId);
}
