namespace SMS.Api.Repositories.Interfaces.ExaminationNew;

using SMS.Api.Models.ExaminationNew;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamGradingScaleRepository
{
    Task<List<NewGradingScaleRule>> GetScaleRulesAsync(string examType);
    Task<bool> SaveScaleRulesAsync(string examType, List<NewGradingScaleRule> rules);
}
