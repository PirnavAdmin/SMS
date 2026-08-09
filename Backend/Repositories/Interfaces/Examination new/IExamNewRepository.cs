namespace SMS.Api.Repositories.Interfaces.ExaminationNew;

using SMS.Api.Models.ExaminationNew;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamNewRepository
{
    Task<List<NewExamination>> GetAllExamsAsync();
    Task<NewExamination?> GetExamByIdAsync(int examId);
    Task<NewExamination> SaveExamDetailsAsync(NewExamination exam);
    Task<bool> SaveSubjectConfigsAsync(int examId, string className, List<NewExamSubjectConfig> configs, bool markAsScheduled);
}
