// ============================================================================
// [TEMPORARILY DISABLED] Internal AI Bridge Controller disabled for now
// ============================================================================
/*
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Services.Ai;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Interfaces.FinanceManagement;

namespace SMS.Api.Controllers;

[ApiController]
[Route("api/internal/ai")]
[AllowAnonymous]
[ApiExplorerSettings(IgnoreApi = true)]
public class InternalAiBridgeController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AiContextTokenService _tokenService;
    private readonly IFeeCollectionService _feeCollectionService;
    private readonly IHostelService _hostelService;
    private readonly IUniformService _uniformService;

    public InternalAiBridgeController(
        AppDbContext db,
        AiContextTokenService tokenService,
        IFeeCollectionService feeCollectionService,
        IHostelService hostelService,
        IUniformService uniformService)
    {
        _db = db;
        _tokenService = tokenService;
        _feeCollectionService = feeCollectionService;
        _hostelService = hostelService;
        _uniformService = uniformService;
    }

    private bool TryAuthorizeContext(out AiSecurityContextPayload? ctx, out IActionResult? errorResult)
    {
        errorResult = null;
        var token = Request.Headers["X-AI-Context"].FirstOrDefault();
        if (!AiContextTokenService.TryVerifyToken(token, _tokenService.GetHmacSecret(), 120, out ctx, out var err) || ctx == null)
        {
            errorResult = Unauthorized(new { success = false, message = err });
            return false;
        }
        return true;
    }

    private static bool IsRoleIn(AiSecurityContextPayload ctx, params string[] roles)
    {
        return roles.Any(r => r.Equals(ctx.Role, StringComparison.OrdinalIgnoreCase));
    }

    [HttpGet("ping")]
    public IActionResult Ping()
    {
        return Ok(new { status = "ok", service = "SMS.Api.InternalAiBridge", utcTime = DateTime.UtcNow });
    }

    [HttpGet("organization/summary")]
    public async Task<IActionResult> GetOrganizationSummary()
    {
        if (!TryAuthorizeContext(out var ctx, out var err) || ctx == null) return err!;

        var branchQuery = _db.Branches.AsNoTracking().Where(b => b.Status == "Active");
        if (ctx.AllowedBranchIds.Count > 0)
        {
            branchQuery = branchQuery.Where(b => ctx.AllowedBranchIds.Contains(b.BranchId));
        }

        var branches = await branchQuery
            .Select(b => new { b.BranchId, b.BranchName, b.BranchCode, b.Status })
            .ToListAsync();

        var academicYears = await _db.AcademicYears.AsNoTracking()
            .Where(y => !y.IsDeleted)
            .OrderByDescending(y => y.IsCurrent)
            .Select(y => new { y.AcademicYearId, y.AcademicYearName, y.IsCurrent, y.IsActive })
            .ToListAsync();

        return Ok(new { success = true, tenantId = ctx.TenantId, branches, academicYears });
    }

    [HttpGet("fees/summary")]
    public async Task<IActionResult> GetFeeSummary([FromQuery] string? academicYear = null)
    {
        if (!TryAuthorizeContext(out var ctx, out var err) || ctx == null) return err!;
        if (!IsRoleIn(ctx, "Super Admin", "Admin", "Principal", "Accountant"))
        {
            return StatusCode(403, new { success = false, message = $"Role '{ctx.Role}' is denied access to finance bridge." });
        }

        var branchFilter = ctx.ActiveBranchName;
        var yearFilter = academicYear ?? ctx.AcademicYearName;
        var stats = await _feeCollectionService.GetDashboardStatsAsync(branchFilter, yearFilter);
        var dues = await _feeCollectionService.GetDueFeesSummaryAsync(null, null, 0);
        return Ok(new { success = true, stats, duesSummary = dues });
    }

    [HttpGet("hostel/summary")]
    public async Task<IActionResult> GetHostelSummary()
    {
        if (!TryAuthorizeContext(out var ctx, out var err) || ctx == null) return err!;
        if (!IsRoleIn(ctx, "Super Admin", "Admin", "Principal", "Hostel Warden", "Accountant"))
        {
            return StatusCode(403, new { success = false, message = $"Role '{ctx.Role}' is denied access to hostel bridge." });
        }

        var metrics = await _hostelService.GetExecutiveDashboardMetricsAsync();
        return Ok(new { success = true, metrics });
    }

    [HttpGet("uniform/summary")]
    public async Task<IActionResult> GetUniformSummary()
    {
        if (!TryAuthorizeContext(out var ctx, out var err) || ctx == null) return err!;
        if (!IsRoleIn(ctx, "Super Admin", "Admin", "Principal", "Accountant"))
        {
            return StatusCode(403, new { success = false, message = $"Role '{ctx.Role}' is denied access to uniform bridge." });
        }

        var metrics = await _uniformService.GetDashboardMetricsAsync();
        return Ok(new { success = true, metrics });
    }

    public sealed class InternalExecuteActionRequest
    {
        public string ActionType { get; set; } = string.Empty;
        public Dictionary<string, JsonElement> Parameters { get; set; } = new();
    }

    [HttpPost("actions/execute")]
    public async Task<IActionResult> ExecuteAction([FromBody] InternalExecuteActionRequest request)
    {
        if (!TryAuthorizeContext(out var ctx, out var err) || ctx == null) return err!;

        var p = request.Parameters ?? new Dictionary<string, JsonElement>();
        static string GetStr(Dictionary<string, JsonElement> dict, string key, string fallback = "")
        {
            if (dict.TryGetValue(key, out var elem) && elem.ValueKind == JsonValueKind.String)
            {
                return elem.GetString()?.Trim() ?? fallback;
            }
            if (dict.TryGetValue(key, out elem) && elem.ValueKind != JsonValueKind.Null && elem.ValueKind != JsonValueKind.Undefined)
            {
                return elem.ToString();
            }
            return fallback;
        }

        switch (request.ActionType.Trim().ToLowerInvariant())
        {
            case "create_announcement":
            {
                if (!IsRoleIn(ctx, "Super Admin", "Admin", "Principal"))
                {
                    return StatusCode(403, new { success = false, message = "Only Super Admin, Admin, or Principal may publish announcements." });
                }

                var title = GetStr(p, "title", "School Announcement");
                var content = GetStr(p, "content");
                var audience = GetStr(p, "audience", GetStr(p, "targetAudience", "ALL"));
                var category = GetStr(p, "category", "GENERAL");

                if (string.IsNullOrWhiteSpace(content))
                {
                    return BadRequest(new { success = false, message = "Announcement content cannot be empty." });
                }

                var circular = new Circular
                {
                    Title = title,
                    Content = content,
                    TargetAudience = audience.ToUpperInvariant(),
                    Category = category.ToUpperInvariant(),
                    CreatedDate = DateTime.UtcNow,
                    Author = ctx.UserName,
                    SmsSent = true,
                    EmailSent = true,
                    PushDelivered = true,
                };
                _db.Circulars.Add(circular);
                _db.AuditLogs.Add(new AuditLog
                {
                    UserId = ctx.UserId,
                    UserName = ctx.UserName,
                    UserRole = ctx.Role,
                    SchoolId = ctx.SchoolId,
                    Action = "AI_PUBLISH_CIRCULAR",
                    Details = $"AI Platform executed confirmed announcement '{title}' for audience '{audience}'.",
                    Timestamp = DateTime.UtcNow,
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "ai-bridge",
                });
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Announcement '{title}' published to '{audience}'.",
                    resultDetails = new { circularId = circular.CircularId, title = circular.Title, audience = circular.TargetAudience },
                });
            }

            case "schedule_meeting":
            {
                if (!IsRoleIn(ctx, "Super Admin", "Admin", "Principal", "Teacher"))
                {
                    return StatusCode(403, new { success = false, message = "Unauthorized role for scheduling meetings." });
                }

                var title = GetStr(p, "meetingTitle", "Parent-Teacher Meeting");
                var dateRaw = GetStr(p, "meetingDate", DateTime.UtcNow.AddDays(2).ToString("yyyy-MM-dd"));
                var timeStr = GetStr(p, "meetingTime", "10:00");
                var audience = GetStr(p, "audience", "Parent");
                var mode = GetStr(p, "mode", "In-Person");
                var agenda = GetStr(p, "agenda", "Academic and student progress discussion.");

                if (!DateTime.TryParse(dateRaw, out var parsedDate))
                {
                    parsedDate = DateTime.UtcNow.AddDays(2);
                }

                var meeting = new Meeting
                {
                    MeetingTitle = title,
                    MeetingDate = parsedDate,
                    StartTime = timeStr,
                    EndTime = timeStr,
                    ParticipantType = audience,
                    MeetingAudience = audience.Equals("Parent", StringComparison.OrdinalIgnoreCase) ? "Parent Meeting" : "Group Meeting",
                    MeetingMode = mode,
                    Agenda = agenda,
                    MeetingStatus = "SCHEDULED",
                    OrganizerName = ctx.UserName,
                    OrganizerRole = ctx.Role,
                    CreatedAt = DateTime.UtcNow,
                };
                _db.Meetings.Add(meeting);
                _db.AuditLogs.Add(new AuditLog
                {
                    UserId = ctx.UserId,
                    UserName = ctx.UserName,
                    UserRole = ctx.Role,
                    SchoolId = ctx.SchoolId,
                    Action = "AI_SCHEDULE_MEETING",
                    Details = $"AI Platform executed confirmed meeting '{title}' on {parsedDate:yyyy-MM-dd} ({mode}).",
                    Timestamp = DateTime.UtcNow,
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "ai-bridge",
                });
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Meeting '{title}' scheduled for {parsedDate:yyyy-MM-dd} ({mode}).",
                    resultDetails = new { meetingId = meeting.MeetingId, title = meeting.MeetingTitle, date = parsedDate.ToString("yyyy-MM-dd") },
                });
            }

            case "review_leave_application":
            {
                if (!IsRoleIn(ctx, "Super Admin", "Admin", "Principal", "HR"))
                {
                    return StatusCode(403, new { success = false, message = "Only HR, Principal, or Admin may review leave applications." });
                }

                var leaveIdStr = GetStr(p, "leaveApplicationId", "0");
                var decision = GetStr(p, "decision", "Approved");
                var remarks = GetStr(p, "remarks", "Processed via authorized AI action confirmation.");

                if (!int.TryParse(leaveIdStr, out var leaveId) || leaveId <= 0)
                {
                    return BadRequest(new { success = false, message = "Valid leaveApplicationId is required." });
                }

                var allowedDecisions = new[] { "Approved", "Rejected", "Send Back" };
                if (!allowedDecisions.Contains(decision, StringComparer.OrdinalIgnoreCase))
                {
                    return BadRequest(new { success = false, message = "Decision must be Approved, Rejected, or Send Back." });
                }

                var leave = await _db.LeaveApplications.FirstOrDefaultAsync(l => l.LeaveApplicationId == leaveId);
                if (leave == null)
                {
                    return NotFound(new { success = false, message = $"Leave application #{leaveId} not found." });
                }

                leave.Status = allowedDecisions.First(d => d.Equals(decision, StringComparison.OrdinalIgnoreCase));
                leave.ApproverRemarks = remarks;
                leave.ApprovedBy = ctx.UserName;

                _db.AuditLogs.Add(new AuditLog
                {
                    UserId = ctx.UserId,
                    UserName = ctx.UserName,
                    UserRole = ctx.Role,
                    SchoolId = ctx.SchoolId,
                    Action = "AI_REVIEW_LEAVE",
                    Details = $"AI Platform updated leave #{leaveId} status to {leave.Status}. Remarks: {remarks}",
                    Timestamp = DateTime.UtcNow,
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "ai-bridge",
                });
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Leave application #{leaveId} marked as {leave.Status}.",
                    resultDetails = new { leaveApplicationId = leave.LeaveApplicationId, status = leave.Status },
                });
            }

            default:
                return BadRequest(new { success = false, message = $"Unsupported AI action type: '{request.ActionType}'." });
        }
    }
}
*/
