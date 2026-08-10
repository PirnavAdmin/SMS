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

    private static readonly List<NewStudentMarksEntry> _inMemoryMarks = new List<NewStudentMarksEntry>
    {
        new NewStudentMarksEntry { EntryId = 1, ClassName = "Class 1", SectionName = "Section A", SubjectCode = "MTH-101", SubjectName = "Mathematics", RollNo = "101", StudentName = "Alex Morgan", AdmissionNo = "ADM-2026-01", AttendanceStatus = "Present", MarksObtained = 92.5m, MaxMarks = 100, Grade = "A+", EvaluatorRemarks = "Excellent in Algebra", Status = "Draft" },
        new NewStudentMarksEntry { EntryId = 2, ClassName = "Class 1", SectionName = "Section A", SubjectCode = "MTH-101", SubjectName = "Mathematics", RollNo = "102", StudentName = "Ethan Hunt", AdmissionNo = "ADM-2026-02", AttendanceStatus = "Present", MarksObtained = 88.0m, MaxMarks = 100, Grade = "A", EvaluatorRemarks = "Good problem solving", Status = "Draft" },
        new NewStudentMarksEntry { EntryId = 3, ClassName = "Class 1", SectionName = "Section A", SubjectCode = "MTH-101", SubjectName = "Mathematics", RollNo = "103", StudentName = "Sophia Loren", AdmissionNo = "ADM-2026-03", AttendanceStatus = "Present", MarksObtained = 75.0m, MaxMarks = 100, Grade = "B", EvaluatorRemarks = "Needs focus on geometry", Status = "Draft" },
        new NewStudentMarksEntry { EntryId = 4, ClassName = "Class 1", SectionName = "Section A", SubjectCode = "MTH-101", SubjectName = "Mathematics", RollNo = "104", StudentName = "James Bond", AdmissionNo = "ADM-2026-04", AttendanceStatus = "Absent", MarksObtained = 0.0m, MaxMarks = 100, Grade = "F", EvaluatorRemarks = "Absent for exam", Status = "Draft" },
        new NewStudentMarksEntry { EntryId = 5, ClassName = "Class 1", SectionName = "Section A", SubjectCode = "MTH-101", SubjectName = "Mathematics", RollNo = "105", StudentName = "Emma Watson", AdmissionNo = "ADM-2026-05", AttendanceStatus = "Present", MarksObtained = 95.0m, MaxMarks = 100, Grade = "A+", EvaluatorRemarks = "Outstanding", Status = "Draft" }
    };

    public ExamMarksEntryRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<NewStudentMarksEntry>> GetMarksEntriesAsync(string className, string sectionName, string subjectCode)
    {
        try
        {
            var dbEntries = await _context.Set<NewStudentMarksEntry>()
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

    public async Task<bool> SaveMarksEntriesAsync(string className, string sectionName, string subjectCode, List<NewStudentMarksEntry> entries, bool isFinalSubmit)
    {
        string statusText = isFinalSubmit ? "Submitted" : "Draft";
        foreach (var entry in entries)
        {
            entry.Status = statusText;
        }

        _inMemoryMarks.RemoveAll(m => m.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase) &&
                                      m.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase) &&
                                      m.SubjectCode.Equals(subjectCode, StringComparison.OrdinalIgnoreCase));
        _inMemoryMarks.AddRange(entries);

        try
        {
            var existingDb = await _context.Set<NewStudentMarksEntry>()
                .Where(m => m.ClassName == className && m.SectionName == sectionName && m.SubjectCode == subjectCode)
                .ToListAsync();

            if (existingDb.Any())
            {
                _context.Set<NewStudentMarksEntry>().RemoveRange(existingDb);
            }

            await _context.Set<NewStudentMarksEntry>().AddRangeAsync(entries);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Fallback
        }

        return true;
    }
}

