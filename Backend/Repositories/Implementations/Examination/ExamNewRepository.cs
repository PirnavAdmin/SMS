namespace SMS.Api.Repositories.Implementations.Examination;

using SMS.Api.Data;
using SMS.Api.Models.Examination;
using SMS.Api.Repositories.Interfaces.Examination;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamNewRepository : IExamNewRepository
{
    private readonly AppDbContext _context;
    private static readonly List<NewExamSubjectConfig> _inMemorySubjectConfigs = new List<NewExamSubjectConfig>();
    private static readonly List<NewExamination> _inMemoryExams = new List<NewExamination>();

    public ExamNewRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<NewExamination>> GetAllExamsAsync()
    {
        try
        {
            var dbExams = await _context.NewExaminations.AsNoTracking().ToListAsync();
            if (dbExams != null && dbExams.Any())
                return dbExams;
        }
        catch
        {
            // Fallback
        }

        return _inMemoryExams;
    }

    public async Task<NewExamination?> GetExamByIdAsync(int examId)
    {
        try
        {
            var dbExam = await _context.NewExaminations.AsNoTracking().FirstOrDefaultAsync(e => e.ExamId == examId);
            if (dbExam != null)
                return dbExam;
        }
        catch
        {
            // Fallback
        }

        return _inMemoryExams.FirstOrDefault(e => e.ExamId == examId);
    }

    public async Task<NewExamination> SaveExamDetailsAsync(NewExamination exam)
    {
        try
        {
            if (exam.ExamId == 0)
            {
                await _context.NewExaminations.AddAsync(exam);
            }
            else
            {
                var dbExisting = await _context.NewExaminations.FindAsync(exam.ExamId);
                if (dbExisting != null)
                {
                    dbExisting.ExamName = exam.ExamName;
                    dbExisting.AssessmentType = exam.AssessmentType;
                    dbExisting.AcademicTerm = exam.AcademicTerm;
                    dbExisting.StartDate = exam.StartDate;
                    dbExisting.EndDate = exam.EndDate;
                    dbExisting.ApplicableClasses = exam.ApplicableClasses;
                    dbExisting.Status = exam.Status;
                }
                else
                {
                    await _context.NewExaminations.AddAsync(exam);
                }
            }

            await _context.SaveChangesAsync();

            // Sync in memory
            var existingInMem = _inMemoryExams.FirstOrDefault(e => e.ExamId == exam.ExamId);
            if (existingInMem != null)
            {
                existingInMem.ExamName = exam.ExamName;
                existingInMem.AssessmentType = exam.AssessmentType;
                existingInMem.AcademicTerm = exam.AcademicTerm;
                existingInMem.StartDate = exam.StartDate;
                existingInMem.EndDate = exam.EndDate;
                existingInMem.ApplicableClasses = exam.ApplicableClasses;
                existingInMem.Status = exam.Status;
            }
            else
            {
                _inMemoryExams.Add(exam);
            }

            return exam;
        }
        catch
        {
            if (exam.ExamId == 0)
            {
                exam.ExamId = _inMemoryExams.Any() ? _inMemoryExams.Max(e => e.ExamId) + 1 : 1;
            }

            var existingInMem = _inMemoryExams.FirstOrDefault(e => e.ExamId == exam.ExamId);
            if (existingInMem != null)
            {
                existingInMem.ExamName = exam.ExamName;
                existingInMem.AssessmentType = exam.AssessmentType;
                existingInMem.AcademicTerm = exam.AcademicTerm;
                existingInMem.StartDate = exam.StartDate;
                existingInMem.EndDate = exam.EndDate;
                existingInMem.ApplicableClasses = exam.ApplicableClasses;
                existingInMem.Status = exam.Status;
            }
            else
            {
                _inMemoryExams.Add(exam);
            }

            return exam;
        }
    }

    public async Task<bool> SaveSubjectConfigsAsync(int examId, string className, List<NewExamSubjectConfig> configs, bool markAsScheduled)
    {
        try
        {
            var exam = await _context.NewExaminations.FirstOrDefaultAsync(e => e.ExamId == examId);
            if (exam != null && markAsScheduled)
            {
                exam.Status = "Scheduled";
            }

            var existingDbConfigs = await _context.NewExamSubjectConfigs
                .Where(c => c.ExamId == examId && c.ClassName == className)
                .ToListAsync();

            if (existingDbConfigs.Any())
            {
                _context.NewExamSubjectConfigs.RemoveRange(existingDbConfigs);
            }

            await _context.NewExamSubjectConfigs.AddRangeAsync(configs);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Fallback
            _inMemorySubjectConfigs.RemoveAll(c => c.ExamId == examId && c.ClassName == className);
            _inMemorySubjectConfigs.AddRange(configs);
        }

        var inMem = _inMemoryExams.FirstOrDefault(e => e.ExamId == examId);
        if (inMem != null && markAsScheduled)
        {
            inMem.Status = "Scheduled";
        }

        return true;
    }

    public async Task<List<NewExamSubjectConfig>> GetSubjectConfigsAsync(int examId, string className)
    {
        try
        {
            var dbConfigs = await _context.NewExamSubjectConfigs
                .AsNoTracking()
                .Where(c => c.ExamId == examId && c.ClassName == className)
                .ToListAsync();
            if (dbConfigs != null && dbConfigs.Any())
                return dbConfigs;
        }
        catch
        {
            // Fallback
        }

        return _inMemorySubjectConfigs
            .Where(c => c.ExamId == examId && c.ClassName == className)
            .ToList();
    }

    public async Task<bool> DeleteExamAsync(int examId)
    {
        try
        {
            var dbExam = await _context.NewExaminations.FindAsync(examId);
            if (dbExam != null)
            {
                _context.NewExaminations.Remove(dbExam);
                await _context.SaveChangesAsync();
            }
        }
        catch
        {
            // Fallback
        }

        var inMem = _inMemoryExams.FirstOrDefault(e => e.ExamId == examId);
        if (inMem != null)
        {
            _inMemoryExams.Remove(inMem);
        }

        return true;
    }
}

