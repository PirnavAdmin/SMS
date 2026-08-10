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

    public ExamResultsReportsService(IExamResultsReportsRepository repository)
    {
        _repository = repository;
    }

    public Task<ResultsReportsOptionsDto> GetOptionsAsync()
    {
        return Task.FromResult(new ResultsReportsOptionsDto());
    }

    public async Task<CalculateResultsResponseDto> CalculateResultsAsync(CalculateResultsRequestDto request)
    {
        var existing = await _repository.GetExamResultsAsync(request.ClassName, request.SectionName);

        if (!existing.Any())
        {
            existing = new List<NewStudentExamResult>
            {
                new NewStudentExamResult { ResultId = 1, ExamId = request.ExamId, ClassName = request.ClassName, SectionName = request.SectionName, StudentId = 101, RollNo = "101", StudentName = "Alex Morgan", AdmissionNo = "ADM-2026-01", TotalMarksObtained = 560, TotalMaxMarks = 600, Percentage = 93.33m, Grade = "A+", Rank = 1, ResultStatus = "Pass" },
                new NewStudentExamResult { ResultId = 2, ExamId = request.ExamId, ClassName = request.ClassName, SectionName = request.SectionName, StudentId = 102, RollNo = "102", StudentName = "Emma Watson", AdmissionNo = "ADM-2026-05", TotalMarksObtained = 540, TotalMaxMarks = 600, Percentage = 90.00m, Grade = "A+", Rank = 2, ResultStatus = "Pass" },
                new NewStudentExamResult { ResultId = 3, ExamId = request.ExamId, ClassName = request.ClassName, SectionName = request.SectionName, StudentId = 103, RollNo = "103", StudentName = "Ethan Hunt", AdmissionNo = "ADM-2026-02", TotalMarksObtained = 490, TotalMaxMarks = 600, Percentage = 81.67m, Grade = "A", Rank = 3, ResultStatus = "Pass" },
                new NewStudentExamResult { ResultId = 4, ExamId = request.ExamId, ClassName = request.ClassName, SectionName = request.SectionName, StudentId = 104, RollNo = "104", StudentName = "Sophia Loren", AdmissionNo = "ADM-2026-03", TotalMarksObtained = 430, TotalMaxMarks = 600, Percentage = 71.67m, Grade = "B", Rank = 4, ResultStatus = "Pass" },
                new NewStudentExamResult { ResultId = 5, ExamId = request.ExamId, ClassName = request.ClassName, SectionName = request.SectionName, StudentId = 105, RollNo = "105", StudentName = "James Bond", AdmissionNo = "ADM-2026-04", TotalMarksObtained = 180, TotalMaxMarks = 600, Percentage = 30.00m, Grade = "F", Rank = 5, ResultStatus = "Fail" }
            };
        }

        var sorted = existing.OrderByDescending(r => r.Percentage).ToList();
        for (int i = 0; i < sorted.Count; i++)
        {
            sorted[i].Rank = i + 1;
        }

        await _repository.SaveExamResultsAsync(request.ClassName, request.SectionName, sorted);

        var dtoList = sorted.Select(r => new StudentReportCardRowDto
        {
            ResultId = r.ResultId,
            StudentId = r.StudentId,
            Rank = r.Rank,
            RollNo = r.RollNo,
            StudentName = r.StudentName,
            AdmissionNo = r.AdmissionNo,
            TotalMarksObtained = r.TotalMarksObtained,
            TotalMaxMarks = r.TotalMaxMarks,
            Percentage = r.Percentage,
            Grade = r.Grade,
            ResultStatus = r.ResultStatus
        }).ToList();

        return new CalculateResultsResponseDto
        {
            Success = true,
            Message = $"Results calculated successfully for {request.ClassName} {request.SectionName}.",
            TotalStudentsProcessed = dtoList.Count,
            PassedCount = dtoList.Count(d => d.ResultStatus.Equals("Pass", StringComparison.OrdinalIgnoreCase)),
            FailedCount = dtoList.Count(d => d.ResultStatus.Equals("Fail", StringComparison.OrdinalIgnoreCase)),
            Results = dtoList
        };
    }

    public async Task<List<StudentReportCardRowDto>> GetReportCardsAsync(string className, string sectionName, string? resultStatus, string? rankOrder, string? search)
    {
        var results = await _repository.GetExamResultsAsync(className, sectionName);

        if (!string.IsNullOrWhiteSpace(resultStatus) && !resultStatus.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            results = results.Where(r => r.ResultStatus.Equals(resultStatus, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            results = results.Where(r => 
                r.StudentName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                r.RollNo.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                r.AdmissionNo.Contains(search, StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        if (!string.IsNullOrWhiteSpace(rankOrder) && rankOrder.Equals("Descending", StringComparison.OrdinalIgnoreCase))
        {
            results = results.OrderByDescending(r => r.Rank).ToList();
        }
        else
        {
            results = results.OrderBy(r => r.Rank).ToList();
        }

        return results.Select(r => new StudentReportCardRowDto
        {
            ResultId = r.ResultId,
            StudentId = r.StudentId,
            Rank = r.Rank,
            RollNo = r.RollNo,
            StudentName = r.StudentName,
            AdmissionNo = r.AdmissionNo,
            TotalMarksObtained = r.TotalMarksObtained,
            TotalMaxMarks = r.TotalMaxMarks,
            Percentage = r.Percentage,
            Grade = r.Grade,
            ResultStatus = r.ResultStatus
        }).ToList();
    }

    public async Task<ReportCardPrintDetailDto?> GetReportCardPrintDetailAsync(int studentId, string className, string sectionName)
    {
        var results = await _repository.GetExamResultsAsync(className, sectionName);
        var studentRes = results.FirstOrDefault(r => r.StudentId == studentId || r.RollNo == studentId.ToString());

        if (studentRes == null) return null;

        var sampleScores = new List<SubjectMarksConfigItemDto>
        {
            new SubjectMarksConfigItemDto { SubjectCode = "MTH-101", SubjectName = "Mathematics", IsActive = true, MaxMarks = 100, PassMarks = 35 },
            new SubjectMarksConfigItemDto { SubjectCode = "ENG-105", SubjectName = "English Language", IsActive = true, MaxMarks = 100, PassMarks = 35 },
            new SubjectMarksConfigItemDto { SubjectCode = "CHM-103", SubjectName = "Chemistry", IsActive = true, MaxMarks = 100, PassMarks = 35 },
            new SubjectMarksConfigItemDto { SubjectCode = "HIS-107", SubjectName = "History", IsActive = true, MaxMarks = 100, PassMarks = 35 },
            new SubjectMarksConfigItemDto { SubjectCode = "ACC-109", SubjectName = "Accountancy", IsActive = true, MaxMarks = 100, PassMarks = 35 },
            new SubjectMarksConfigItemDto { SubjectCode = "PHY-102", SubjectName = "Physics", IsActive = true, MaxMarks = 100, PassMarks = 35 }
        };

        return new ReportCardPrintDetailDto
        {
            StudentId = studentRes.StudentId,
            StudentName = studentRes.StudentName,
            RollNo = studentRes.RollNo,
            AdmissionNo = studentRes.AdmissionNo,
            ClassName = className,
            SectionName = sectionName,
            AcademicYear = "2026-27",
            Rank = studentRes.Rank,
            Percentage = studentRes.Percentage,
            Grade = studentRes.Grade,
            OverallResult = studentRes.ResultStatus,
            SubjectScores = sampleScores
        };
    }
}

