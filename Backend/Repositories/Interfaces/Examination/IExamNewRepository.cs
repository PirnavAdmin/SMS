namespace SMS.Api.Repositories.Interfaces.Examination;

using SMS.Api.Models.Examination;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamNewRepository
{
    Task<List<NewExamination>> GetAllExamsAsync();
    Task<NewExamination?> GetExamByIdAsync(int examId);
    Task<NewExamination> SaveExamDetailsAsync(NewExamination exam);
    Task<bool> SaveSubjectConfigsAsync(int examId, string className, List<NewExamSubjectConfig> configs, bool markAsScheduled);
    Task<List<NewExamSubjectConfig>> GetSubjectConfigsAsync(int examId, string className);
    Task<bool> DeleteExamAsync(int examId);
}

