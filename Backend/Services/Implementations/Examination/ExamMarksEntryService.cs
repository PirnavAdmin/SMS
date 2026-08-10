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

    public Task<MarksEntryOptionsDto> GetMarksEntryOptionsAsync()
    {
        return Task.FromResult(new MarksEntryOptionsDto());
    }

    public async Task<StudentMarksSheetResponseDto> GetStudentMarksSheetAsync(string className, string sectionName, string subjectCode, string? search)
    {
        var entries = await _repository.GetMarksEntriesAsync(className, sectionName, subjectCode);

        if (!string.IsNullOrWhiteSpace(search))
        {
            entries = entries.Where(e => 
                e.StudentName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                e.RollNo.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                e.AdmissionNo.Contains(search, StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        int totalStudents = entries.Count;
        int presentCount = entries.Count(e => e.AttendanceStatus.Equals("Present", StringComparison.OrdinalIgnoreCase));
        int absentCount = entries.Count(e => e.AttendanceStatus.Equals("Absent", StringComparison.OrdinalIgnoreCase));
        decimal classAvg = presentCount > 0 ? entries.Where(e => e.AttendanceStatus.Equals("Present", StringComparison.OrdinalIgnoreCase)).Average(e => e.MarksObtained) : 0;

        string sheetStatus = "STATUS: NOT STARTED";
        if (totalStudents > 0)
        {
            if (entries.All(e => e.Status.Equals("Submitted", StringComparison.OrdinalIgnoreCase)))
                sheetStatus = "STATUS: SUBMITTED";
            else if (entries.Any(e => e.Status.Equals("Draft", StringComparison.OrdinalIgnoreCase) || e.Status.Equals("Submitted", StringComparison.OrdinalIgnoreCase)))
                sheetStatus = "STATUS: IN PROGRESS";
        }

        var studentDtos = entries.Select(e => new StudentMarksRowDto
        {
            EntryId = e.EntryId,
            RollNo = e.RollNo,
            StudentName = e.StudentName,
            AdmissionNo = e.AdmissionNo,
            AttendanceStatus = e.AttendanceStatus,
            MarksObtained = e.MarksObtained,
            MaxMarks = e.MaxMarks,
            Grade = e.Grade,
            EvaluatorRemarks = e.EvaluatorRemarks,
            Status = e.Status
        }).ToList();

        string subjectName = GetSubjectNameByCode(subjectCode);

        return new StudentMarksSheetResponseDto
        {
            ClassName = className,
            SectionName = sectionName,
            SubjectCode = subjectCode,
            SubjectName = subjectName,
            Status = sheetStatus,
            TotalStudents = totalStudents,
            PresentCount = presentCount,
            AbsentCount = absentCount,
            ClassAverage = classAvg,
            Students = studentDtos
        };
    }

    public async Task<bool> SaveMarksSheetAsync(SaveMarksSheetRequestDto request)
    {
        string subjectName = GetSubjectNameByCode(request.SubjectCode);

        var entities = request.Students.Select(s => new NewStudentMarksEntry
        {
            ExamId = request.ExamId,
            ClassName = request.ClassName,
            SectionName = request.SectionName,
            SubjectCode = request.SubjectCode,
            SubjectName = subjectName,
            RollNo = s.RollNo,
            StudentName = s.StudentName,
            AdmissionNo = s.AdmissionNo,
            AttendanceStatus = s.AttendanceStatus,
            MarksObtained = s.MarksObtained,
            MaxMarks = s.MaxMarks > 0 ? s.MaxMarks : 100,
            Grade = CalculateGrade(s.MarksObtained, s.MaxMarks),
            EvaluatorRemarks = s.EvaluatorRemarks,
            Status = request.IsFinalSubmit ? "Submitted" : "Draft"
        }).ToList();

        return await _repository.SaveMarksEntriesAsync(request.ClassName, request.SectionName, request.SubjectCode, entities, request.IsFinalSubmit);
    }

    private static string CalculateGrade(decimal marks, decimal maxMarks)
    {
        if (maxMarks <= 0) maxMarks = 100;
        decimal pct = (marks / maxMarks) * 100;

        if (pct >= 90) return "A+";
        if (pct >= 80) return "A";
        if (pct >= 70) return "B+";
        if (pct >= 60) return "B";
        if (pct >= 50) return "C";
        if (pct >= 35) return "D";
        return "F";
    }

    private static string GetSubjectNameByCode(string code)
    {
        return code switch
        {
            "MTH-101" => "Mathematics",
            "ENG-105" => "English Language",
            "CHM-103" => "Chemistry",
            "HIS-107" => "History",
            "ACC-109" => "Accountancy",
            "PHY-102" => "Physics",
            _ => "Subject (" + code + ")"
        };
    }
}

