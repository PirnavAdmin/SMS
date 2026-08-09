namespace SMS.Api.Repositories.Interfaces.ExaminationNew;

using SMS.Api.Models.ExaminationNew;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamMarksEntryRepository
{
    Task<List<NewStudentMarksEntry>> GetMarksEntriesAsync(string className, string sectionName, string subjectCode);
    Task<bool> SaveMarksEntriesAsync(string className, string sectionName, string subjectCode, List<NewStudentMarksEntry> entries, bool isFinalSubmit);
}
