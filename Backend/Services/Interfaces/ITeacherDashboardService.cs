namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;

public interface ITeacherDashboardService
{
    Task<TeacherDashboardDto> GetDashboardAsync(
        string teacherEmail,
        int? schoolId);
}