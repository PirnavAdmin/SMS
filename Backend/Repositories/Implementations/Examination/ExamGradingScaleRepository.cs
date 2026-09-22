namespace SMS.Api.Repositories.Implementations.Examination;

using SMS.Api.Data;
using SMS.Api.Models.Examination;
using SMS.Api.Repositories.Interfaces.Examination;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamGradingScaleRepository : IExamGradingScaleRepository
{
    private readonly AppDbContext _context;

    private static readonly List<NewGradingScaleRule> _inMemoryRules = new List<NewGradingScaleRule>();

    public ExamGradingScaleRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<NewGradingScaleRule>> GetScaleRulesAsync(string examType)
    {
        try
        {
            var dbRules = await _context.NewGradingScaleRules
                .AsNoTracking()
                .Where(r => r.ExamType == examType || r.ExamType == "All")
                .ToListAsync();

            if (dbRules != null && dbRules.Any())
                return dbRules;
        }
        catch
        {
            // Fallback
        }

        return _inMemoryRules
            .Where(r => r.ExamType.Equals(examType, StringComparison.OrdinalIgnoreCase) || r.ExamType.Equals("All", StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    public async Task<bool> SaveScaleRulesAsync(string examType, List<NewGradingScaleRule> rules)
    {
        try
        {
            var existingDb = await _context.NewGradingScaleRules
                .Where(r => r.ExamType == examType || r.ExamType == "All")
                .ToListAsync();

            if (existingDb.Any())
            {
                _context.NewGradingScaleRules.RemoveRange(existingDb);
            }

            foreach (var r in rules)
            {
                r.RuleId = 0; // Reset RuleId for AUTO_INCREMENT
            }

            await _context.NewGradingScaleRules.AddRangeAsync(rules);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Fallback
        }

        _inMemoryRules.RemoveAll(r => r.ExamType.Equals(examType, StringComparison.OrdinalIgnoreCase) || r.ExamType.Equals("All", StringComparison.OrdinalIgnoreCase));
        _inMemoryRules.AddRange(rules);

        return true;
    }

    public async Task<bool> DeleteScaleRuleAsync(int ruleId)
    {
        _inMemoryRules.RemoveAll(r => r.RuleId == ruleId);

        try
        {
            var dbRule = await _context.NewGradingScaleRules.FirstOrDefaultAsync(r => r.RuleId == ruleId);
            if (dbRule != null)
            {
                _context.NewGradingScaleRules.Remove(dbRule);
                await _context.SaveChangesAsync();
            }
            return true;
        }
        catch
        {
            return true;
        }
    }
}

