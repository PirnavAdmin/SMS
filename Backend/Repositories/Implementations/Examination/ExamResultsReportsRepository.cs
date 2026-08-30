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

    public async Task<List<NewStudentExamResult>> GetExamResultsAsync(string className, string sectionName)
    {
        try
        {
            var dbResults = await _context.NewStudentExamResults
                .AsNoTracking()
                .Where(r => r.ClassName == className && r.SectionName == sectionName)
                .ToListAsync();

            if (dbResults != null && dbResults.Any())
                return dbResults;
        }
        catch
        {
            // Fallback
        }

        return _inMemoryResults
            .Where(r => r.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase) &&
                        r.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase))
            .ToList();
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
            var classes = await _context.Classes.AsNoTracking().Select(c => c.Name).Distinct().ToListAsync();
            if (classes != null && classes.Any()) return classes;
        }
        catch { }
        return new List<string>();
    }
}

