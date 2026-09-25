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

    public async Task<bool> SaveBulkResultsAsync(BulkSaveExamResultsDto request)
    {
        if (request?.Results == null || !request.Results.Any()) return true;

        var entities = request.Results.Select(r => new NewStudentExamResult
        {
            ResultId = 0,
            ExamId = r.ExamId > 0 ? r.ExamId : request.ExamId,
            ClassName = !string.IsNullOrWhiteSpace(r.ClassName) ? r.ClassName : request.ClassName,
            SectionName = !string.IsNullOrWhiteSpace(r.SectionName) ? r.SectionName : request.SectionName,
            StudentId = r.StudentId,
            RollNo = r.RollNo ?? string.Empty,
            StudentName = r.StudentName ?? string.Empty,
            AdmissionNo = r.AdmissionNo ?? string.Empty,
            TotalMarksObtained = r.TotalMarksObtained,
            TotalMaxMarks = r.TotalMaxMarks,
            Percentage = r.Percentage,
            Grade = r.Grade ?? string.Empty,
            Rank = r.Rank,
            ResultStatus = r.ResultStatus ?? string.Empty,
            CalculatedAt = DateTime.UtcNow
        }).ToList();

        // Also save all subject marks to new_student_marks_entries
        var markEntries = new List<NewStudentMarksEntry>();
        foreach (var r in request.Results)
        {
            if (r.SubjectMarks != null && r.SubjectMarks.Any())
            {
                foreach (var sub in r.SubjectMarks)
                {
                    decimal obtained = 0;
                    string attendanceStatus = "Present";
                    if (sub.ObtainedMarks != null)
                    {
                        string obtStr = sub.ObtainedMarks.ToString() ?? "";
                        if (obtStr.Equals("AB", StringComparison.OrdinalIgnoreCase) || obtStr.Equals("Absent", StringComparison.OrdinalIgnoreCase))
                        {
                            attendanceStatus = "Absent";
                        }
                        else
                        {
                            decimal.TryParse(obtStr, out obtained);
                        }
                    }

                    markEntries.Add(new NewStudentMarksEntry
                    {
                        ExamId = r.ExamId > 0 ? r.ExamId : request.ExamId,
                        ClassName = !string.IsNullOrWhiteSpace(r.ClassName) ? r.ClassName : request.ClassName,
                        SectionName = !string.IsNullOrWhiteSpace(r.SectionName) ? r.SectionName : request.SectionName,
                        SubjectCode = !string.IsNullOrWhiteSpace(sub.SubjectCode) ? sub.SubjectCode : sub.Subject,
                        SubjectName = sub.Subject,
                        RollNo = r.RollNo ?? string.Empty,
                        StudentName = r.StudentName ?? string.Empty,
                        AdmissionNo = r.AdmissionNo ?? string.Empty,
                        AttendanceStatus = attendanceStatus,
                        MarksObtained = obtained,
                        MaxMarks = sub.MaxMarks > 0 ? sub.MaxMarks : 100,
                        Grade = sub.Grade ?? string.Empty,
                        EvaluatorRemarks = string.Empty,
                        Status = "Submitted",
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }
        }

        if (markEntries.Any())
        {
            await _marksRepository.SaveBulkMarksEntriesAsync(markEntries);
        }

        return await _repository.SaveBulkResultsAsync(entities);
    }

    public async Task<List<StudentReportCardRowDto>> GetReportCardsListAsync(string? className, string? sectionName, string? search, string? statusFilter)
    {
        var results = await _repository.GetExamResultsAsync(className, sectionName);
        var allMarks = await _marksRepository.GetAllMarksForClassSectionAsync(className, sectionName);

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

        return query.Select(r =>
        {
            var stMarks = allMarks.Where(m =>
                (!string.IsNullOrWhiteSpace(r.RollNo) && m.RollNo.Equals(r.RollNo, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(r.AdmissionNo) && m.AdmissionNo.Equals(r.AdmissionNo, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(r.StudentName) && m.StudentName.Equals(r.StudentName, StringComparison.OrdinalIgnoreCase))
            ).ToList();

            var subjectMarks = stMarks.Select(m => new StudentReportSubjectMarkDto
            {
                Subject = !string.IsNullOrWhiteSpace(m.SubjectName) ? m.SubjectName : m.SubjectCode,
                SubjectCode = m.SubjectCode,
                MaxMarks = m.MaxMarks,
                PassMarks = 0,
                ObtainedMarks = m.AttendanceStatus.Equals("Absent", StringComparison.OrdinalIgnoreCase) ? "AB" : (object)m.MarksObtained,
                Grade = m.Grade ?? string.Empty,
                Status = m.AttendanceStatus.Equals("Absent", StringComparison.OrdinalIgnoreCase) ? "Absent" : (m.Status ?? string.Empty)
            }).ToList();

            return new StudentReportCardRowDto
            {
                ResultId = r.ResultId,
                StudentId = r.StudentId,
                ExamId = r.ExamId,
                ClassName = r.ClassName,
                SectionName = r.SectionName,
                RollNo = r.RollNo,
                StudentName = r.StudentName,
                AdmissionNo = r.AdmissionNo,
                TotalMarksObtained = r.TotalMarksObtained,
                TotalMaxMarks = r.TotalMaxMarks,
                Percentage = r.Percentage,
                Grade = r.Grade,
                Rank = r.Rank,
                ResultStatus = r.ResultStatus,
                SubjectMarks = subjectMarks
            };
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

        var allMarks = await _marksRepository.GetAllMarksForClassSectionAsync(studentResult.ClassName, studentResult.SectionName);
        var stMarks = allMarks.Where(m =>
            (!string.IsNullOrWhiteSpace(studentResult.RollNo) && m.RollNo.Equals(studentResult.RollNo, StringComparison.OrdinalIgnoreCase)) ||
            (!string.IsNullOrWhiteSpace(studentResult.AdmissionNo) && m.AdmissionNo.Equals(studentResult.AdmissionNo, StringComparison.OrdinalIgnoreCase)) ||
            (!string.IsNullOrWhiteSpace(studentResult.StudentName) && m.StudentName.Equals(studentResult.StudentName, StringComparison.OrdinalIgnoreCase))
        ).ToList();

        var scores = stMarks.Select(m => new StudentReportSubjectMarkDto
        {
            Subject = !string.IsNullOrWhiteSpace(m.SubjectName) ? m.SubjectName : m.SubjectCode,
            SubjectCode = m.SubjectCode,
            MaxMarks = m.MaxMarks,
            PassMarks = 0,
            ObtainedMarks = m.AttendanceStatus.Equals("Absent", StringComparison.OrdinalIgnoreCase) ? "AB" : (object)m.MarksObtained,
            Grade = m.Grade ?? string.Empty,
            Status = m.AttendanceStatus.Equals("Absent", StringComparison.OrdinalIgnoreCase) ? "Absent" : (m.Status ?? string.Empty)
        }).ToList();

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
            SubjectScores = scores,
            SubjectMarks = scores
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

