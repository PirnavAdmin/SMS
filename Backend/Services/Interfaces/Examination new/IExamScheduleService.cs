namespace SMS.Api.Services.Interfaces.ExaminationNew;

using SMS.Api.Dtos.ExaminationNew;
using System.Threading.Tasks;

public interface IExamScheduleService
{
    Task<ScheduleOptionsDto> GetScheduleOptionsAsync();
    Task<ClassSectionScheduleResponseDto> GetTimetableForClassSectionAsync(string className, string sectionName);
    Task<bool> SaveTimetableAsync(SaveTimetableRequestDto request);
    Task<SchedulePreviewResponseDto> GetSchedulePreviewAsync(string? academicYear, string? className, string? sectionName);
}
