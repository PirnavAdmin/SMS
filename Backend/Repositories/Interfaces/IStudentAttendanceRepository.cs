namespace SMS.Api.Repositories.Interfaces;

using SMS.Api.Dtos;
using SMS.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IStudentAttendanceRepository
{
    Task<List<StudentAttendance>> GetStudentAttendanceRecordsAsync(
        int? studentId,
        string? filterType,
        int? month,
        int? year,
        DateTime? date,
        DateTime? startDate,
        DateTime? endDate,
        string? statusFilter);

    Task<List<StudentAttendance>> GetAllAttendanceRecordsAsync(StudentAttendanceUniversalQueryDto query);

    Task<int> BulkSaveStudentAttendanceAsync(List<BulkStudentAttendanceRecordDto> records, int? staffId);

    Task AddStudentAttendanceAsync(StudentAttendance attendance);
    Task AddStudentAttendanceRangeAsync(IEnumerable<StudentAttendance> attendances);
    Task SaveChangesAsync();
}
