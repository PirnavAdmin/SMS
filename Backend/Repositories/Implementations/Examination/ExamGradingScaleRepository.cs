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
        string targetType = string.IsNullOrWhiteSpace(examType) ? "All" : examType;

        try
        {
            var query = _context.NewGradingScaleRules.AsNoTracking();

            if (!targetType.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                var specificRules = await query.Where(r => r.ExamType == targetType).ToListAsync();
                if (specificRules != null && specificRules.Any())
                {
                    return specificRules;
                }

                // Fallback to "All" rules if no specific rules exist
                var fallbackRules = await query.Where(r => r.ExamType == "All").ToListAsync();
                if (fallbackRules != null && fallbackRules.Any())
                {
                    return fallbackRules;
                }
            }
            else
            {
                var dbRules = await query.ToListAsync();
                if (dbRules != null && dbRules.Any())
                {
                    return dbRules;
                }
            }
        }
        catch
        {
            // Fallback to in-memory
        }

        if (!targetType.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var specificInMemory = _inMemoryRules.Where(r => r.ExamType.Equals(targetType, StringComparison.OrdinalIgnoreCase)).ToList();
            if (specificInMemory.Any()) return specificInMemory;

            var allInMemory = _inMemoryRules.Where(r => r.ExamType.Equals("All", StringComparison.OrdinalIgnoreCase)).ToList();
            if (allInMemory.Any()) return allInMemory;
        }
        else if (_inMemoryRules.Any())
        {
            return _inMemoryRules.ToList();
        }

        // Return empty list if no rules are found in database - purely dynamic
        return new List<NewGradingScaleRule>();
    }

    public async Task<List<string>> GetDistinctExamTypesAsync()
    {
        var types = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "All" };

        try
        {
            var examTypes = await _context.NewExaminations
                .AsNoTracking()
                .Select(e => e.AssessmentType)
                .Where(t => !string.IsNullOrEmpty(t) && t != "Main Exam")
                .Distinct()
                .ToListAsync();

            foreach (var t in examTypes) types.Add(t);

            var ruleTypes = await _context.NewGradingScaleRules
                .AsNoTracking()
                .Select(r => r.ExamType)
                .Where(t => !string.IsNullOrEmpty(t) && t != "Main Exam")
                .Distinct()
                .ToListAsync();

            foreach (var t in ruleTypes) types.Add(t);
        }
        catch
        {
            // Fallback
        }

        foreach (var r in _inMemoryRules)
        {
            if (!string.IsNullOrEmpty(r.ExamType) && r.ExamType != "Main Exam") types.Add(r.ExamType);
        }

        return types.ToList();
    }

    public async Task<bool> SaveScaleRulesAsync(string examType, List<NewGradingScaleRule> rules)
    {
        string targetType = string.IsNullOrWhiteSpace(examType) ? "All" : examType;

        try
        {
            var existingDb = await _context.NewGradingScaleRules
                .Where(r => r.ExamType == targetType)
                .ToListAsync();

            if (existingDb.Any())
            {
                _context.NewGradingScaleRules.RemoveRange(existingDb);
            }

            foreach (var r in rules)
            {
                r.RuleId = 0; // Reset RuleId for AUTO_INCREMENT
                r.ExamType = targetType;
            }

            await _context.NewGradingScaleRules.AddRangeAsync(rules);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Fallback
        }

        _inMemoryRules.RemoveAll(r => r.ExamType.Equals(targetType, StringComparison.OrdinalIgnoreCase));
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

