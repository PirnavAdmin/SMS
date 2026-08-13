using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Services.Interfaces;
using System.IO;

namespace SMS.Api.Controllers;

[ApiController]
[Route("api/v1/students")]
public class StudentController : ControllerBase
{
    private readonly ISchoolService _schoolService;
    private readonly AppDbContext _context;

    public StudentController(ISchoolService schoolService, AppDbContext context)
    {
        _schoolService = schoolService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PagedStudentResponseDto>> GetAllStudents(
        [FromQuery] StudentFilterDto filter)
    {
        var result = await _schoolService.GetAllStudentsAsync(filter);
        return Ok(result);
    }

    [HttpGet("{studentId:int}")]
    public async Task<ActionResult<StudentDetailsDto>> GetStudentById(int studentId)
    {
        var result = await _schoolService.GetStudentByIdAsync(studentId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<StudentDetailsDto>> CreateStudent(
        [FromBody] CreateStudentDto dto)
    {
        var result = await _schoolService.CreateStudentAsync(dto);

        return CreatedAtAction(
            nameof(GetStudentById),
            new { studentId = result.StudentId },
            result);
    }

    [HttpPut("{studentId:int}")]
    public async Task<ActionResult<StudentDetailsDto>> UpdateStudent(
        int studentId,
        [FromBody] UpdateStudentDto dto)
    {
        var result = await _schoolService.UpdateStudentAsync(studentId, dto);
        return Ok(result);
    }

    [HttpPatch("{studentId:int}/status")]
    public async Task<IActionResult> UpdateStudentStatus(
        int studentId,
        [FromBody] UpdateStudentStatusDto dto)
    {
        await _schoolService.UpdateStudentStatusAsync(studentId, dto);

        return Ok(new
        {
            message = "Student status updated successfully."
        });
    }

    [HttpDelete("{studentId:int}")]
    public async Task<IActionResult> DeleteStudent(int studentId)
    {
        await _schoolService.DeleteStudentAsync(studentId);

        return Ok(new
        {
            message = "Student deleted successfully."
        });
    }

    [HttpGet("dropdowns/academic-years")]
    public async Task<ActionResult<List<StudentDropdownDto>>> GetAcademicYears(
        [FromQuery] string? search)
    {
        var result = await _schoolService.GetAcademicYearDropdownAsync(search);
        return Ok(result);
    }

    [HttpGet("dropdowns/classes")]
    public async Task<ActionResult<List<StudentDropdownDto>>> GetClasses(
        [FromQuery] string? search)
    {
        var result = await _schoolService.GetClassDropdownAsync(search);
        return Ok(result);
    }

    [HttpGet("dropdowns/sections")]
    public async Task<ActionResult<List<StudentDropdownDto>>> GetSections(
        [FromQuery] int classId,
        [FromQuery] string? search)
    {
        var result = await _schoolService.GetSectionDropdownAsync(classId, search);
        return Ok(result);
    }

    [HttpPost("{studentId:int}/image")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadStudentImage(int studentId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, message = "No file was uploaded." });

        var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentId == studentId);
        if (student == null)
            return NotFound(new { success = false, message = $"Student with ID '{studentId}' not found." });

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
            return BadRequest(new { success = false, message = "Only image files (.jpg, .jpeg, .png, .gif) are allowed." });

        var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "students");
        if (!Directory.Exists(uploadFolder))
        {
            Directory.CreateDirectory(uploadFolder);
        }

        var uniqueFileName = $"{studentId}_{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var oldImages = await _context.StudentImages.Where(img => img.StudentId == studentId).ToListAsync();
        _context.StudentImages.RemoveRange(oldImages);

        var studentImg = new StudentImage
        {
            StudentId = studentId,
            FileName = file.FileName,
            StoredFileName = uniqueFileName,
            ContentType = file.ContentType,
            FilePath = filePath,
            FileSize = file.Length,
            CreatedAt = DateTime.UtcNow
        };

        await _context.StudentImages.AddAsync(studentImg);
        
        student.Avatar = $"/api/v1/students/{studentId}/image";
        await _context.SaveChangesAsync();

        return Ok(new { success = true, avatarUrl = student.Avatar });
    }

    [HttpGet("{studentId:int}/image")]
    public async Task<IActionResult> GetStudentImage(int studentId)
    {
        var studentImg = await _context.StudentImages
            .OrderByDescending(img => img.CreatedAt)
            .FirstOrDefaultAsync(img => img.StudentId == studentId);

        if (studentImg == null || !System.IO.File.Exists(studentImg.FilePath))
        {
            var defaultAvatarPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "assets", "default-avatar.png");
            if (System.IO.File.Exists(defaultAvatarPath))
            {
                return PhysicalFile(defaultAvatarPath, "image/png");
            }
            return NotFound(new { success = false, message = "No image found for student." });
        }

        return PhysicalFile(studentImg.FilePath, studentImg.ContentType);
    }
}