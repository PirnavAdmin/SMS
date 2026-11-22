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
[Authorize]
[Route("api/staff-letters")]
public class StaffLettersController : ControllerBase
{
    private readonly AppDbContext _context;
    private static bool _tablesCreated = false;
    private static readonly object _lock = new();

    public StaffLettersController(AppDbContext context)
    {
        _context = context;
    }

    private async Task EnsureTablesExistAsync()
    {
        if (_tablesCreated) return;

        try
        {
            var createStaffLettersSql = @"
                CREATE TABLE IF NOT EXISTS `staff_letters` (
                    `Id` VARCHAR(100) NOT NULL,
                    `LetterNumber` VARCHAR(100) NOT NULL,
                    `LetterType` VARCHAR(50) NOT NULL,
                    `StaffId` VARCHAR(50) NULL,
                    `StaffEmpId` VARCHAR(50) NULL,
                    `StaffName` VARCHAR(200) NOT NULL,
                    `Designation` VARCHAR(150) NULL,
                    `Department` VARCHAR(150) NULL,
                    `Branch` VARCHAR(150) NULL,
                    `IssueDate` VARCHAR(50) NULL,
                    `GeneratedBy` VARCHAR(150) NULL,
                    `Status` VARCHAR(50) NULL,
                    `PayloadJson` LONGTEXT NULL,
                    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    PRIMARY KEY (`Id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

            var createGlobalSettingsSql = @"
                CREATE TABLE IF NOT EXISTS `global_letter_settings` (
                    `Id` INT NOT NULL,
                    `SignatoryName` VARCHAR(200) NULL,
                    `SignatoryTitle` VARCHAR(200) NULL,
                    `ProbationMonths` INT NOT NULL DEFAULT 0,
                    `NoticePeriodDays` INT NOT NULL DEFAULT 0,
                    `SignatureImageUrl` LONGTEXT NULL,
                    `SealImageUrl` LONGTEXT NULL,
                    `MasterTermsJson` LONGTEXT NULL,
                    `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    PRIMARY KEY (`Id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

            var createRequestsSql = @"
                CREATE TABLE IF NOT EXISTS `staff_letter_requests` (
                    `Id` VARCHAR(100) NOT NULL,
                    `RequestType` VARCHAR(50) NOT NULL,
                    `StaffId` VARCHAR(50) NULL,
                    `StaffEmpId` VARCHAR(50) NULL,
                    `StaffName` VARCHAR(200) NOT NULL,
                    `Designation` VARCHAR(150) NULL,
                    `Department` VARCHAR(150) NULL,
                    `Branch` VARCHAR(150) NULL,
                    `Reason` TEXT NULL,
                    `RelievingDate` VARCHAR(50) NULL,
                    `Comments` TEXT NULL,
                    `Status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
                    `RejectionReason` TEXT NULL,
                    `GeneratedLetterId` VARCHAR(100) NULL,
                    `CreatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    PRIMARY KEY (`Id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

            await _context.Database.ExecuteSqlRawAsync(createStaffLettersSql);
            await _context.Database.ExecuteSqlRawAsync(createGlobalSettingsSql);
            await _context.Database.ExecuteSqlRawAsync(createRequestsSql);

            lock (_lock)
            {
                _tablesCreated = true;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[StaffLettersController] Warning ensuring tables: {ex.Message}");
        }
    }

    // GET: api/staff-letters
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAllLetters()
    {
        try
        {
            await EnsureTablesExistAsync();

            var letters = await _context.StaffLetters
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            var dtos = new List<StaffLetterRecordDto>();
            foreach (var l in letters)
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

                payloadObj = await EnsureSalaryBreakdownInPayloadAsync(l.LetterType, l.StaffId, l.StaffEmpId, l.Designation, payloadObj, l);

                dtos.Add(new StaffLetterRecordDto
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
                });
            }

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
    [Authorize]
    public async Task<IActionResult> GetLetterById(string id)
    {
        try
        {
            await EnsureTablesExistAsync();

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

            payloadObj = await EnsureSalaryBreakdownInPayloadAsync(letter.LetterType, letter.StaffId, letter.StaffEmpId, letter.Designation, payloadObj, letter);

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
    [Authorize]
    public async Task<IActionResult> CreateOrSaveLetter([FromBody] CreateStaffLetterDto dto)
    {
        if (dto == null) return BadRequest("Invalid letter payload.");

        try
        {
            await EnsureTablesExistAsync();

            var letterId = string.IsNullOrWhiteSpace(dto.Id)
                ? $"LTR-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{new Random().Next(1000, 9999)}-{dto.StaffId ?? "01"}"
                : dto.Id;

            var existing = await _context.StaffLetters.FirstOrDefaultAsync(l => l.Id == letterId);

            string payloadJson = "";
            if (dto.Payload != null)
            {
                var enriched = await EnsureSalaryBreakdownInPayloadAsync(dto.LetterType, dto.StaffId, dto.StaffEmpId, dto.Designation, dto.Payload);
                payloadJson = JsonSerializer.Serialize(enriched ?? dto.Payload);
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

            // Auto-approve and link any matching pending staff letter request
            var letterTypeNormalized = (dto.LetterType ?? "").Trim().ToLower();
            if (letterTypeNormalized == "relieving" || letterTypeNormalized == "experience")
            {
                var sId = (dto.StaffId ?? "").Trim().ToLower();
                var empId = (dto.StaffEmpId ?? "").Trim().ToLower();
                var pendingReq = await _context.StaffLetterRequests
                    .Where(r => r.RequestType.ToLower() == letterTypeNormalized &&
                                r.Status == "Pending" &&
                                ((!string.IsNullOrEmpty(sId) && r.StaffId.ToLower() == sId) ||
                                 (!string.IsNullOrEmpty(empId) && r.StaffEmpId.ToLower() == empId)))
                    .OrderByDescending(r => r.CreatedAt)
                    .FirstOrDefaultAsync();

                if (pendingReq != null)
                {
                    pendingReq.Status = "Approved";
                    pendingReq.GeneratedLetterId = letterId;
                    pendingReq.UpdatedAt = DateTime.UtcNow;
                }
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
    [Authorize]
    public async Task<IActionResult> UpdateLetter(string id, [FromBody] CreateStaffLetterDto dto)
    {
        if (dto == null) return BadRequest("Invalid letter payload.");

        try
        {
            await EnsureTablesExistAsync();

            var letter = await _context.StaffLetters.FirstOrDefaultAsync(l => l.Id == id);
            if (letter == null)
            {
                return NotFound(new { success = false, message = "Letter record not found." });
            }

            if (dto.Payload != null)
            {
                var enriched = await EnsureSalaryBreakdownInPayloadAsync(dto.LetterType ?? letter.LetterType, dto.StaffId ?? letter.StaffId, dto.StaffEmpId ?? letter.StaffEmpId, dto.Designation ?? letter.Designation, dto.Payload);
                letter.PayloadJson = JsonSerializer.Serialize(enriched ?? dto.Payload);
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
    [Authorize]
    public async Task<IActionResult> DeleteLetter(string id)
    {
        try
        {
            await EnsureTablesExistAsync();

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
    [Authorize]
    public async Task<IActionResult> GetGlobalSettings()
    {
        try
        {
            await EnsureTablesExistAsync();

            var settings = await _context.GlobalLetterSettings.FirstOrDefaultAsync(s => s.Id == 1);
            if (settings == null)
            {
                return Ok(new
                {
                    success = true,
                    data = new GlobalLetterSettingsDto
                    {
                        SignatoryName = string.Empty,
                        SignatoryTitle = "Principal & Authorized Signatory",
                        ProbationMonths = 6,
                        NoticePeriodDays = 30,
                        SignatureImageUrl = null,
                        SealImageUrl = null,
                        MasterTerms = new List<string>()
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

            var signatoryName = settings.SignatoryName ?? string.Empty;
            if (signatoryName.Trim().Equals("Dr. Eleanor Vance", StringComparison.OrdinalIgnoreCase) ||
                signatoryName.Trim().Equals("Eleanor Vance", StringComparison.OrdinalIgnoreCase))
            {
                signatoryName = string.Empty;
            }

            return Ok(new
            {
                success = true,
                data = new GlobalLetterSettingsDto
                {
                    SignatoryName = signatoryName,
                    SignatoryTitle = !string.IsNullOrWhiteSpace(settings.SignatoryTitle) ? settings.SignatoryTitle : "Principal & Authorized Signatory",
                    ProbationMonths = settings.ProbationMonths > 0 ? settings.ProbationMonths : 6,
                    NoticePeriodDays = settings.NoticePeriodDays > 0 ? settings.NoticePeriodDays : 30,
                    SignatureImageUrl = settings.SignatureImageUrl,
                    SealImageUrl = settings.SealImageUrl,
                    MasterTerms = termsList ?? new List<string>()
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
    [Authorize]
    public async Task<IActionResult> SaveGlobalSettings([FromBody] GlobalLetterSettingsDto dto)
    {
        if (dto == null) return BadRequest("Invalid settings payload.");

        try
        {
            await EnsureTablesExistAsync();

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
                    SignatoryName = dto.SignatoryName?.Trim() ?? string.Empty,
                    SignatoryTitle = dto.SignatoryTitle?.Trim() ?? string.Empty,
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
                settings.SignatoryName = dto.SignatoryName?.Trim() ?? string.Empty;
                settings.SignatoryTitle = dto.SignatoryTitle?.Trim() ?? string.Empty;
                settings.ProbationMonths = dto.ProbationMonths;
                settings.NoticePeriodDays = dto.NoticePeriodDays;
                settings.SignatureImageUrl = dto.SignatureImageUrl;
                settings.SealImageUrl = dto.SealImageUrl;
                settings.MasterTermsJson = masterTermsJson;
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

    // ==========================================
    // STAFF LETTER REQUESTS (RELIEVING / EXPERIENCE)
    // ==========================================

    // GET: api/staff-letters/requests
    [HttpGet("requests")]
    [Authorize]
    public async Task<IActionResult> GetStaffLetterRequests(
        [FromQuery] string? staffId,
        [FromQuery] string? status,
        [FromQuery] string? requestType)
    {
        try
        {
            await EnsureTablesExistAsync();

            var query = _context.StaffLetterRequests.AsQueryable();

            if (!string.IsNullOrWhiteSpace(staffId))
            {
                var sId = staffId.Trim().ToLower();
                query = query.Where(r => r.StaffId.ToLower() == sId || r.StaffEmpId.ToLower() == sId);
            }

            if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
            {
                var st = status.Trim().ToLower();
                query = query.Where(r => r.Status.ToLower() == st);
            }

            if (!string.IsNullOrWhiteSpace(requestType) && requestType.ToLower() != "all")
            {
                var rt = requestType.Trim().ToLower();
                query = query.Where(r => r.RequestType.ToLower() == rt);
            }

            var list = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new StaffLetterRequestDto
                {
                    Id = r.Id,
                    RequestType = r.RequestType,
                    StaffId = r.StaffId,
                    StaffEmpId = r.StaffEmpId,
                    StaffName = r.StaffName,
                    Designation = r.Designation,
                    Department = r.Department,
                    Branch = r.Branch,
                    Reason = r.Reason,
                    RelievingDate = r.RelievingDate,
                    Comments = r.Comments,
                    Status = r.Status,
                    RejectionReason = r.RejectionReason,
                    GeneratedLetterId = r.GeneratedLetterId,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = list
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to fetch staff letter requests: " + ex.Message });
        }
    }

    // GET: api/staff-letters/requests/pending-count
    [HttpGet("requests/pending-count")]
    [Authorize]
    public async Task<IActionResult> GetPendingRequestsCount()
    {
        try
        {
            await EnsureTablesExistAsync();

            var count = await _context.StaffLetterRequests
                .Where(r => r.Status == "Pending")
                .CountAsync();

            return Ok(new
            {
                success = true,
                count = count
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // POST: api/staff-letters/requests
    [HttpPost("requests")]
    [Authorize]
    public async Task<IActionResult> CreateStaffLetterRequest([FromBody] CreateStaffLetterRequestDto dto)
    {
        if (dto == null) return BadRequest("Invalid request payload.");

        try
        {
            await EnsureTablesExistAsync();

            var prefix = (dto.RequestType ?? "relieving").ToLower() == "experience" ? "REQ-EXP" : "REQ-REL";
            var requestId = string.IsNullOrWhiteSpace(dto.Id)
                ? $"{prefix}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{new Random().Next(100, 999)}"
                : dto.Id;

            var newRequest = new StaffLetterRequest
            {
                Id = requestId,
                RequestType = dto.RequestType?.Trim().ToLower() ?? "relieving",
                StaffId = dto.StaffId?.Trim() ?? "",
                StaffEmpId = dto.StaffEmpId?.Trim() ?? "",
                StaffName = dto.StaffName?.Trim() ?? "",
                Designation = dto.Designation?.Trim() ?? "",
                Department = dto.Department?.Trim() ?? "",
                Branch = dto.Branch?.Trim() ?? "",
                Reason = dto.Reason?.Trim() ?? "",
                RelievingDate = dto.RelievingDate?.Trim() ?? "",
                Comments = dto.Comments?.Trim() ?? "",
                Status = "Pending",
                RejectionReason = "",
                GeneratedLetterId = "",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.StaffLetterRequests.Add(newRequest);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Request submitted successfully. HR/Admin has been notified.",
                data = new StaffLetterRequestDto
                {
                    Id = newRequest.Id,
                    RequestType = newRequest.RequestType,
                    StaffId = newRequest.StaffId,
                    StaffEmpId = newRequest.StaffEmpId,
                    StaffName = newRequest.StaffName,
                    Designation = newRequest.Designation,
                    Department = newRequest.Department,
                    Branch = newRequest.Branch,
                    Reason = newRequest.Reason,
                    RelievingDate = newRequest.RelievingDate,
                    Comments = newRequest.Comments,
                    Status = newRequest.Status,
                    RejectionReason = newRequest.RejectionReason,
                    GeneratedLetterId = newRequest.GeneratedLetterId,
                    CreatedAt = newRequest.CreatedAt,
                    UpdatedAt = newRequest.UpdatedAt
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to submit request: " + ex.Message });
        }
    }

    // PUT: api/staff-letters/requests/{id}/status
    [HttpPut("requests/{id}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateRequestStatus(string id, [FromBody] UpdateStaffLetterRequestStatusDto dto)
    {
        if (dto == null) return BadRequest("Invalid status payload.");

        try
        {
            await EnsureTablesExistAsync();

            var req = await _context.StaffLetterRequests.FirstOrDefaultAsync(r => r.Id == id);
            if (req == null)
            {
                return NotFound(new { success = false, message = "Staff letter request not found." });
            }

            req.Status = dto.Status ?? req.Status;
            if (!string.IsNullOrWhiteSpace(dto.RejectionReason))
            {
                req.RejectionReason = dto.RejectionReason;
            }
            if (!string.IsNullOrWhiteSpace(dto.GeneratedLetterId))
            {
                req.GeneratedLetterId = dto.GeneratedLetterId;
            }
            req.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Request status updated to '{req.Status}'.",
                data = req
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // DELETE: api/staff-letters/requests/{id}
    [HttpDelete("requests/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteStaffLetterRequest(string id)
    {
        try
        {
            await EnsureTablesExistAsync();

            var req = await _context.StaffLetterRequests.FirstOrDefaultAsync(r => r.Id == id);
            if (req == null)
            {
                return NotFound(new { success = false, message = "Request not found." });
            }

            _context.StaffLetterRequests.Remove(req);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Request removed successfully."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    private async Task<object?> EnsureSalaryBreakdownInPayloadAsync(
        string? letterType, 
        string? staffId, 
        string? staffEmpId, 
        string? designation, 
        object? payloadObj, 
        StaffLetter? letterToUpdate = null)
    {
        if (letterType?.Trim().ToLower() != "offer" || payloadObj == null) return payloadObj;

        try
        {
            var json = JsonSerializer.Serialize(payloadObj);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            decimal currentGrossInPayload = 0;
            if (root.TryGetProperty("salaryBreakdown", out var sb) && sb.ValueKind == JsonValueKind.Object)
            {
                if (sb.TryGetProperty("grossMonthly", out var gm))
                {
                    currentGrossInPayload = gm.GetDecimal();
                }
            }

            // Find staff
            Staff? staff = null;
            if (!string.IsNullOrEmpty(staffEmpId))
            {
                staff = await _context.Staff.FirstOrDefaultAsync(s => s.EmployeeId == staffEmpId);
            }
            if (staff == null && !string.IsNullOrEmpty(staffId))
            {
                staff = await _context.Staff.FirstOrDefaultAsync(s => s.StaffId.ToString() == staffId || s.EmployeeId == staffId);
            }

            // Find salary structure strictly through MANUAL assignment to this specific staff member
            SalaryStructure? structure = null;
            if (staff?.SalaryStructureId != null)
            {
                structure = await _context.SalaryStructures
                    .Include(s => s.Items)
                    .FirstOrDefaultAsync(s => s.StructureId == staff.SalaryStructureId);
            }

            if (structure == null && staff != null)
            {
                var assignment = await _context.EmployeeSalaryAssignments
                    .Where(a => a.StaffId == staff.StaffId && a.Status == "Active")
                    .OrderByDescending(a => a.AssignmentId)
                    .FirstOrDefaultAsync();

                if (assignment != null)
                {
                    structure = await _context.SalaryStructures
                        .Include(s => s.Items)
                        .FirstOrDefaultAsync(s => s.StructureId == assignment.StructureId);
                }
            }

            // If staff has no manually assigned salary structure:
            if (structure == null)
            {
                // If staff has no assigned structure but payload had an auto-assigned breakdown (e.g. from role inheritance), reset it to 0
                if (currentGrossInPayload > 0)
                {
                    var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(json) ?? new Dictionary<string, object>();
                    dict["salaryBreakdown"] = new
                    {
                        basic = 0.0,
                        hra = 0.0,
                        transportAllowance = 0.0,
                        specialAllowance = 0.0,
                        grossMonthly = 0.0,
                        annualCtc = 0.0
                    };

                    if (letterToUpdate != null)
                    {
                        letterToUpdate.PayloadJson = JsonSerializer.Serialize(dict);
                        await _context.SaveChangesAsync();
                    }

                    return dict;
                }

                return payloadObj;
            }

            // Staff has an assigned structure: compute breakdown from structure
            decimal gross = structure.MonthlyGrossSalary;
            var items = structure.Items ?? new List<SalaryStructureItem>();
            var basicItem = items.FirstOrDefault(i => i.ComponentName.ToLower().Contains("basic"));
            var hraItem = items.FirstOrDefault(i => i.ComponentName.ToLower().Contains("hra") || i.ComponentName.ToLower().Contains("house"));
            var transportItem = items.FirstOrDefault(i => i.ComponentName.ToLower().Contains("travel") || i.ComponentName.ToLower().Contains("transport") || i.ComponentName.ToLower().Contains("conveyance"));

            decimal basic = basicItem?.Amount ?? Math.Round(gross * 0.5m);
            decimal hra = hraItem?.Amount ?? Math.Round(gross * 0.2m);
            decimal transport = transportItem?.Amount ?? Math.Round(gross * 0.1m);

            var otherItemsSum = items
                .Where(i => i.ComponentType.ToLower() == "earning" && i != basicItem && i != hraItem && i != transportItem)
                .Sum(i => i.Amount);

            decimal special = otherItemsSum > 0 ? otherItemsSum : Math.Max(0, gross - (basic + hra + transport));

            // If the payload needs to be enriched or updated with this assigned structure:
            if (gross > 0 && (currentGrossInPayload <= 0 || currentGrossInPayload != gross))
            {
                var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(json) ?? new Dictionary<string, object>();
                dict["salaryBreakdown"] = new
                {
                    basic = (double)basic,
                    hra = (double)hra,
                    transportAllowance = (double)transport,
                    specialAllowance = (double)special,
                    grossMonthly = (double)gross,
                    annualCtc = (double)(gross * 12)
                };

                if (letterToUpdate != null)
                {
                    letterToUpdate.PayloadJson = JsonSerializer.Serialize(dict);
                    await _context.SaveChangesAsync();
                }

                return dict;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[StaffLettersController] Error enriching salary breakdown: {ex.Message}");
        }

        return payloadObj;
    }
}
