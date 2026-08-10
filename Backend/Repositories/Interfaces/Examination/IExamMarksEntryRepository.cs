namespace SMS.Api.Repositories.Interfaces.Examination;

using SMS.Api.Models.Examination;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamMarksEntryRepository
{
    Task<List<NewStudentMarksEntry>> GetMarksEntriesAsync(string className, string sectionName, string subjectCode);
    Task<bool> SaveMarksEntriesAsync(string className, string sectionName, string subjectCode, List<NewStudentMarksEntry> entries, bool isFinalSubmit);
}

