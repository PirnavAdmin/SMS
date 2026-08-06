namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/homework")]
[Authorize]
[Tags("Homework & Assignments")]
public class HomeworkController : ControllerBase
{
    private readonly AppDbContext _context;

    public HomeworkController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get dropdown options for Academic Years and Subjects filter
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public IActionResult GetHomeworkDropdownOptions()
    {
        var options = new HomeworkDropdownOptionsDto
        {
            AcademicYears = new List<string> { "2027-28", "2026-27", "2025-26" },
            Subjects = new List<string> { "All Subjects", "Mathematics", "Social Studies (212)", "English (210)", "Mathematics (110)", "Physics (phy-102)" }
        };

        return Ok(new { success = true, data = options });
    }

    /// <summary>
    /// Get Student Homework list (supports Active Homework tab and Closed Homework tab with subject and date filtering)
    /// </summary>
    [HttpGet("student")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public IActionResult GetStudentHomework(
        [FromQuery] int? studentId = 1,
        [FromQuery] string? academicYear = "2027-28",
        [FromQuery] string? tab = "Homework", // "Homework" (Active) or "Closed"
        [FromQuery] string? subject = "All Subjects",
        [FromQuery] string? date = null)
    {
        bool isClosedTab = !string.IsNullOrWhiteSpace(tab) && tab.Equals("Closed", StringComparison.OrdinalIgnoreCase);

        var activeHomeworks = new List<StudentHomeworkItemDto>
        {
            new StudentHomeworkItemDto
            {
                Id = "hw-1",
                Subject = "English",
                SubjectCode = "210",
                Description = "Write an essay.",
                HomeworkDate = "15/02/2023",
                SubmissionDate = "15/02/2023",
                IsClosed = false
            },
            new StudentHomeworkItemDto
            {
                Id = "hw-2",
                Subject = "English",
                SubjectCode = "210",
                Description = "Read the passage and answer questions.",
                HomeworkDate = "15/02/2023",
                SubmissionDate = "15/02/2023",
                IsClosed = false
            },
            new StudentHomeworkItemDto
            {
                Id = "hw-3",
                Subject = "Mathematics",
                SubjectCode = "110",
                Description = "Solve problems 1-10.",
                HomeworkDate = "13/02/2023",
                SubmissionDate = "16/02/2023",
                IsClosed = false
            }
        };

        var closedHomeworks = new List<StudentHomeworkItemDto>
        {
            new StudentHomeworkItemDto
            {
                Id = "hw-closed-1",
                Subject = "Mathematics",
                SubjectCode = "mat-101",
                Description = "Complete Problems 1 to 25 from textbook.",
                HomeworkDate = "18/07/2026",
                SubmissionDate = "20/07/2026",
                IsClosed = true
            },
            new StudentHomeworkItemDto
            {
                Id = "hw-closed-2",
                Subject = "Social Studies",
                SubjectCode = "212",
                Description = "Complete chapter 4 questions.",
                HomeworkDate = "16/02/2023",
                SubmissionDate = "20/02/2023",
                IsClosed = true
            },
            new StudentHomeworkItemDto
            {
                Id = "hw-closed-3",
                Subject = "Mathematics",
                SubjectCode = "110",
                Description = "Solve problems 11-20.",
                HomeworkDate = "08/02/2023",
                SubmissionDate = "15/02/2023",
                IsClosed = true
            }
        };

        var targetList = isClosedTab ? closedHomeworks : activeHomeworks;

        // Apply Subject Filter
        if (!string.IsNullOrWhiteSpace(subject) && !subject.Equals("All Subjects", StringComparison.OrdinalIgnoreCase))
        {
            targetList = targetList.Where(h => 
                h.Subject.Contains(subject, StringComparison.OrdinalIgnoreCase) || 
                h.SubjectDisplay.Contains(subject, StringComparison.OrdinalIgnoreCase) ||
                h.SubjectCode.Contains(subject, StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        // Apply Date Filter if provided
        if (!string.IsNullOrWhiteSpace(date))
        {
            targetList = targetList.Where(h => h.HomeworkDate.Contains(date) || h.SubmissionDate.Contains(date)).ToList();
        }

        return Ok(new
        {
            success = true,
            tab = isClosedTab ? "Closed Homework" : "Homework",
            academicYear = academicYear ?? "2027-28",
            totalCount = targetList.Count,
            data = targetList
        });
    }

    /// <summary>
    /// Get all homework assignments (Admin/Teacher/Student view)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetAllHomework([FromQuery] string? className, [FromQuery] string? subjectName, [FromQuery] string? search)
    {
        var query = _context.Homeworks.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("All Classes", StringComparison.OrdinalIgnoreCase))
            query = query.Where(h => h.ClassName.ToLower() == className.ToLower());

        if (!string.IsNullOrWhiteSpace(subjectName) && !subjectName.Equals("All Subjects", StringComparison.OrdinalIgnoreCase))
            query = query.Where(h => h.SubjectName.ToLower() == subjectName.ToLower());

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(h => h.Title.Contains(search) || (h.Description != null && h.Description.Contains(search)));

        var list = await query.OrderByDescending(h => h.CreatedAt).ToListAsync();

        var result = list.Select(h => new HomeworkResponseDto
        {
            HomeworkId = h.HomeworkId,
            ClassName = h.ClassName,
            SubjectName = h.SubjectName,
            Title = h.Title,
            Description = h.Description,
            DueDate = h.DueDate.ToString("yyyy-MM-dd"),
            AttachmentFileName = h.AttachmentFileName,
            AttachmentUrl = h.AttachmentUrl,
            TeacherName = h.TeacherName,
            SubmissionsCount = h.SubmissionsCount,
            CreatedAt = h.CreatedAt.ToString("yyyy-MM-dd")
        }).ToList();

        return Ok(new { success = true, data = result });
    }
}
