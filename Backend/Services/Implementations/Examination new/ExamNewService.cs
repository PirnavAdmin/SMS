namespace SMS.Api.Services.Implementations.ExaminationNew;

using SMS.Api.Dtos.ExaminationNew;
using SMS.Api.Models.ExaminationNew;
using SMS.Api.Repositories.Interfaces.ExaminationNew;
using SMS.Api.Services.Interfaces.ExaminationNew;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamNewService : IExamNewService
{
    private readonly IExamNewRepository _repository;

    public ExamNewService(IExamNewRepository repository)
    {
        _repository = repository;
    }

    public async Task<ExamConfigOptionsDto> GetExamOptionsAsync()
    {
        var options = new ExamConfigOptionsDto();
        var allExams = await _repository.GetAllExamsAsync();

        options.ExistingExams = allExams.Select(e => new ExamDropdownItemDto
        {
            ExamId = e.ExamId,
            ExamName = e.ExamName,
            Status = e.Status
        }).ToList();

        return options;
    }

    public async Task<ExamDetailsResponseDto?> GetExamDetailsByIdAsync(int examId)
    {
        var exam = await _repository.GetExamByIdAsync(examId);
        if (exam == null) return null;

        return new ExamDetailsResponseDto
        {
            ExamId = exam.ExamId,
            ExamName = exam.ExamName,
            AssessmentType = exam.AssessmentType,
            AcademicTerm = exam.AcademicTerm,
            StartDate = exam.StartDate.ToString("yyyy-MM-dd"),
            EndDate = exam.EndDate.ToString("yyyy-MM-dd"),
            ApplicableClasses = (exam.ApplicableClasses ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).ToList(),
            Status = exam.Status
        };
    }

    public async Task<ExamDetailsResponseDto> SaveExamDetailsAsync(SaveExamDetailsRequestDto request)
    {
        DateTime startDate = DateTime.TryParse(request.StartDate, out var sDate) ? sDate : DateTime.UtcNow;
        DateTime endDate = DateTime.TryParse(request.EndDate, out var eDate) ? eDate : DateTime.UtcNow.AddDays(7);

        var entity = new NewExamination
        {
            ExamId = request.ExamId ?? 0,
            ExamName = request.ExamName,
            AssessmentType = request.AssessmentType,
            AcademicTerm = request.AcademicTerm,
            StartDate = startDate,
            EndDate = endDate,
            ApplicableClasses = string.Join(",", request.ApplicableClasses ?? new List<string>()),
            Status = "Draft"
        };

        var saved = await _repository.SaveExamDetailsAsync(entity);

        return new ExamDetailsResponseDto
        {
            ExamId = saved.ExamId,
            ExamName = saved.ExamName,
            AssessmentType = saved.AssessmentType,
            AcademicTerm = saved.AcademicTerm,
            StartDate = saved.StartDate.ToString("yyyy-MM-dd"),
            EndDate = saved.EndDate.ToString("yyyy-MM-dd"),
            ApplicableClasses = (saved.ApplicableClasses ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).ToList(),
            Status = saved.Status
        };
    }

    public async Task<SubjectConfigPageResponseDto?> GetSubjectsForExamAsync(int examId, string? className)
    {
        var exam = await _repository.GetExamByIdAsync(examId);
        if (exam == null) return null;

        string targetClass = string.IsNullOrWhiteSpace(className) ? "Class 1" : className;

        var availableSubjects = new List<SubjectMarksConfigItemDto>
        {
            new SubjectMarksConfigItemDto { SubjectCode = "MTH-101", SubjectName = "Mathematics", IsActive = false, MaxMarks = 100, PassMarks = 35 },
            new SubjectMarksConfigItemDto { SubjectCode = "CHM-103", SubjectName = "Chemistry", IsActive = false, MaxMarks = 100, PassMarks = 35 },
            new SubjectMarksConfigItemDto { SubjectCode = "ENG-105", SubjectName = "English Literature", IsActive = false, MaxMarks = 100, PassMarks = 35 },
            new SubjectMarksConfigItemDto { SubjectCode = "HIS-107", SubjectName = "History", IsActive = false, MaxMarks = 100, PassMarks = 35 },
            new SubjectMarksConfigItemDto { SubjectCode = "ACC-109", SubjectName = "Accounts", IsActive = false, MaxMarks = 100, PassMarks = 35 },
            new SubjectMarksConfigItemDto { SubjectCode = "PHY-102", SubjectName = "Physics", IsActive = false, MaxMarks = 100, PassMarks = 35 }
        };

        var applicableClasses = (exam.ApplicableClasses ?? "Class 1").Split(',', StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).ToList();
        if (!applicableClasses.Any()) applicableClasses.Add("Class 1");

        return new SubjectConfigPageResponseDto
        {
            ExamId = examId,
            ExamName = exam.ExamName,
            ClassName = targetClass,
            AvailableClasses = applicableClasses,
            Subjects = availableSubjects
        };
    }

    public async Task<bool> SaveSubjectsAndProceedAsync(SaveSubjectsAndMarksRequestDto request)
    {
        var configs = request.Subjects.Select(s => new NewExamSubjectConfig
        {
            ExamId = request.ExamId,
            ClassName = request.ClassName,
            SubjectCode = s.SubjectCode,
            SubjectName = s.SubjectName,
            IsActive = s.IsActive,
            MaxMarks = s.MaxMarks,
            PassMarks = s.PassMarks
        }).ToList();

        return await _repository.SaveSubjectConfigsAsync(request.ExamId, request.ClassName, configs, request.ProceedToSchedule);
    }

    public async Task<bool> DeleteExamAsync(int examId)
    {
        return await _repository.DeleteExamAsync(examId);
    }
}
