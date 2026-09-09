namespace SMS.Api.Services.Interfaces;

using System;
using System.Threading.Tasks;
using SMS.Api.Dtos;

public interface ITimetableValidationService
{
    Task<TimetableValidationResultDto> ValidateTimetableAsync(int classId, int sectionId, string academicYear);
    Task ValidateWeeklySubjectLimitAsync(int headerId, int classId, int subjectId, string subjectName, int? excludeSlotId = null);
    Task ValidateSlotConflictsAsync(int headerId, int teacherId, string teacherName, string? roomNo, string dayOfWeek, TimeSpan startTime, TimeSpan endTime, int? excludeSlotId = null);
}
