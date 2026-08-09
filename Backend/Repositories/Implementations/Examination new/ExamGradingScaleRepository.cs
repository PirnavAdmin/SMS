namespace SMS.Api.Repositories.Implementations.ExaminationNew;

using SMS.Api.Data;
using SMS.Api.Models.ExaminationNew;
using SMS.Api.Repositories.Interfaces.ExaminationNew;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamGradingScaleRepository : IExamGradingScaleRepository
{
    private readonly AppDbContext _context;

    private static readonly List<NewGradingScaleRule> _inMemoryRules = new List<NewGradingScaleRule>
    {
        new NewGradingScaleRule { RuleId = 1, ExamType = "All", Grade = "A+", MinMarks = 90, MaxMarks = 100, Gpa = 4.0m, PassFail = "PASS", Remarks = "Outstanding" },
        new NewGradingScaleRule { RuleId = 2, ExamType = "All", Grade = "A", MinMarks = 80, MaxMarks = 89, Gpa = 3.5m, PassFail = "PASS", Remarks = "Excellent" },
        new NewGradingScaleRule { RuleId = 3, ExamType = "All", Grade = "B+", MinMarks = 70, MaxMarks = 79, Gpa = 3.0m, PassFail = "PASS", Remarks = "Very Good" },
        new NewGradingScaleRule { RuleId = 4, ExamType = "All", Grade = "B", MinMarks = 60, MaxMarks = 69, Gpa = 2.5m, PassFail = "PASS", Remarks = "Good" },
        new NewGradingScaleRule { RuleId = 5, ExamType = "All", Grade = "C", MinMarks = 50, MaxMarks = 59, Gpa = 2.0m, PassFail = "PASS", Remarks = "Satisfactory" },
        new NewGradingScaleRule { RuleId = 6, ExamType = "All", Grade = "D", MinMarks = 33, MaxMarks = 49, Gpa = 1.0m, PassFail = "PASS", Remarks = "Pass" },
        new NewGradingScaleRule { RuleId = 7, ExamType = "All", Grade = "F", MinMarks = 0, MaxMarks = 32, Gpa = 0.0m, PassFail = "FAIL", Remarks = "Needs Improvement" }
    };

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
}
