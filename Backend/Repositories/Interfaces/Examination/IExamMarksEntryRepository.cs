namespace SMS.Api.Repositories.Interfaces.Examination;

using SMS.Api.Models.Examination;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamMarksEntryRepository
{
    Task<List<string>> GetClassNamesAsync();
    Task<List<SMS.Api.Dtos.Examination.SubjectOptionItemDto>> GetSubjectsAsync();
    Task<List<NewStudentMarksEntry>> GetMarksEntriesAsync(string className, string sectionName, string subjectCode);
    Task<List<NewStudentMarksEntry>> GetAllMarksForClassSectionAsync(string? className = null, string? sectionName = null);
    Task<bool> SaveMarksEntriesAsync(string className, string sectionName, string subjectCode, List<NewStudentMarksEntry> entries, bool isFinalSubmit);
    Task<bool> SaveBulkMarksEntriesAsync(List<NewStudentMarksEntry> entries);
    Task<bool> ClearMarksEntriesAsync(string className, string sectionName, string subjectCode);
}

