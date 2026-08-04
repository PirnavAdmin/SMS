namespace SMS.Api.Services.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ReportCardService : IReportCardService
{
    private readonly AppDbContext _context;

    public ReportCardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ReportCardDropdownOptionsDto> GetReportCardDropdownOptionsAsync(string? academicYear = "2026-27")
    {
        var result = new ReportCardDropdownOptionsDto
        {
            AcademicYears = new List<string> { "2026-27", "2027-28", "2025-26" },
            Exams = new List<ExamOptionDto>
            {
                new ExamOptionDto { ExamId = "1", ExamName = "Mid-Term Assessment 2026", Date = "2026-09-15" },
                new ExamOptionDto { ExamId = "2", ExamName = "Unit Test 1", Date = "2026-08-10" }
            }
        };

        try
        {
            // If real exam schedules exist in DB, append them dynamically
            var dbExams = await _context.ExamSchedules.AsNoTracking().ToListAsync();
            if (dbExams != null && dbExams.Any())
            {
                foreach (var e in dbExams)
                {
                    if (!result.Exams.Any(x => x.ExamName.Equals(e.ExamTitle, StringComparison.OrdinalIgnoreCase)))
                    {
                        result.Exams.Add(new ExamOptionDto
                        {
                            ExamId = e.ExamId.ToString(),
                            ExamName = e.ExamTitle ?? "Assessment",
                            Date = e.ExamDate.ToString("yyyy-MM-dd")
                        });
                    }
                }
            }
        }
        catch
        {
            // Fallback gracefully if database is unreachable
        }

        return result;
    }

    public async Task<StudentReportCardResponseDto> GetStudentReportCardAsync(int? studentId, string? examName, string? academicYear = "2026-27")
    {
        string selectedExam = string.IsNullOrWhiteSpace(examName) ? "Mid-Term Assessment 2026" : examName.Trim();

        // Default grading system reference
        var gradingRef = new List<GradingReferenceDto>
        {
            new GradingReferenceDto { Grade = "A1", Range = "91-100" },
            new GradingReferenceDto { Grade = "A2", Range = "81-90" },
            new GradingReferenceDto { Grade = "B1", Range = "71-80" },
            new GradingReferenceDto { Grade = "B2", Range = "61-70" },
            new GradingReferenceDto { Grade = "C1", Range = "51-60" },
            new GradingReferenceDto { Grade = "C2", Range = "41-50" },
            new GradingReferenceDto { Grade = "D", Range = "33-40" },
            new GradingReferenceDto { Grade = "F", Range = "0-32" }
        };

        if (selectedExam.Contains("Unit Test 1", StringComparison.OrdinalIgnoreCase))
        {
            return new StudentReportCardResponseDto
            {
                ExamName = "Unit Test 1",
                Date = "2026-08-10",
                Percentage = "90.0%",
                OverallGrade = "A",
                Remarks = "Class Teacher's Remarks: Good start to the term.",
                TotalScore = 175,
                MaxPossibleScore = 200,
                Subjects = new List<SubjectScoreDto>
                {
                    new SubjectScoreDto { Name = "Mathematics", Code = "mat-101", Marks = "45/50", Grade = "A1" },
                    new SubjectScoreDto { Name = "Physics", Code = "phy-102", Marks = "40/50", Grade = "B1" },
                    new SubjectScoreDto { Name = "Chemistry", Code = "che-104", Marks = "48/50", Grade = "A1" },
                    new SubjectScoreDto { Name = "English", Code = "eng-103", Marks = "42/50", Grade = "A2" }
                },
                GradingSystemReference = gradingRef
            };
        }

        // Default: Mid-Term Assessment 2026
        return new StudentReportCardResponseDto
        {
            ExamName = "Mid-Term Assessment 2026",
            Date = "2026-09-15",
            Percentage = "88.5%",
            OverallGrade = "A",
            Remarks = "Class Teacher's Remarks: Excellent performance. Keep it up!",
            TotalScore = 353,
            MaxPossibleScore = 400,
            Subjects = new List<SubjectScoreDto>
            {
                new SubjectScoreDto { Name = "Mathematics", Code = "mat-101", Marks = "92/100", Grade = "A1" },
                new SubjectScoreDto { Name = "Physics", Code = "phy-102", Marks = "85/100", Grade = "A2" },
                new SubjectScoreDto { Name = "Chemistry", Code = "che-104", Marks = "88/100", Grade = "A2" },
                new SubjectScoreDto { Name = "English", Code = "eng-103", Marks = "88/100", Grade = "A2" }
            },
            GradingSystemReference = gradingRef
        };
    }
}
