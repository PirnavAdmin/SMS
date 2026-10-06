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
        bool isAll = targetType.Equals("All", StringComparison.OrdinalIgnoreCase);

        try
        {
            var query = _context.NewGradingScaleRules.AsNoTracking();

            if (!isAll)
            {
                var specificRules = await query
                    .Where(r => r.ExamType == targetType)
                    .OrderByDescending(r => r.MinMarks)
                    .ToListAsync();

                if (specificRules != null && specificRules.Any())
                {
                    return specificRules;
                }

                // Fallback to "All" rules if no specific rules exist for this exam type
                var fallbackRules = await query
                    .Where(r => r.ExamType == "All" || string.IsNullOrEmpty(r.ExamType))
                    .OrderByDescending(r => r.MinMarks)
                    .ToListAsync();

                if (fallbackRules != null && fallbackRules.Any())
                {
                    return fallbackRules;
                }
            }
            else
            {
                // Only return rules specifically configured for "All" or unassigned
                var allDbRules = await query
                    .Where(r => r.ExamType == "All" || string.IsNullOrEmpty(r.ExamType))
                    .OrderByDescending(r => r.MinMarks)
                    .ToListAsync();

                if (allDbRules != null && allDbRules.Any())
                {
                    return allDbRules;
                }

                // Auto-seed clean default rules for "All" if none exist yet
                var seedRules = new List<NewGradingScaleRule>
                {
                    new NewGradingScaleRule { ExamType = "All", Grade = "O", MinMarks = 80, MaxMarks = 100, Gpa = 10.0m, PassFail = "Pass", Remarks = "Outstanding", UpdatedAt = DateTime.UtcNow },
                    new NewGradingScaleRule { ExamType = "All", Grade = "A+", MinMarks = 60, MaxMarks = 79, Gpa = 9.0m, PassFail = "Pass", Remarks = "Excellent", UpdatedAt = DateTime.UtcNow },
                    new NewGradingScaleRule { ExamType = "All", Grade = "B+", MinMarks = 40, MaxMarks = 59, Gpa = 8.0m, PassFail = "Pass", Remarks = "Good", UpdatedAt = DateTime.UtcNow },
                    new NewGradingScaleRule { ExamType = "All", Grade = "C", MinMarks = 0, MaxMarks = 39, Gpa = 7.0m, PassFail = "Fail", Remarks = "Needs Improvement", UpdatedAt = DateTime.UtcNow }
                };

                await _context.NewGradingScaleRules.AddRangeAsync(seedRules);
                await _context.SaveChangesAsync();
                return seedRules;
            }
        }
        catch
        {
            // Fallback to in-memory if DB query fails
        }

        if (!isAll)
        {
            var specificInMemory = _inMemoryRules
                .Where(r => r.ExamType.Equals(targetType, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(r => r.MinMarks)
                .ToList();

            if (specificInMemory.Any()) return specificInMemory;

            var allInMemory = _inMemoryRules
                .Where(r => r.ExamType.Equals("All", StringComparison.OrdinalIgnoreCase) || string.IsNullOrEmpty(r.ExamType))
                .OrderByDescending(r => r.MinMarks)
                .ToList();

            if (allInMemory.Any()) return allInMemory;
        }
        else
        {
            var allInMemory = _inMemoryRules
                .Where(r => r.ExamType.Equals("All", StringComparison.OrdinalIgnoreCase) || string.IsNullOrEmpty(r.ExamType))
                .OrderByDescending(r => r.MinMarks)
                .ToList();

            if (allInMemory.Any()) return allInMemory;
        }

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
        bool isAll = targetType.Equals("All", StringComparison.OrdinalIgnoreCase);

        try
        {
            var existingDb = await _context.NewGradingScaleRules
                .Where(r => r.ExamType == targetType || (isAll && (r.ExamType == "All" || string.IsNullOrEmpty(r.ExamType))))
                .ToListAsync();

            if (existingDb.Any())
            {
                _context.NewGradingScaleRules.RemoveRange(existingDb);
            }

            foreach (var r in rules)
            {
                r.RuleId = 0; // Reset RuleId for AUTO_INCREMENT
                r.ExamType = targetType;
                r.UpdatedAt = DateTime.UtcNow;
            }

            if (rules.Any())
            {
                await _context.NewGradingScaleRules.AddRangeAsync(rules);
            }

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error saving grading scale rules: {ex.Message}");
        }

        _inMemoryRules.RemoveAll(r => r.ExamType.Equals(targetType, StringComparison.OrdinalIgnoreCase) || (isAll && string.IsNullOrEmpty(r.ExamType)));
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

