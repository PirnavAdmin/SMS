using System.Threading.Tasks;
using SMS.Api.Dtos.Teacher;

namespace SMS.Api.Services.Interfaces;

public interface ITeacherProfileService
{
    Task<int?> ResolveStaffIdAsync(int? userId, string? email);
    Task<TeacherSelfProfileDto?> GetMyProfileAsync(int staffId);
    Task<bool> UpdateMyProfileAsync(int staffId, UpdateMyTeacherProfileDto dto);
    Task<TeacherAssignmentsResponseDto> GetMyAssignmentsAsync(int staffId, string? academicYear);
}
