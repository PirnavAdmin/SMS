namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;
using System.Threading.Tasks;

public interface IStudentAttendanceService
{
    Task<StudentAttendanceRegisterResponseDto> GetStudentAttendanceRegisterAsync(StudentAttendanceRegisterQueryDto query);
    Task<bool> MarkStudentAttendanceAsync(MarkStudentAttendanceDto dto);
}
