namespace SMS.Api.Services.Implementations.Examination;

using SMS.Api.Dtos.Examination;
using SMS.Api.Models.Examination;
using SMS.Api.Repositories.Interfaces.Examination;
using SMS.Api.Services.Interfaces.Examination;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamResultsReportsService : IExamResultsReportsService
{
    private readonly IExamResultsReportsRepository _repository;
    private readonly IExamMarksEntryRepository _marksRepository;

    public ExamResultsReportsService(
        IExamResultsReportsRepository repository,
        IExamMarksEntryRepository marksRepository)
    {
        _repository = repository;
        _marksRepository = marksRepository;
    }

    public async Task<ResultsReportsOptionsDto> GetOptionsAsync()
    {
        var classes = await _repository.GetClassNamesAsync();

        return new ResultsReportsOptionsDto
        {
            Classes = classes,
            Sections = new List<string> { "Section A", "Section B", "Section C", "Section D" },
            ResultStatuses = new List<string> { "All", "Pass", "Fail" },
            RankOrders = new List<string> { "Ascending", "Descending" }
        };
    }

    public async Task<CalculateResultsResponseDto> CalculateResultsAsync(CalculateResultsRequestDto request)
    {
        var existingResults = await _repository.GetExamResultsAsync(request.ClassName, request.SectionName);

        var ordered = existingResults.OrderByDescending(r => r.Percentage).ToList();
        for (int i = 0; i < ordered.Count; i++)
        {
            ordered[i].Rank = i + 1;
        }

        return MapResponseDto(ordered);
    }

    public async Task<List<StudentReportCardRowDto>> GetReportCardsListAsync(string className, string sectionName, string? search, string? statusFilter)
    {
        var results = await _repository.GetExamResultsAsync(className, sectionName);

        var query = results.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(r => r.RollNo.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     r.StudentName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     r.AdmissionNo.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(statusFilter) && !statusFilter.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(r => r.ResultStatus.Equals(statusFilter, StringComparison.OrdinalIgnoreCase));
        }

        return query.Select(r => new StudentReportCardRowDto
        {
            ResultId = r.ResultId,
            StudentId = r.StudentId,
            RollNo = r.RollNo,
            StudentName = r.StudentName,
            AdmissionNo = r.AdmissionNo,
            TotalMarksObtained = r.TotalMarksObtained,
            TotalMaxMarks = r.TotalMaxMarks,
            Percentage = r.Percentage,
            Grade = r.Grade,
            Rank = r.Rank,
            ResultStatus = r.ResultStatus
        }).ToList();
    }

    public async Task<ReportCardPrintDetailDto?> GetPrintableReportCardAsync(int studentId, string? className, string? sectionName)
    {
        string cName = string.IsNullOrWhiteSpace(className) ? "" : className;
        string sName = string.IsNullOrWhiteSpace(sectionName) ? "" : sectionName;

        var results = await _repository.GetExamResultsAsync(cName, sName);
        var studentResult = results.FirstOrDefault(r => r.StudentId == studentId || r.RollNo == studentId.ToString());

        if (studentResult == null && results.Any())
        {
            studentResult = results.First();
        }

        if (studentResult == null) return null;

        var scores = new List<SubjectMarksConfigItemDto>();

        return new ReportCardPrintDetailDto
        {
            StudentId = studentResult.StudentId,
            StudentName = studentResult.StudentName,
            RollNo = studentResult.RollNo,
            AdmissionNo = studentResult.AdmissionNo,
            ClassName = studentResult.ClassName,
            SectionName = studentResult.SectionName,
            TotalMarksObtained = studentResult.TotalMarksObtained,
            TotalMaxMarks = studentResult.TotalMaxMarks,
            AcademicYear = "2026-27",
            Rank = studentResult.Rank,
            Percentage = studentResult.Percentage,
            Grade = studentResult.Grade,
            ResultStatus = studentResult.ResultStatus,
            OverallResult = studentResult.ResultStatus,
            SubjectScores = scores
        };
    }

    public async Task<bool> ClearExamResultsAsync(string className, string sectionName)
    {
        return await _repository.ClearExamResultsAsync(className, sectionName);
    }

    public async Task<bool> UpdateExamResultAsync(StudentReportCardRowDto request, string className, string sectionName)
    {
        var entity = new NewStudentExamResult
        {
            ResultId = request.ResultId,
            StudentId = request.StudentId,
            RollNo = request.RollNo,
            StudentName = request.StudentName,
            AdmissionNo = request.AdmissionNo,
            ClassName = className,
            SectionName = sectionName,
            TotalMarksObtained = request.TotalMarksObtained,
            TotalMaxMarks = request.TotalMaxMarks,
            Percentage = request.Percentage,
            Grade = request.Grade,
            Rank = request.Rank,
            ResultStatus = request.ResultStatus
        };

        return await _repository.UpdateExamResultAsync(entity);
    }

    private static CalculateResultsResponseDto MapResponseDto(List<NewStudentExamResult> list)
    {
        int passCount = list.Count(r => r.ResultStatus.Equals("Pass", StringComparison.OrdinalIgnoreCase));
        int failCount = list.Count(r => r.ResultStatus.Equals("Fail", StringComparison.OrdinalIgnoreCase));

        return new CalculateResultsResponseDto
        {
            Success = true,
            Message = "Results processed successfully.",
            TotalStudentsProcessed = list.Count,
            PassedCount = passCount,
            FailedCount = failCount,
            Results = list.Select(r => new StudentReportCardRowDto
            {
                ResultId = r.ResultId,
                StudentId = r.StudentId,
                RollNo = r.RollNo,
                StudentName = r.StudentName,
                AdmissionNo = r.AdmissionNo,
                TotalMarksObtained = r.TotalMarksObtained,
                TotalMaxMarks = r.TotalMaxMarks,
                Percentage = r.Percentage,
                Grade = r.Grade,
                Rank = r.Rank,
                ResultStatus = r.ResultStatus
            }).ToList()
        };
    }
}

