namespace SMS.Api.Services.Implementations.Examination;

using SMS.Api.Dtos.Examination;
using SMS.Api.Models.Examination;
using SMS.Api.Repositories.Interfaces.Examination;
using SMS.Api.Services.Interfaces.Examination;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamGradingScaleService : IExamGradingScaleService
{
    private readonly IExamGradingScaleRepository _repository;

    public ExamGradingScaleService(IExamGradingScaleRepository repository)
    {
        _repository = repository;
    }

    public Task<GradingScaleOptionsDto> GetGradingScaleOptionsAsync()
    {
        return Task.FromResult(new GradingScaleOptionsDto());
    }

    public async Task<GradingScaleResponseDto> GetGradingScaleRulesAsync(string? examType)
    {
        string targetType = string.IsNullOrWhiteSpace(examType) ? "All" : examType;
        var rules = await _repository.GetScaleRulesAsync(targetType);

        var ruleDtos = rules.Select(r => new GradingScaleRuleItemDto
        {
            RuleId = r.RuleId,
            Grade = r.Grade,
            MinMarks = r.MinMarks,
            MaxMarks = r.MaxMarks,
            Gpa = r.Gpa,
            PassFail = r.PassFail,
            Remarks = r.Remarks
        }).OrderByDescending(r => r.MinMarks).ToList();

        return new GradingScaleResponseDto
        {
            ExamType = targetType,
            ScaleRules = ruleDtos
        };
    }

    public async Task<bool> SaveGradingScaleRulesAsync(SaveGradingScaleRequestDto request)
    {
        string targetType = string.IsNullOrWhiteSpace(request.ExamType) ? "All" : request.ExamType;

        var entities = request.ScaleRules.Select(r => new NewGradingScaleRule
        {
            RuleId = r.RuleId,
            ExamType = targetType,
            Grade = r.Grade,
            MinMarks = r.MinMarks,
            MaxMarks = r.MaxMarks,
            Gpa = r.Gpa,
            PassFail = r.PassFail,
            Remarks = r.Remarks
        }).ToList();

        return await _repository.SaveScaleRulesAsync(targetType, entities);
    }
}

