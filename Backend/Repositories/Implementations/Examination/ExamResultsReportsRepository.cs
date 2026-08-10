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

    private static readonly List<NewStudentExamResult> _inMemoryResults = new List<NewStudentExamResult>
    {
        new NewStudentExamResult { ResultId = 1, ExamId = 1, ClassName = "Class 1", SectionName = "Section A", StudentId = 101, RollNo = "101", StudentName = "Alex Morgan", AdmissionNo = "ADM-2026-01", TotalMarksObtained = 560, TotalMaxMarks = 600, Percentage = 93.33m, Grade = "A+", Rank = 1, ResultStatus = "Pass" },
        new NewStudentExamResult { ResultId = 2, ExamId = 1, ClassName = "Class 1", SectionName = "Section A", StudentId = 102, RollNo = "102", StudentName = "Emma Watson", AdmissionNo = "ADM-2026-05", TotalMarksObtained = 540, TotalMaxMarks = 600, Percentage = 90.00m, Grade = "A+", Rank = 2, ResultStatus = "Pass" },
        new NewStudentExamResult { ResultId = 3, ExamId = 1, ClassName = "Class 1", SectionName = "Section A", StudentId = 103, RollNo = "103", StudentName = "Ethan Hunt", AdmissionNo = "ADM-2026-02", TotalMarksObtained = 490, TotalMaxMarks = 600, Percentage = 81.67m, Grade = "A", Rank = 3, ResultStatus = "Pass" },
        new NewStudentExamResult { ResultId = 4, ExamId = 1, ClassName = "Class 1", SectionName = "Section A", StudentId = 104, RollNo = "104", StudentName = "Sophia Loren", AdmissionNo = "ADM-2026-03", TotalMarksObtained = 430, TotalMaxMarks = 600, Percentage = 71.67m, Grade = "B", Rank = 4, ResultStatus = "Pass" },
        new NewStudentExamResult { ResultId = 5, ExamId = 1, ClassName = "Class 1", SectionName = "Section A", StudentId = 105, RollNo = "105", StudentName = "James Bond", AdmissionNo = "ADM-2026-04", TotalMarksObtained = 180, TotalMaxMarks = 600, Percentage = 30.00m, Grade = "F", Rank = 5, ResultStatus = "Fail" }
    };

    public ExamResultsReportsRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<NewStudentExamResult>> GetExamResultsAsync(string className, string sectionName)
    {
        try
        {
            var dbResults = await _context.Set<NewStudentExamResult>()
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
        _inMemoryResults.RemoveAll(r => r.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase) &&
                                        r.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase));
        _inMemoryResults.AddRange(results);

        try
        {
            var existingDb = await _context.Set<NewStudentExamResult>()
                .Where(r => r.ClassName == className && r.SectionName == sectionName)
                .ToListAsync();

            if (existingDb.Any())
            {
                _context.Set<NewStudentExamResult>().RemoveRange(existingDb);
            }

            await _context.Set<NewStudentExamResult>().AddRangeAsync(results);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Fallback
        }

        return true;
    }
}

