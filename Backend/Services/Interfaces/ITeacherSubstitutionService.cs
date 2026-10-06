namespace SMS.Api.Services.Interfaces;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos;

public interface ITeacherSubstitutionService
{
    Task<List<TeacherSubstitutionDto>> GetSubstitutionsAsync(DateTime? date, int? teacherId, string? teacherName, string? academicYear, string? branchName);
    
    Task<List<AbsentTeacherScheduleDto>> GetAbsentTeachersScheduleAsync(DateTime date, string? academicYear, string? branchName);
    
    Task<List<AvailableLeisureTeacherDto>> GetAvailableLeisureTeachersAsync(DateTime date, string dayOfWeek, string startTime, string endTime, int? subjectId, int? excludeTeacherId = null);
    
    Task<TeacherSubstitutionDto> AssignSubstitutionAsync(AssignTeacherSubstitutionDto dto, string? currentUserName = null);
    
    Task<AutoReplaceSubstitutionsResultDto> AutoReplaceSubstitutionsAsync(AutoReplaceSubstitutionsRequestDto dto, string? currentUserName = null);
    
    Task<bool> CancelSubstitutionAsync(int substitutionId);
}
