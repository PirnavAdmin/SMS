using System.Security.Claims;
using SMS.Api.Dtos.Academic;
using SMS.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SMS.Api.Controllers;

[ApiController]
[Route("api/academics")]
[Authorize]
public class AcademicController : ControllerBase
{
    private readonly IAcademicService _service;

    public AcademicController(
        IAcademicService service)
    {
        _service = service;
    }

    [HttpGet("class-grades")]
    public async Task<IActionResult> GetAll(
        [FromQuery] AcademicFilterDto filter,
        CancellationToken cancellationToken)
    {
        PagedAcademicResultDto result =
            await _service.GetAllAsync(
                filter,
                cancellationToken);

        return Ok(new
        {
            success = true,
            message = "Academic classes retrieved successfully.",
            data = result
        });
    }

    [HttpGet("class-grades/{classGradeId:long}")]
    public async Task<IActionResult> GetById(
        long classGradeId,
        CancellationToken cancellationToken)
    {
        AcademicClassGradeDto? result =
            await _service.GetByIdAsync(
                classGradeId,
                cancellationToken);

        if (result is null)
        {
            return NotFound(new
            {
                success = false,
                message = "Academic class grade was not found."
            });
        }

        return Ok(new
        {
            success = true,
            message = "Academic class retrieved successfully.",
            data = result
        });
    }

    [HttpPost("class-grades")]
    public async Task<IActionResult> Create(
        [FromBody] CreateAcademicClassGradeDto dto,
        CancellationToken cancellationToken)
    {
        long userId = GetCurrentUserId();

        long classGradeId =
            await _service.CreateAsync(
                dto,
                userId,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                classGradeId
            },
            new
            {
                success = true,
                message = "Academic class grade created successfully.",
                data = new
                {
                    classGradeId
                }
            });
    }

    [HttpPut("class-grades/{classGradeId:long}")]
    public async Task<IActionResult> Update(
        long classGradeId,
        [FromBody] UpdateAcademicClassGradeDto dto,
        CancellationToken cancellationToken)
    {
        long userId = GetCurrentUserId();

        bool updated =
            await _service.UpdateAsync(
                classGradeId,
                dto,
                userId,
                cancellationToken);

        if (!updated)
        {
            return NotFound(new
            {
                success = false,
                message = "Academic class grade was not found."
            });
        }

        return Ok(new
        {
            success = true,
            message = "Academic class grade updated successfully."
        });
    }

    [HttpDelete("class-grades/{classGradeId:long}")]
    public async Task<IActionResult> Delete(
        long classGradeId,
        CancellationToken cancellationToken)
    {
        long userId = GetCurrentUserId();

        bool deleted =
            await _service.DeleteAsync(
                classGradeId,
                userId,
                cancellationToken);

        if (!deleted)
        {
            return NotFound(new
            {
                success = false,
                message = "Academic class grade was not found."
            });
        }

        return Ok(new
        {
            success = true,
            message = "Academic class grade deleted successfully."
        });
    }

    [HttpPost("class-grades/{classGradeId:long}/sections")]
    public async Task<IActionResult> AddSection(
        long classGradeId,
        [FromBody] CreateAcademicSectionDto dto,
        CancellationToken cancellationToken)
    {
        long userId = GetCurrentUserId();

        long sectionId =
            await _service.AddSectionAsync(
                classGradeId,
                dto,
                userId,
                cancellationToken);

        return Ok(new
        {
            success = true,
            message = "Section added successfully.",
            data = new
            {
                sectionId
            }
        });
    }

    [HttpPut("sections/{sectionId:long}")]
    public async Task<IActionResult> UpdateSection(
        long sectionId,
        [FromBody] UpdateAcademicSectionDto dto,
        CancellationToken cancellationToken)
    {
        long userId = GetCurrentUserId();

        bool updated =
            await _service.UpdateSectionAsync(
                sectionId,
                dto,
                userId,
                cancellationToken);

        if (!updated)
        {
            return NotFound(new
            {
                success = false,
                message = "Section was not found."
            });
        }

        return Ok(new
        {
            success = true,
            message = "Section updated successfully."
        });
    }

    [HttpDelete("sections/{sectionId:long}")]
    public async Task<IActionResult> DeleteSection(
        long sectionId,
        CancellationToken cancellationToken)
    {
        long userId = GetCurrentUserId();

        bool deleted =
            await _service.DeleteSectionAsync(
                sectionId,
                userId,
                cancellationToken);

        if (!deleted)
        {
            return NotFound(new
            {
                success = false,
                message = "Section was not found."
            });
        }

        return Ok(new
        {
            success = true,
            message = "Section deleted successfully."
        });
    }

    [HttpPost("class-grades/{classGradeId:long}/subjects")]
    public async Task<IActionResult> AddSubjects(
        long classGradeId,
        [FromBody] AddClassSubjectsDto dto,
        CancellationToken cancellationToken)
    {
        long userId = GetCurrentUserId();

        await _service.AddSubjectsAsync(
            classGradeId,
            dto,
            userId,
            cancellationToken);

        return Ok(new
        {
            success = true,
            message = "Subjects added successfully."
        });
    }

    [HttpDelete(
        "class-grades/{classGradeId:long}/subjects/{subjectId:long}")]
    public async Task<IActionResult> RemoveSubject(
        long classGradeId,
        long subjectId,
        CancellationToken cancellationToken)
    {
        bool removed =
            await _service.RemoveSubjectAsync(
                classGradeId,
                subjectId,
                cancellationToken);

        if (!removed)
        {
            return NotFound(new
            {
                success = false,
                message = "Class subject was not found."
            });
        }

        return Ok(new
        {
            success = true,
            message = "Subject removed successfully."
        });
    }

    [HttpGet("lookups/teachers")]
    public async Task<IActionResult> SearchTeachers(
        [FromQuery] string? search,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        List<TeacherLookupDto> result =
            await _service.SearchTeachersAsync(
                search,
                limit,
                cancellationToken);

        return Ok(new
        {
            success = true,
            message = "Teachers retrieved successfully.",
            data = result
        });
    }

    [HttpGet("lookups/subjects")]
    public async Task<IActionResult> SearchSubjects(
        [FromQuery] string? search,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        List<SubjectLookupDto> result =
            await _service.SearchSubjectsAsync(
                search,
                limit,
                cancellationToken);

        return Ok(new
        {
            success = true,
            message = "Subjects retrieved successfully.",
            data = result
        });
    }

    private long GetCurrentUserId()
    {
        string? userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("userId")
            ?? User.FindFirstValue("user_id");

        return long.TryParse(userIdValue, out long userId)
            ? userId
            : 1;
    }
}