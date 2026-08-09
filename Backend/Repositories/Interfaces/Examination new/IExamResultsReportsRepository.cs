namespace SMS.Api.Repositories.Interfaces.ExaminationNew;

using SMS.Api.Models.ExaminationNew;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamResultsReportsRepository
{
    Task<List<NewStudentExamResult>> GetExamResultsAsync(string className, string sectionName);
    Task<bool> SaveExamResultsAsync(string className, string sectionName, List<NewStudentExamResult> results);
}
