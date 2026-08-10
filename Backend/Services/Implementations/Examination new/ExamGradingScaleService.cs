namespace SMS.Api.Services.Implementations.ExaminationNew;

using SMS.Api.Dtos.ExaminationNew;
using SMS.Api.Models.ExaminationNew;
using SMS.Api.Repositories.Interfaces.ExaminationNew;
using SMS.Api.Services.Interfaces.ExaminationNew;
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

    public async Task<GradingScaleOptionsDto> GetGradingScaleOptionsAsync()
    {
        return new GradingScaleOptionsDto
        {
            ExamTypes = new List<string> { "All", "Summative Assessment (SA)", "Formative Assessment (FA)", "Unit Test" },
            PassFailOptions = new List<string> { "PASS", "FAIL" }
        };
    }

    public async Task<GradingScaleResponseDto> GetGradingScaleRulesAsync(string? examType)
    {
        string targetType = string.IsNullOrWhiteSpace(examType) ? "All" : examType;
        var rules = await _repository.GetScaleRulesAsync(targetType);

        return new GradingScaleResponseDto
        {
            ExamType = targetType,
            ScaleRules = rules.Select(r => new GradingScaleRuleItemDto
            {
                RuleId = r.RuleId,
                Grade = r.Grade,
                MinMarks = r.MinMarks,
                MaxMarks = r.MaxMarks,
                Gpa = r.Gpa,
                PassFail = r.PassFail,
                Remarks = r.Remarks
            }).ToList()
        };
    }

    public async Task<bool> SaveGradingScaleRulesAsync(SaveGradingScaleRequestDto request)
    {
        var entities = request.ScaleRules.Select(r => new NewGradingScaleRule
        {
            RuleId = r.RuleId,
            ExamType = request.ExamType,
            Grade = r.Grade,
            MinMarks = r.MinMarks,
            MaxMarks = r.MaxMarks,
            Gpa = r.Gpa,
            PassFail = r.PassFail,
            Remarks = r.Remarks
        }).ToList();

        return await _repository.SaveScaleRulesAsync(request.ExamType, entities);
    }

    public async Task<bool> DeleteScaleRuleAsync(int ruleId)
    {
        return await _repository.DeleteScaleRuleAsync(ruleId);
    }
}
