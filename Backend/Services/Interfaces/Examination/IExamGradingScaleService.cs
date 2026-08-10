namespace SMS.Api.Services.Interfaces.Examination;

using SMS.Api.Dtos.Examination;
using System.Threading.Tasks;

public interface IExamGradingScaleService
{
    Task<GradingScaleOptionsDto> GetGradingScaleOptionsAsync();
    Task<GradingScaleResponseDto> GetGradingScaleRulesAsync(string? examType);
    Task<bool> SaveGradingScaleRulesAsync(SaveGradingScaleRequestDto request);
    Task<bool> DeleteScaleRuleAsync(int ruleId);
}

