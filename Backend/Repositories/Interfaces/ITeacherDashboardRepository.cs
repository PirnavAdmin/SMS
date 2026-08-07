namespace SMS.Api.Repositories.Interfaces;

using SMS.Api.Dtos;
using SMS.Api.Models;

public interface ITeacherDashboardRepository
{
    Task<Staff?> GetTeacherByEmailAsync(string email);

    Task<int> GetAssignedClassCountAsync(int staffId);

    Task<int> GetTotalStudentCountAsync(int staffId);

    Task<int> GetTodayClassCountAsync(
        int staffId,
        string dayOfWeek);

    Task<int> GetPendingHomeworkCountAsync(
        string teacherName);

    Task<int> GetPendingLeaveCountAsync(int staffId);

    Task<int> GetUnreadNotificationCountAsync(
        int? schoolId);

    Task<StaffAttendance?> GetTodayAttendanceAsync(
        int staffId,
        DateTime date);

    Task<List<TeacherScheduleDto>> GetTodayScheduleAsync(
        int staffId,
        string dayOfWeek);
}