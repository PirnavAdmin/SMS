namespace SMS.Api.Services.Interfaces.ExaminationNew;

using SMS.Api.Dtos.ExaminationNew;
using System.Threading.Tasks;

public interface IExamGradingScaleService
{
    Task<GradingScaleOptionsDto> GetGradingScaleOptionsAsync();
    Task<GradingScaleResponseDto> GetGradingScaleRulesAsync(string? examType);
    Task<bool> SaveGradingScaleRulesAsync(SaveGradingScaleRequestDto request);
}
