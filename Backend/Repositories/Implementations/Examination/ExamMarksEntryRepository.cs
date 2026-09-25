namespace SMS.Api.Repositories.Implementations.Examination;

using SMS.Api.Data;
using SMS.Api.Models.Examination;
using SMS.Api.Repositories.Interfaces.Examination;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamMarksEntryRepository : IExamMarksEntryRepository
{
    private readonly AppDbContext _context;

    private static readonly List<NewStudentMarksEntry> _inMemoryMarks = new List<NewStudentMarksEntry>();

    public ExamMarksEntryRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<NewStudentMarksEntry>> GetMarksEntriesAsync(string className, string sectionName, string subjectCode)
    {
        try
        {
            var dbEntries = await _context.NewStudentMarksEntries
                .AsNoTracking()
                .Where(m => m.ClassName == className && m.SectionName == sectionName && m.SubjectCode == subjectCode)
                .ToListAsync();

            if (dbEntries != null && dbEntries.Any())
                return dbEntries;
        }
        catch
        {
            // Fallback
        }

        return _inMemoryMarks
            .Where(m => m.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase) &&
                        m.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase) &&
                        m.SubjectCode.Equals(subjectCode, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    public async Task<List<NewStudentMarksEntry>> GetAllMarksForClassSectionAsync(string? className = null, string? sectionName = null)
    {
        try
        {
            var query = _context.NewStudentMarksEntries.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(className) && !className.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(m => m.ClassName == className);
            }
            if (!string.IsNullOrWhiteSpace(sectionName) && !sectionName.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                string cleanSec = sectionName.Replace("Section ", "").Trim();
                query = query.Where(m => m.SectionName == sectionName || m.SectionName == cleanSec || m.SectionName == "Section " + cleanSec);
            }

            var dbEntries = await query.ToListAsync();
            if (dbEntries != null && dbEntries.Any())
                return dbEntries;
        }
        catch
        {
            // Fallback
        }

        var memQuery = _inMemoryMarks.AsQueryable();
        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            memQuery = memQuery.Where(m => m.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase));
        }
        if (!string.IsNullOrWhiteSpace(sectionName) && !sectionName.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            string cleanSec = sectionName.Replace("Section ", "").Trim();
            memQuery = memQuery.Where(m => m.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase) ||
                                           m.SectionName.Equals(cleanSec, StringComparison.OrdinalIgnoreCase) ||
                                           m.SectionName.Equals("Section " + cleanSec, StringComparison.OrdinalIgnoreCase));
        }
        return memQuery.ToList();
    }

    public async Task<bool> SaveMarksEntriesAsync(string className, string sectionName, string subjectCode, List<NewStudentMarksEntry> entries, bool isFinalSubmit)
    {
        string statusText = isFinalSubmit ? "Submitted" : "Draft";
        foreach (var entry in entries)
        {
            entry.Status = statusText;
        }

        try
        {
            var existingDb = await _context.NewStudentMarksEntries
                .Where(m => m.ClassName == className && m.SectionName == sectionName && m.SubjectCode == subjectCode)
                .ToListAsync();

            if (existingDb.Any())
            {
                _context.NewStudentMarksEntries.RemoveRange(existingDb);
            }

            foreach (var e in entries)
            {
                e.EntryId = 0; // Reset EntryId for AUTO_INCREMENT
            }

            await _context.NewStudentMarksEntries.AddRangeAsync(entries);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Fallback
        }

        _inMemoryMarks.RemoveAll(m => m.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase) &&
                                      m.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase) &&
                                      m.SubjectCode.Equals(subjectCode, StringComparison.OrdinalIgnoreCase));
        _inMemoryMarks.AddRange(entries);

        return true;
    }

    public async Task<bool> SaveBulkMarksEntriesAsync(List<NewStudentMarksEntry> entries)
    {
        if (entries == null || !entries.Any()) return true;

        try
        {
            var classNames = entries.Select(e => e.ClassName).Distinct().ToList();
            var sectionNames = entries.Select(e => e.SectionName).Distinct().ToList();
            var subjectCodes = entries.Select(e => e.SubjectCode).Distinct().ToList();

            var existingDb = await _context.NewStudentMarksEntries
                .Where(m => classNames.Contains(m.ClassName) && sectionNames.Contains(m.SectionName) && subjectCodes.Contains(m.SubjectCode))
                .ToListAsync();

            if (existingDb.Any())
            {
                var toRemove = existingDb.Where(ex => entries.Any(e => e.ClassName == ex.ClassName && e.SectionName == ex.SectionName && e.SubjectCode == ex.SubjectCode && (e.RollNo == ex.RollNo || e.AdmissionNo == ex.AdmissionNo))).ToList();
                if (toRemove.Any())
                {
                    _context.NewStudentMarksEntries.RemoveRange(toRemove);
                }
            }

            foreach (var e in entries)
            {
                e.EntryId = 0;
                e.UpdatedAt = DateTime.UtcNow;
            }

            await _context.NewStudentMarksEntries.AddRangeAsync(entries);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Fallback
        }

        foreach (var e in entries)
        {
            _inMemoryMarks.RemoveAll(m => m.ClassName.Equals(e.ClassName, StringComparison.OrdinalIgnoreCase) &&
                                          m.SectionName.Equals(e.SectionName, StringComparison.OrdinalIgnoreCase) &&
                                          m.SubjectCode.Equals(e.SubjectCode, StringComparison.OrdinalIgnoreCase) &&
                                          (m.RollNo.Equals(e.RollNo, StringComparison.OrdinalIgnoreCase) || m.AdmissionNo.Equals(e.AdmissionNo, StringComparison.OrdinalIgnoreCase)));
            _inMemoryMarks.Add(e);
        }

        return true;
    }

    public async Task<bool> ClearMarksEntriesAsync(string className, string sectionName, string subjectCode)
    {
        _inMemoryMarks.RemoveAll(m => m.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase) &&
                                      m.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase) &&
                                      m.SubjectCode.Equals(subjectCode, StringComparison.OrdinalIgnoreCase));

        try
        {
            var existingDb = await _context.NewStudentMarksEntries
                .Where(m => m.ClassName == className && m.SectionName == sectionName && m.SubjectCode == subjectCode)
                .ToListAsync();

            if (existingDb.Any())
            {
                _context.NewStudentMarksEntries.RemoveRange(existingDb);
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

    public async Task<List<SMS.Api.Dtos.Examination.SubjectOptionItemDto>> GetSubjectsAsync()
    {
        try
        {
            var subs = await _context.Subjects.AsNoTracking()
                .Where(s => s.SubjectName != null)
                .Select(s => new SMS.Api.Dtos.Examination.SubjectOptionItemDto 
                { 
                    SubjectCode = s.SubjectCode ?? s.SubjectName ?? "", 
                    SubjectName = s.SubjectName ?? "" 
                })
                .Distinct()
                .ToListAsync();
            if (subs != null && subs.Any()) return subs;
        }
        catch { }
        return new List<SMS.Api.Dtos.Examination.SubjectOptionItemDto>();
    }
}

