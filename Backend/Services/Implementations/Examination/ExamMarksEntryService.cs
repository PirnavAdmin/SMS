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

    public async Task<bool> SaveMarksSheetAsync(SaveMarksSheetRequestDto request)
    {
        var entities = request.Students.Select(s => new NewStudentMarksEntry
        {
            EntryId = s.EntryId,
            ClassName = request.ClassName,
            SectionName = request.SectionName,
            SubjectCode = request.SubjectCode,
            SubjectName = s.StudentName,
            RollNo = s.RollNo,
            StudentName = s.StudentName,
            AdmissionNo = s.AdmissionNo,
            AttendanceStatus = s.AttendanceStatus,
            MarksObtained = s.MarksObtained,
            MaxMarks = s.MaxMarks,
            Grade = CalculateGrade(s.MarksObtained, s.MaxMarks),
            EvaluatorRemarks = s.EvaluatorRemarks
        }).ToList();

        return await _repository.SaveMarksEntriesAsync(request.ClassName, request.SectionName, request.SubjectCode, entities, request.IsFinalSubmit);
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

