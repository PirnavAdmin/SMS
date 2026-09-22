namespace SMS.Api.Controllers;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;

[ApiController]
[Route("api/staff-letters")]
public class StaffLettersController : ControllerBase
{
    private readonly AppDbContext _context;

    public StaffLettersController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/staff-letters
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllLetters()
    {
        try
        {
            var letters = await _context.StaffLetters
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            var dtos = letters.Select(l =>
            {
                object? payloadObj = null;
                if (!string.IsNullOrWhiteSpace(l.PayloadJson))
                {
                    try
                    {
                        payloadObj = JsonSerializer.Deserialize<object>(l.PayloadJson);
                    }
                    catch { }
                }

                return new StaffLetterRecordDto
                {
                    Id = l.Id,
                    LetterNumber = l.LetterNumber,
                    LetterType = l.LetterType,
                    StaffId = l.StaffId,
                    StaffEmpId = l.StaffEmpId,
                    StaffName = l.StaffName,
                    Designation = l.Designation,
                    Department = l.Department,
                    Branch = l.Branch,
                    IssueDate = l.IssueDate,
                    GeneratedBy = l.GeneratedBy,
                    Status = l.Status,
                    Payload = payloadObj,
                    CreatedAt = l.CreatedAt
                };
            }).ToList();

            return Ok(new
            {
                success = true,
                data = dtos
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to fetch staff letters: " + ex.Message });
        }
    }

    // GET: api/staff-letters/{id}
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLetterById(string id)
    {
        try
        {
            var letter = await _context.StaffLetters
                .FirstOrDefaultAsync(l => l.Id == id || l.LetterNumber == id);

            if (letter == null)
            {
                return NotFound(new { success = false, message = "Staff letter not found." });
            }

            object? payloadObj = null;
            if (!string.IsNullOrWhiteSpace(letter.PayloadJson))
            {
                try
                {
                    payloadObj = JsonSerializer.Deserialize<object>(letter.PayloadJson);
                }
                catch { }
            }

            var dto = new StaffLetterRecordDto
            {
                Id = letter.Id,
                LetterNumber = letter.LetterNumber,
                LetterType = letter.LetterType,
                StaffId = letter.StaffId,
                StaffEmpId = letter.StaffEmpId,
                StaffName = letter.StaffName,
                Designation = letter.Designation,
                Department = letter.Department,
                Branch = letter.Branch,
                IssueDate = letter.IssueDate,
                GeneratedBy = letter.GeneratedBy,
                Status = letter.Status,
                Payload = payloadObj,
                CreatedAt = letter.CreatedAt
            };

            return Ok(new { success = true, data = dto });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // POST: api/staff-letters
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateOrSaveLetter([FromBody] CreateStaffLetterDto dto)
    {
        if (dto == null) return BadRequest("Invalid letter payload.");

        try
        {
            var letterId = string.IsNullOrWhiteSpace(dto.Id)
                ? $"LTR-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{new Random().Next(1000, 9999)}-{dto.StaffId ?? "01"}"
                : dto.Id;

            var existing = await _context.StaffLetters.FirstOrDefaultAsync(l => l.Id == letterId);

            string payloadJson = "";
            if (dto.Payload != null)
            {
                payloadJson = JsonSerializer.Serialize(dto.Payload);
            }

            if (existing != null)
            {
                existing.LetterNumber = dto.LetterNumber;
                existing.LetterType = dto.LetterType ?? existing.LetterType;
                existing.StaffId = dto.StaffId ?? existing.StaffId;
                existing.StaffEmpId = dto.StaffEmpId ?? existing.StaffEmpId;
                existing.StaffName = dto.StaffName ?? existing.StaffName;
                existing.Designation = dto.Designation ?? existing.Designation;
                existing.Department = dto.Department ?? existing.Department;
                existing.Branch = dto.Branch ?? existing.Branch;
                existing.IssueDate = dto.IssueDate ?? existing.IssueDate;
                existing.GeneratedBy = dto.GeneratedBy ?? existing.GeneratedBy;
                existing.Status = dto.Status ?? existing.Status;
                existing.PayloadJson = payloadJson;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var newLetter = new StaffLetter
                {
                    Id = letterId,
                    LetterNumber = dto.LetterNumber,
                    LetterType = dto.LetterType ?? "offer",
                    StaffId = dto.StaffId ?? "",
                    StaffEmpId = dto.StaffEmpId ?? "",
                    StaffName = dto.StaffName ?? "",
                    Designation = dto.Designation ?? "",
                    Department = dto.Department ?? "",
                    Branch = dto.Branch ?? "",
                    IssueDate = dto.IssueDate ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    GeneratedBy = dto.GeneratedBy ?? "Institutional HR Administration",
                    Status = dto.Status ?? "Issued",
                    PayloadJson = payloadJson,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.StaffLetters.Add(newLetter);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Letter record saved successfully to database.",
                data = new
                {
                    id = letterId,
                    letterNumber = dto.LetterNumber,
                    letterType = dto.LetterType,
                    staffId = dto.StaffId,
                    staffEmpId = dto.StaffEmpId,
                    staffName = dto.StaffName,
                    designation = dto.Designation,
                    department = dto.Department,
                    branch = dto.Branch,
                    issueDate = dto.IssueDate,
                    generatedBy = dto.GeneratedBy,
                    status = dto.Status,
                    payload = dto.Payload
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to save staff letter: " + ex.Message });
        }
    }

    // PUT: api/staff-letters/{id}
    [HttpPut("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateLetter(string id, [FromBody] CreateStaffLetterDto dto)
    {
        if (dto == null) return BadRequest("Invalid letter payload.");

        try
        {
            var letter = await _context.StaffLetters.FirstOrDefaultAsync(l => l.Id == id);
            if (letter == null)
            {
                return NotFound(new { success = false, message = "Letter record not found." });
            }

            if (dto.Payload != null)
            {
                letter.PayloadJson = JsonSerializer.Serialize(dto.Payload);
            }

            letter.LetterNumber = dto.LetterNumber ?? letter.LetterNumber;
            letter.LetterType = dto.LetterType ?? letter.LetterType;
            letter.StaffName = dto.StaffName ?? letter.StaffName;
            letter.Designation = dto.Designation ?? letter.Designation;
            letter.Department = dto.Department ?? letter.Department;
            letter.Branch = dto.Branch ?? letter.Branch;
            letter.IssueDate = dto.IssueDate ?? letter.IssueDate;
            letter.GeneratedBy = dto.GeneratedBy ?? letter.GeneratedBy;
            letter.Status = dto.Status ?? letter.Status;
            letter.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Letter record updated successfully.",
                data = new
                {
                    id = letter.Id,
                    letterNumber = letter.LetterNumber,
                    letterType = letter.LetterType,
                    staffId = letter.StaffId,
                    staffEmpId = letter.StaffEmpId,
                    staffName = letter.StaffName,
                    designation = letter.Designation,
                    department = letter.Department,
                    branch = letter.Branch,
                    issueDate = letter.IssueDate,
                    status = letter.Status,
                    payload = dto.Payload
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // DELETE: api/staff-letters/{id}
    [HttpDelete("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteLetter(string id)
    {
        try
        {
            var letter = await _context.StaffLetters.FirstOrDefaultAsync(l => l.Id == id);
            if (letter == null)
            {
                return NotFound(new { success = false, message = "Staff letter record not found." });
            }

            _context.StaffLetters.Remove(letter);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Staff letter record has been permanently revoked and deleted from the database."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to delete letter: " + ex.Message });
        }
    }

    // GET: api/staff-letters/settings
    [HttpGet("settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetGlobalSettings()
    {
        try
        {
            var schoolSettings = await _context.SchoolSettings.FirstOrDefaultAsync();
            var dynamicPrincipalName = schoolSettings?.PrincipalName ?? string.Empty;

            var settings = await _context.GlobalLetterSettings.FirstOrDefaultAsync(s => s.Id == 1);
            if (settings == null)
            {
                return Ok(new
                {
                    success = true,
                    data = new GlobalLetterSettingsDto
                    {
                        SignatoryName = dynamicPrincipalName,
                        SignatoryTitle = !string.IsNullOrWhiteSpace(dynamicPrincipalName) ? "Principal & Authorized Signatory" : string.Empty,
                        ProbationMonths = 6,
                        NoticePeriodDays = 30,
                        SignatureImageUrl = null,
                        SealImageUrl = null,
                        MasterTerms = null
                    }
                });
            }

            List<string>? termsList = null;
            if (!string.IsNullOrWhiteSpace(settings.MasterTermsJson))
            {
                try
                {
                    termsList = JsonSerializer.Deserialize<List<string>>(settings.MasterTermsJson);
                }
                catch { }
            }

            var effectiveSignatory = !string.IsNullOrWhiteSpace(settings.SignatoryName) 
                ? settings.SignatoryName 
                : dynamicPrincipalName;

            return Ok(new
            {
                success = true,
                data = new GlobalLetterSettingsDto
                {
                    SignatoryName = effectiveSignatory,
                    SignatoryTitle = settings.SignatoryTitle,
                    ProbationMonths = settings.ProbationMonths,
                    NoticePeriodDays = settings.NoticePeriodDays,
                    SignatureImageUrl = settings.SignatureImageUrl,
                    SealImageUrl = settings.SealImageUrl,
                    MasterTerms = termsList
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to fetch letter settings: " + ex.Message });
        }
    }

    // POST: api/staff-letters/settings
    [HttpPost("settings")]
    [HttpPut("settings")]
    [AllowAnonymous]
    public async Task<IActionResult> SaveGlobalSettings([FromBody] GlobalLetterSettingsDto dto)
    {
        if (dto == null) return BadRequest("Invalid settings payload.");

        try
        {
            var settings = await _context.GlobalLetterSettings.FirstOrDefaultAsync(s => s.Id == 1);

            string? masterTermsJson = null;
            if (dto.MasterTerms != null && dto.MasterTerms.Count > 0)
            {
                masterTermsJson = JsonSerializer.Serialize(dto.MasterTerms);
            }

            if (settings == null)
            {
                settings = new GlobalLetterSetting
                {
                    Id = 1,
                    SignatoryName = dto.SignatoryName ?? string.Empty,
                    SignatoryTitle = dto.SignatoryTitle ?? string.Empty,
                    ProbationMonths = dto.ProbationMonths,
                    NoticePeriodDays = dto.NoticePeriodDays,
                    SignatureImageUrl = dto.SignatureImageUrl,
                    SealImageUrl = dto.SealImageUrl,
                    MasterTermsJson = masterTermsJson,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.GlobalLetterSettings.Add(settings);
            }
            else
            {
                settings.SignatoryName = dto.SignatoryName ?? settings.SignatoryName;
                settings.SignatoryTitle = dto.SignatoryTitle ?? settings.SignatoryTitle;
                settings.ProbationMonths = dto.ProbationMonths;
                settings.NoticePeriodDays = dto.NoticePeriodDays;
                if (dto.SignatureImageUrl != null)
                {
                    settings.SignatureImageUrl = dto.SignatureImageUrl;
                }
                if (dto.SealImageUrl != null)
                {
                    settings.SealImageUrl = dto.SealImageUrl;
                }
                if (masterTermsJson != null)
                {
                    settings.MasterTermsJson = masterTermsJson;
                }
                settings.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Global letter templates & signatory configuration saved to database successfully.",
                data = dto
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to save settings: " + ex.Message });
        }
    }
}
