namespace SMS.Api.Services.Implementations.Examination;

using SMS.Api.Dtos.Examination;
using SMS.Api.Models.Examination;
using SMS.Api.Repositories.Interfaces.Examination;
using SMS.Api.Services.Interfaces.Examination;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamMarksEntryService : IExamMarksEntryService
{
    private readonly IExamMarksEntryRepository _repository;

    public ExamMarksEntryService(IExamMarksEntryRepository repository)
    {
        _repository = repository;
    }

    public async Task<MarksEntryOptionsDto> GetMarksEntryOptionsAsync()
    {
        var classes = await _repository.GetClassNamesAsync();
        var subjects = await _repository.GetSubjectsAsync();

        return new MarksEntryOptionsDto
        {
            Classes = classes,
            Sections = new List<string> { "Section A", "Section B", "Section C", "Section D" },
            Subjects = subjects
        };
    }

    public async Task<StudentMarksSheetResponseDto> GetStudentMarksSheetAsync(string className, string sectionName, string subjectCode, string? search)
    {
        var entries = await _repository.GetMarksEntriesAsync(className, sectionName, subjectCode);

        var query = entries.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(e => e.RollNo.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     e.StudentName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     e.AdmissionNo.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        string subjectName = entries.FirstOrDefault()?.SubjectName ?? "Mathematics";
        var studentList = query.Select(e => new StudentMarksRowDto
        {
            EntryId = e.EntryId,
            RollNo = e.RollNo,
            StudentName = e.StudentName,
            AdmissionNo = e.AdmissionNo,
            AttendanceStatus = e.AttendanceStatus,
            MarksObtained = e.MarksObtained,
            MaxMarks = e.MaxMarks,
            Grade = CalculateGrade(e.MarksObtained, e.MaxMarks),
            EvaluatorRemarks = e.EvaluatorRemarks,
            Status = e.Status
        }).ToList();

        int present = studentList.Count(s => s.AttendanceStatus.Equals("Present", StringComparison.OrdinalIgnoreCase));
        int absent = studentList.Count - present;
        decimal avg = studentList.Any() ? studentList.Average(s => s.MarksObtained) : 0;

        return new StudentMarksSheetResponseDto
        {
            ClassName = className,
            SectionName = sectionName,
            SubjectCode = subjectCode,
            SubjectName = subjectName,
            Status = "STATUS: IN PROGRESS",
            TotalStudents = studentList.Count,
            PresentCount = present,
            AbsentCount = absent,
            ClassAverage = avg,
            Students = studentList
        };
    }

    public async Task<List<NewStudentMarksEntry>> GetClassMarksEntriesAsync(string className, string sectionName, int? examId = null)
    {
        var entries = await _repository.GetClassMarksEntriesAsync(className, sectionName, examId);
        if (entries != null && entries.Any())
        {
            return entries;
        }

        if (examId.HasValue && examId.Value > 0)
        {
            var fallbackEntries = await _repository.GetClassMarksEntriesAsync(className, sectionName, null);
            if (fallbackEntries != null && fallbackEntries.Any())
            {
                return fallbackEntries;
            }
        }

        return new List<NewStudentMarksEntry>();
    }

    public async Task<bool> SaveMarksSheetAsync(SaveMarksSheetRequestDto request)
    {
        if (request == null) return false;

        var studentRows = request.Students ?? new List<StudentMarksRowDto>();
        var entities = studentRows.Select(s => new NewStudentMarksEntry
        {
            EntryId = s.EntryId,
            ExamId = request.ExamId > 0 ? request.ExamId : 1,
            ClassName = request.ClassName ?? string.Empty,
            SectionName = request.SectionName ?? string.Empty,
            SubjectCode = request.SubjectCode ?? string.Empty,
            SubjectName = !string.IsNullOrWhiteSpace(request.SubjectCode) ? request.SubjectCode : "Subject",
            RollNo = s.RollNo ?? string.Empty,
            StudentName = s.StudentName ?? string.Empty,
            AdmissionNo = s.AdmissionNo ?? string.Empty,
            AttendanceStatus = s.AttendanceStatus ?? "Present",
            MarksObtained = s.MarksObtained,
            MaxMarks = s.MaxMarks > 0 ? s.MaxMarks : 100,
            Grade = !string.IsNullOrWhiteSpace(s.Grade) ? s.Grade : CalculateGrade(s.MarksObtained, s.MaxMarks),
            EvaluatorRemarks = s.EvaluatorRemarks ?? string.Empty,
            Status = request.IsFinalSubmit ? "Submitted" : "Draft",
            UpdatedAt = DateTime.UtcNow
        }).ToList();

        return await _repository.SaveMarksEntriesAsync(request.ClassName ?? string.Empty, request.SectionName ?? string.Empty, request.SubjectCode ?? string.Empty, entities, request.IsFinalSubmit);
    }

    public async Task<bool> ClearMarksEntriesAsync(string className, string sectionName, string subjectCode)
    {
        return await _repository.ClearMarksEntriesAsync(className, sectionName, subjectCode);
    }

    private static string CalculateGrade(decimal marks, decimal maxMarks)
    {
        if (maxMarks <= 0) return "F";
        decimal percentage = (marks / maxMarks) * 100;
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B+";
        if (percentage >= 60) return "B";
        if (percentage >= 50) return "C";
        if (percentage >= 33) return "D";
        return "F";
    }
}

