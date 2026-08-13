namespace SMS.Api.Services.Interfaces.AcademicManagement;

using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos;
using SMS.Api.Dtos.AcademicManagement;

public interface ITimetableService
{
    // Period Settings Master
    Task<List<PeriodSettingDto>> GetPeriodSettingsAsync();
    Task<PeriodSettingDto> SavePeriodSettingAsync(SavePeriodSettingDto dto);
    Task<bool> DeletePeriodSettingAsync(int periodId);

    // Class Timetable Matrix & Slots
    Task<ClassTimetableGridDto> GetClassTimetableGridAsync(int classId, int sectionId, string academicYear = "2026-2027");
    Task<TimetableSlotDto> SaveTimetableSlotAsync(SaveTimetableSlotDto dto);
    Task<bool> DeleteTimetableSlotAsync(int slotId);
    Task<ClassTimetableGridDto> PublishTimetableAsync(PublishTimetableDto dto);

    // Auto-Generated Teacher & Student Timetables
    Task<TeacherTimetableDto> GetTeacherTimetableAsync(int teacherId, string academicYear = "2026-2027");
    Task<StudentTimetableDto> GetStudentTimetableAsync(int classId, int sectionId, string academicYear = "2026-2027");

    // Copy Timetable
    Task<ClassTimetableGridDto> CopyTimetableAsync(CopyTimetableDto dto);

    // Class Subjects Candidate Helper
    Task<List<ClassSubjectQuotaDto>> GetClassSubjectsCandidatesAsync(int classId, int sectionId);

    // Automatic Timetable Generation & Validation
    Task<List<TimetableSlotDto>> GenerateTimetableAsync(GenerateTimetableRequestDto dto);
    Task<TimetableValidationResultDto> ValidateTimetableAsync(int classId, int sectionId, string academicYear);
}
