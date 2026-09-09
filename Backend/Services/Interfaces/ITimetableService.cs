namespace SMS.Api.Services.Interfaces;

using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos;

public interface ITimetableService
{
    // Period Settings Master
    Task<List<PeriodSettingDto>> GetPeriodSettingsAsync();
    Task<PeriodSettingDto> SavePeriodSettingAsync(SavePeriodSettingDto dto);
    Task<bool> DeletePeriodSettingAsync(int periodId);
    Task<List<PeriodSettingDto>> SyncPeriodSettingsAsync(List<SavePeriodSettingDto> dtos);

    // Class Timetable Matrix & Slots
    Task<ClassTimetableGridDto> GetClassTimetableGridAsync(int classId, int sectionId, string academicYear = "");
    Task<TimetableSlotDto> SaveTimetableSlotAsync(SaveTimetableSlotDto dto);
    Task<bool> DeleteTimetableSlotAsync(int slotId);
    Task<ClassTimetableGridDto> PublishTimetableAsync(PublishTimetableDto dto);

    // Auto-Generated Teacher & Student Timetables
    Task<TeacherTimetableDto> GetTeacherTimetableAsync(int teacherId, string academicYear = "");
    Task<StudentTimetableDto> GetStudentTimetableAsync(int classId, int sectionId, string academicYear = "");

    // Copy Timetable
    Task<ClassTimetableGridDto> CopyTimetableAsync(CopyTimetableDto dto);

    // Class Subjects Candidate Helper
    Task<List<ClassSubjectQuotaDto>> GetClassSubjectsCandidatesAsync(int classId, int sectionId);

    // Timetable Generation and Validation
    Task<GenerateTimetableResponseDto> GenerateTimetableAsync(GenerateTimetableRequestDto dto, System.Threading.CancellationToken cancellationToken = default);
    Task<TimetableValidationResultDto> ValidateTimetableAsync(int classId, int sectionId, string academicYear);
}
