namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/homework")]
[Authorize(Roles = "Admin,Teacher,Student")]
[Tags("Homework & Assignments")]
public class HomeworkController : ControllerBase
{
    private readonly AppDbContext _context;

    public HomeworkController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
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

    [HttpPost]
    public async Task<IActionResult> CreateHomework([FromBody] HomeworkCreateDto dto)
    {
        DateTime due = DateTime.TryParse(dto.DueDate, out var d) ? d : DateTime.UtcNow.AddDays(7);

        var entity = new Homework
        {
            ClassName = dto.ClassName,
            SubjectName = dto.SubjectName,
            Title = dto.Title,
            Description = dto.Description,
            DueDate = due,
            AttachmentFileName = dto.AttachmentFileName ?? "Chapter4_Guide.pdf",
            AttachmentUrl = dto.AttachmentUrl,
            TeacherName = dto.TeacherName,
            SubmissionsCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Homeworks.AddAsync(entity);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Homework created successfully.", data = entity });
    }
}
