namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IStudentAttendanceService
{
    Task<StudentAttendanceRegisterResponseDto> GetStudentAttendanceRegisterAsync(StudentAttendanceRegisterQueryDto query);
    Task<List<StudentAttendanceUniversalDto>> GetAllAttendanceRecordsAsync(StudentAttendanceUniversalQueryDto query);
    Task<BulkSaveStudentAttendanceResponseDto> BulkSaveStudentAttendanceAsync(BulkSaveStudentAttendanceDto dto, int? staffId);
    Task<bool> MarkStudentAttendanceAsync(MarkStudentAttendanceDto dto);
}
