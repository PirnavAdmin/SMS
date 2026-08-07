namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;

public interface ITeacherAttendanceService
{
    Task<TeacherAttendanceDto?> GetTodayAttendanceAsync(
        string teacherEmail);

    Task<TeacherAttendancePagedResultDto> GetHistoryAsync(
        string teacherEmail,
        TeacherAttendanceFilterDto filter);

    Task<TeacherAttendanceDto> CheckInAsync(
        string teacherEmail,
        TeacherCheckInDto dto);

    Task<TeacherAttendanceDto> CheckOutAsync(
        string teacherEmail,
        TeacherCheckOutDto dto);

    Task<AttendanceCorrectionDto> CreateCorrectionAsync(
        string teacherEmail,
        CreateAttendanceCorrectionDto dto);

    Task<List<AttendanceCorrectionDto>> GetCorrectionsAsync(
        string teacherEmail);
}