namespace SMS.Api.Repositories.Interfaces.Examination;

using SMS.Api.Models.Examination;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamResultsReportsRepository
{
    Task<List<string>> GetClassNamesAsync();
    Task<List<NewStudentExamResult>> GetExamResultsAsync(string className, string sectionName);
    Task<bool> SaveExamResultsAsync(string className, string sectionName, List<NewStudentExamResult> results);
    Task<bool> ClearExamResultsAsync(string className, string sectionName);
    Task<bool> UpdateExamResultAsync(NewStudentExamResult result);
}

