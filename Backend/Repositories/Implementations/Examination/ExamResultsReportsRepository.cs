namespace SMS.Api.Repositories.Implementations.Examination;

using SMS.Api.Data;
using SMS.Api.Models.Examination;
using SMS.Api.Repositories.Interfaces.Examination;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamResultsReportsRepository : IExamResultsReportsRepository
{
    private readonly AppDbContext _context;

    private static readonly List<NewStudentExamResult> _inMemoryResults = new List<NewStudentExamResult>();

    public ExamResultsReportsRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<NewStudentExamResult>> GetExamResultsAsync(string? className = null, string? sectionName = null)
    {
        try
        {
            var query = _context.NewStudentExamResults.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(className) && !className.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => r.ClassName == className);
            }
            if (!string.IsNullOrWhiteSpace(sectionName) && !sectionName.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                string cleanSec = sectionName.Replace("Section ", "").Trim();
                query = query.Where(r => r.SectionName == sectionName || r.SectionName == cleanSec || r.SectionName == "Section " + cleanSec);
            }

            var dbResults = await query.ToListAsync();

            if (dbResults != null && dbResults.Any())
                return dbResults;
        }
        catch
        {
            // Fallback
        }

        var memQuery = _inMemoryResults.AsQueryable();
        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            memQuery = memQuery.Where(r => r.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase));
        }
        if (!string.IsNullOrWhiteSpace(sectionName) && !sectionName.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            string cleanSec = sectionName.Replace("Section ", "").Trim();
            memQuery = memQuery.Where(r => r.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase) ||
                                           r.SectionName.Equals(cleanSec, StringComparison.OrdinalIgnoreCase) ||
                                           r.SectionName.Equals("Section " + cleanSec, StringComparison.OrdinalIgnoreCase));
        }
        return memQuery.ToList();
    }

    public async Task<bool> SaveExamResultsAsync(string className, string sectionName, List<NewStudentExamResult> results)
    {
        try
        {
            var existingDb = await _context.NewStudentExamResults
                .Where(r => r.ClassName == className && r.SectionName == sectionName)
                .ToListAsync();

            if (existingDb.Any())
            {
                _context.NewStudentExamResults.RemoveRange(existingDb);
            }

            foreach (var r in results)
            {
                r.ResultId = 0; // Reset ResultId for AUTO_INCREMENT
                r.CalculatedAt = DateTime.UtcNow;
            }

            await _context.NewStudentExamResults.AddRangeAsync(results);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Fallback
        }

        _inMemoryResults.RemoveAll(r => r.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase) &&
                                        r.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase));
        _inMemoryResults.AddRange(results);

        return true;
    }

    public async Task<bool> SaveBulkResultsAsync(List<NewStudentExamResult> results)
    {
        if (results == null || !results.Any()) return true;

        try
        {
            var studentIds = results.Select(r => r.StudentId).Distinct().ToList();
            var examIds = results.Select(r => r.ExamId).Distinct().ToList();
            var classNames = results.Select(r => r.ClassName).Distinct().ToList();

            var existingDb = await _context.NewStudentExamResults
                .Where(r => examIds.Contains(r.ExamId) && (studentIds.Contains(r.StudentId) || classNames.Contains(r.ClassName)))
                .ToListAsync();

            if (existingDb.Any())
            {
                var toRemove = existingDb.Where(e => results.Any(r => r.ExamId == e.ExamId && (r.StudentId == e.StudentId || (r.ClassName == e.ClassName && r.RollNo == e.RollNo)))).ToList();
                if (toRemove.Any())
                {
                    _context.NewStudentExamResults.RemoveRange(toRemove);
                }
            }

            foreach (var r in results)
            {
                r.ResultId = 0;
                r.CalculatedAt = DateTime.UtcNow;
            }

            await _context.NewStudentExamResults.AddRangeAsync(results);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Fallback to in-memory
        }

        foreach (var r in results)
        {
            _inMemoryResults.RemoveAll(m => m.ExamId == r.ExamId && (m.StudentId == r.StudentId || (m.ClassName.Equals(r.ClassName, StringComparison.OrdinalIgnoreCase) && m.RollNo.Equals(r.RollNo, StringComparison.OrdinalIgnoreCase))));
            _inMemoryResults.Add(r);
        }

        return true;
    }

    public async Task<bool> ClearExamResultsAsync(string className, string sectionName)
    {
        _inMemoryResults.RemoveAll(r => r.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase) &&
                                        r.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase));

        try
        {
            var existingDb = await _context.NewStudentExamResults
                .Where(r => r.ClassName == className && r.SectionName == sectionName)
                .ToListAsync();

            if (existingDb.Any())
            {
                _context.NewStudentExamResults.RemoveRange(existingDb);
                await _context.SaveChangesAsync();
            }
            return true;
        }
        catch
        {
            return true;
        }
    }

    public async Task<bool> UpdateExamResultAsync(NewStudentExamResult result)
    {
        var existingMem = _inMemoryResults.FirstOrDefault(r => r.ResultId == result.ResultId || (r.StudentId == result.StudentId && r.ClassName == result.ClassName && r.SectionName == result.SectionName));
        if (existingMem != null)
        {
            existingMem.TotalMarksObtained = result.TotalMarksObtained;
            existingMem.TotalMaxMarks = result.TotalMaxMarks;
            existingMem.Percentage = result.Percentage;
            existingMem.Grade = result.Grade;
            existingMem.Rank = result.Rank;
            existingMem.ResultStatus = result.ResultStatus;
        }

        try
        {
            var dbResult = await _context.NewStudentExamResults.FirstOrDefaultAsync(r => r.ResultId == result.ResultId || (r.StudentId == result.StudentId && r.ClassName == result.ClassName && r.SectionName == result.SectionName));
            if (dbResult != null)
            {
                dbResult.TotalMarksObtained = result.TotalMarksObtained;
                dbResult.TotalMaxMarks = result.TotalMaxMarks;
                dbResult.Percentage = result.Percentage;
                dbResult.Grade = result.Grade;
                dbResult.Rank = result.Rank;
                dbResult.ResultStatus = result.ResultStatus;
                await _context.SaveChangesAsync();
            }
            return true;
        }
        catch
        {
            return true;
        }
    }

    public async Task<List<string>> GetClassNamesAsync()
    {
        try
        {
            var classes = await _context.Classes.AsNoTracking()
                .Where(c => c.ClassName != null)
                .Select(c => c.ClassName!)
                .Distinct()
                .ToListAsync();
            if (classes != null && classes.Any()) return classes;
        }
        catch { }
        return new List<string>();
    }
}

