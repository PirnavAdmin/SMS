namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;

[ApiController]
[Route("api/application-drafts")]
[Authorize]
[Tags("Application Drafts")]
public class ApplicationDraftsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ApplicationDraftsController(AppDbContext context)
    {
        _context = context;
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst(ClaimTypes.Email)?.Value
            ?? "system_user";
    }

    private string GetCurrentUserName()
    {
        return User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst("name")?.Value
            ?? User.FindFirst(ClaimTypes.Email)?.Value
            ?? "User";
    }

    private static ApplicationDraftResponseDto MapToResponseDto(ApplicationDraft draft)
    {
        object? parsedFormData = null;
        if (!string.IsNullOrWhiteSpace(draft.FormData))
        {
            try
            {
                parsedFormData = JsonSerializer.Deserialize<object>(draft.FormData);
            }
            catch
            {
                parsedFormData = draft.FormData;
            }
        }

        return new ApplicationDraftResponseDto
        {
            Id = draft.Id,
            FormType = draft.FormType,
            DraftKey = draft.DraftKey,
            UserId = draft.UserId,
            UserName = draft.UserName,
            Branch = draft.Branch,
            AcademicYear = draft.AcademicYear,
            ApplicantName = draft.ApplicantName,
            CurrentStep = draft.CurrentStep,
            FormData = parsedFormData,
            Status = draft.Status,
            CreatedAt = draft.CreatedAt,
            UpdatedAt = draft.UpdatedAt
        };
    }

    [HttpGet]
    public async Task<IActionResult> GetDrafts(
        [FromQuery] string? formType = null,
        [FromQuery] string? draftKey = null)
    {
        var userId = GetCurrentUserId();
        var query = _context.ApplicationDrafts
            .AsNoTracking()
            .Where(d => d.Status == "Draft");

        if (!string.IsNullOrWhiteSpace(formType))
        {
            query = query.Where(d => d.FormType == formType);
        }

        if (!string.IsNullOrWhiteSpace(draftKey))
        {
            query = query.Where(d => d.DraftKey == draftKey);
        }

        // Drafts belonging to the current user or shared drafts without user
        query = query.Where(d => d.UserId == userId || string.IsNullOrEmpty(d.UserId));

        var drafts = await query
            .OrderByDescending(d => d.UpdatedAt)
            .Take(50)
            .ToListAsync();

        var result = drafts.Select(MapToResponseDto).ToList();
        return Ok(new { success = true, data = result });
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveDraft(
        [FromQuery] string formType,
        [FromQuery] string? draftKey = null)
    {
        if (string.IsNullOrWhiteSpace(formType))
        {
            return BadRequest(new { success = false, message = "FormType is required." });
        }

        var userId = GetCurrentUserId();
        var query = _context.ApplicationDrafts
            .AsNoTracking()
            .Where(d => d.Status == "Draft" && d.FormType == formType);

        if (!string.IsNullOrWhiteSpace(draftKey))
        {
            query = query.Where(d => d.DraftKey == draftKey);
        }

        query = query.Where(d => d.UserId == userId || string.IsNullOrEmpty(d.UserId));

        var draft = await query
            .OrderByDescending(d => d.UpdatedAt)
            .FirstOrDefaultAsync();

        if (draft == null)
        {
            return Ok(new { success = true, data = (object?)null });
        }

        return Ok(new { success = true, data = MapToResponseDto(draft) });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDraftById(int id)
    {
        var draft = await _context.ApplicationDrafts.FindAsync(id);
        if (draft == null || draft.Status != "Draft")
        {
            return NotFound(new { success = false, message = $"Draft with id {id} not found." });
        }

        return Ok(new { success = true, data = MapToResponseDto(draft) });
    }

    [HttpPost]
    public async Task<IActionResult> SaveDraft(
        [FromBody] SaveApplicationDraftRequestDto dto,
        [FromHeader(Name = "X-Branch-Id")] string? headerBranch = null,
        [FromHeader(Name = "X-Academic-Year-Id")] string? headerAcademicYear = null)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.FormType))
        {
            return BadRequest(new { success = false, message = "FormType is required." });
        }

        var userId = GetCurrentUserId();
        var userName = GetCurrentUserName();
        var branch = !string.IsNullOrWhiteSpace(dto.Branch) ? dto.Branch : headerBranch;
        var academicYear = !string.IsNullOrWhiteSpace(dto.AcademicYear) ? dto.AcademicYear : headerAcademicYear;
        var draftKey = !string.IsNullOrWhiteSpace(dto.DraftKey) ? dto.DraftKey : "default";

        string rawFormDataJson = "{}";
        if (dto.FormData.HasValue)
        {
            rawFormDataJson = dto.FormData.Value.GetRawText();
        }

        ApplicationDraft? draft = null;

        if (dto.Id.HasValue && dto.Id.Value > 0)
        {
            draft = await _context.ApplicationDrafts.FirstOrDefaultAsync(d => d.Id == dto.Id.Value);
        }

        if (draft == null)
        {
            // Try to find active draft with same formType, draftKey, and userId
            draft = await _context.ApplicationDrafts
                .FirstOrDefaultAsync(d => d.FormType == dto.FormType && d.DraftKey == draftKey && d.UserId == userId && d.Status == "Draft");
        }

        if (draft == null)
        {
            draft = new ApplicationDraft
            {
                FormType = dto.FormType,
                DraftKey = draftKey,
                UserId = userId,
                UserName = userName,
                Branch = branch,
                AcademicYear = academicYear,
                ApplicantName = dto.ApplicantName,
                CurrentStep = dto.CurrentStep > 0 ? dto.CurrentStep : 1,
                FormData = rawFormDataJson,
                Status = "Draft",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.ApplicationDrafts.Add(draft);
        }
        else
        {
            draft.ApplicantName = !string.IsNullOrWhiteSpace(dto.ApplicantName) ? dto.ApplicantName : draft.ApplicantName;
            draft.Branch = !string.IsNullOrWhiteSpace(branch) ? branch : draft.Branch;
            draft.AcademicYear = !string.IsNullOrWhiteSpace(academicYear) ? academicYear : draft.AcademicYear;
            draft.CurrentStep = dto.CurrentStep > 0 ? dto.CurrentStep : draft.CurrentStep;
            draft.FormData = rawFormDataJson;
            draft.Status = "Draft";
            draft.UpdatedAt = DateTime.UtcNow;
            _context.ApplicationDrafts.Update(draft);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Draft application saved successfully.",
            data = MapToResponseDto(draft)
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteDraft(int id)
    {
        var draft = await _context.ApplicationDrafts.FindAsync(id);
        if (draft == null)
        {
            return NotFound(new { success = false, message = "Draft not found." });
        }

        _context.ApplicationDrafts.Remove(draft);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Draft discarded successfully." });
    }

    [HttpDelete("active")]
    public async Task<IActionResult> DeleteActiveDraft(
        [FromQuery] string formType,
        [FromQuery] string? draftKey = null)
    {
        if (string.IsNullOrWhiteSpace(formType))
        {
            return BadRequest(new { success = false, message = "FormType is required." });
        }

        var userId = GetCurrentUserId();
        var query = _context.ApplicationDrafts
            .Where(d => d.FormType == formType && (d.UserId == userId || string.IsNullOrEmpty(d.UserId)));

        if (!string.IsNullOrWhiteSpace(draftKey))
        {
            query = query.Where(d => d.DraftKey == draftKey);
        }

        var drafts = await query.ToListAsync();
        if (drafts.Any())
        {
            _context.ApplicationDrafts.RemoveRange(drafts);
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Active draft(s) removed successfully." });
    }

    [HttpPost("{id:int}/complete")]
    public async Task<IActionResult> CompleteDraft(int id)
    {
        var draft = await _context.ApplicationDrafts.FindAsync(id);
        if (draft != null)
        {
            _context.ApplicationDrafts.Remove(draft); // Clean up submitted drafts
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Draft application completed." });
    }
}
