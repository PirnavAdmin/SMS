namespace SMS.Api.Repositories.Interfaces.StaffManagement;

using SMS.Api.Dtos;
using SMS.Api.Models;

public interface ITeacherAttendanceRepository
{
    Task<Staff?> GetTeacherByEmailAsync(string email);

    Task<StaffAttendance?> GetTodayAttendanceAsync(
        int staffId,
        DateTime date);

    Task<TeacherAttendancePagedResultDto> GetHistoryAsync(
        int staffId,
        TeacherAttendanceFilterDto filter);

    Task<StaffAttendance> CreateAttendanceAsync(
        StaffAttendance attendance);

    Task UpdateAttendanceAsync(
        StaffAttendance attendance);

    Task<bool> HasPendingCorrectionAsync(
        int staffId,
        DateTime attendanceDate);

    Task<TeacherAttendanceCorrection>
        CreateCorrectionAsync(
            TeacherAttendanceCorrection correction);

    Task<List<AttendanceCorrectionDto>>
        GetCorrectionsAsync(int staffId);
}
