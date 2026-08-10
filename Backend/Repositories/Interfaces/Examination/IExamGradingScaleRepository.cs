namespace SMS.Api.Repositories.Interfaces.Examination;

using SMS.Api.Models.Examination;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamGradingScaleRepository
{
    Task<List<NewGradingScaleRule>> GetScaleRulesAsync(string examType);
    Task<bool> SaveScaleRulesAsync(string examType, List<NewGradingScaleRule> rules);
    Task<bool> DeleteScaleRuleAsync(int ruleId);
}

