namespace SMS.Api.Services.Interfaces.ExaminationNew;

using SMS.Api.Dtos.ExaminationNew;
using System.Threading.Tasks;

public interface IExamMarksEntryService
{
    Task<MarksEntryOptionsDto> GetMarksEntryOptionsAsync();
    Task<StudentMarksSheetResponseDto> GetStudentMarksSheetAsync(string className, string sectionName, string subjectCode, string? search);
    Task<bool> SaveMarksSheetAsync(SaveMarksSheetRequestDto request);
    Task<bool> ClearMarksEntriesAsync(string className, string sectionName, string subjectCode);
}
