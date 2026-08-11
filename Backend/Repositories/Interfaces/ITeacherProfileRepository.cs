using System.Threading.Tasks;
using SMS.Api.Dtos.Teacher;
using SMS.Api.Models;

namespace SMS.Api.Repositories.Interfaces;

public interface ITeacherProfileRepository
{
    Task<int?> GetStaffIdByUserIdOrEmailAsync(int? userId, string? email);
    Task<Staff?> GetStaffProfileByStaffIdAsync(int staffId);
    Task<bool> UpdateTeacherProfileAsync(int staffId, UpdateMyTeacherProfileDto dto);
    Task<TeacherAssignmentsResponseDto> GetTeacherAssignmentsByStaffIdAsync(int staffId, string? academicYear);
}
