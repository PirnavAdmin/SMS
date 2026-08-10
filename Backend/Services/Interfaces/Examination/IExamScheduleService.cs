namespace SMS.Api.Services.Interfaces.Examination;

using SMS.Api.Dtos.Examination;
using System.Threading.Tasks;

public interface IExamScheduleService
{
    Task<ScheduleOptionsDto> GetScheduleOptionsAsync();
    Task<ClassSectionScheduleResponseDto> GetTimetableForClassSectionAsync(int? examId, string className, string sectionName);
    Task<bool> SaveTimetableAsync(SaveTimetableRequestDto request);
    Task<SchedulePreviewResponseDto> GetSchedulePreviewAsync(int? examId, string? academicYear, string? className, string? sectionName);
    Task<bool> DeleteSlotAsync(int slotId);
    Task<bool> ClearTimetableAsync(int? examId, string className, string sectionName);
}

