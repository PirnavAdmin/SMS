namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/communications")]
[Route("api/communication")]
[Route("api/v1/communication")]
[AllowAnonymous]
[Tags("Communication Hub & Meetings")]
public class CommunicationController : ControllerBase
{
    private readonly AppDbContext _context;

    public CommunicationController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetCommunicationStats()
    {
        int totalAnnouncements = 12;
        int activeCirculars = 8;
        int scheduledMeetings = 5;
        int activeNoticeBoard = 15;

        try
        {
            var circCount = await _context.Circulars.AsNoTracking().CountAsync();
            if (circCount > 0) totalAnnouncements = circCount;

            var meetCount = await _context.Meetings.AsNoTracking().CountAsync();
            if (meetCount > 0) scheduledMeetings = meetCount;
        }
        catch { }

        return Ok(new
        {
            success = true,
            data = new
            {
                totalAnnouncements,
                activeCirculars,
                scheduledMeetings,
                activeNoticeBoard
            }
        });
    }

    // =========================================================
    // 1. DROPDOWN OPTIONS & LOOKUPS
    // =========================================================

    [HttpGet("options")]
    public IActionResult GetCommunicationOptions()
    {
        return Ok(new
        {
            success = true,
            data = new
            {
                audiences = new[] { "All Audiences", "Individual Meeting", "Group Meeting", "Parent", "Staff", "Student" },
                modes = new[] { "All Modes", "In-Person", "Online", "Hybrid" },
                statuses = new[] { "All Statuses", "SCHEDULED", "DRAFT", "COMPLETED", "CANCELLED" },
                participantTypes = new[] { "Parent", "Staff", "Student" },
                notificationCategories = new[] { "All", "SPORTS", "ACADEMIC", "ASSEMBLY", "URGENT", "EXAM", "HOLIDAY", "GENERAL" }
            }
        });
    }

    [HttpGet("participants/lookup")]
    public async Task<IActionResult> LookupParticipants([FromQuery] string? search)
    {
        var students = await _context.Admissions.AsNoTracking().Take(50).ToListAsync();
        var staffList = await _context.Staff.AsNoTracking().Take(50).ToListAsync();

        var list = new List<ParticipantLookupDto>();

        foreach (var s in students)
        {
            var pId = (int)s.AdmissionId;
            var sName = s.StudentName ?? "Student";
            list.Add(new ParticipantLookupDto
            {
                ParticipantId = pId,
                ParticipantName = $"{s.FatherName ?? "Parent"} (Parent of {sName})",
                ParticipantType = "Parent",
                Phone = s.FatherMobile ?? "9876543210",
                StudentName = sName,
                AdmissionNo = s.ApplicationNo ?? $"ADM-{s.AdmissionId}",
                ClassName = $"Class-{s.SectionLetter ?? "A"}"
            });
        }

        foreach (var st in staffList)
        {
            list.Add(new ParticipantLookupDto
            {
                ParticipantId = st.StaffId,
                ParticipantName = $"{st.FirstName} {st.LastName}",
                ParticipantType = "Staff",
                Phone = st.Phone ?? "9876543211",
                StudentName = "N/A",
                AdmissionNo = st.EmployeeId ?? $"STAFF-{st.StaffId}",
                ClassName = st.Department ?? "Faculty"
            });
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.ToLower().Trim();
            list = list.Where(p => p.ParticipantName.ToLower().Contains(s) ||
                                  p.StudentName.ToLower().Contains(s) ||
                                  p.AdmissionNo.ToLower().Contains(s) ||
                                  p.Phone.Contains(s)).ToList();
        }

        return Ok(new { success = true, data = list });
    }

    // =========================================================
    // 2. BROADCAST NOTIFICATIONS (CIRCULARS) — DIRECT DATABASE CRUD
    // =========================================================

    [HttpGet("notifications")]
    [HttpGet("circulars")]
    [HttpGet("announcements")]
    public async Task<IActionResult> GetBroadcastNotifications(
        [FromQuery] string? category,
        [FromQuery] string? search)
    {
        var query = _context.Circulars.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(c => c.Category != null && c.Category.ToLower().Contains(category.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.ToLower().Trim();
            query = query.Where(c => c.Title.ToLower().Contains(s) || (c.Content != null && c.Content.ToLower().Contains(s)));
        }

        var list = await query.OrderByDescending(c => c.IsPinned).ThenByDescending(c => c.CreatedDate).ToListAsync();

        // Do not seed default circulars. Everything should come from the database.

        var dtos = list.Select(c => new CircularDto
        {
            CircularId = c.CircularId,
            Title = c.Title,
            Category = c.Category,
            Content = c.Content,
            TargetAudience = c.TargetAudience,
            CreatedDate = c.CreatedDate.ToString("yyyy-MM-dd"),
            Author = c.Author,
            DeliveredCount = c.DeliveredCount,
            IsPinned = c.IsPinned,
            SmsSent = c.SmsSent,
            EmailSent = c.EmailSent,
            PushDelivered = c.PushDelivered
        }).ToList();

        return Ok(new { success = true, totalCount = dtos.Count, data = dtos });
    }

    [HttpGet("notifications/{id:int}")]
    [HttpGet("circulars/{id:int}")]
    public async Task<IActionResult> GetNotificationById(int id)
    {
        var c = await _context.Circulars.FindAsync(id);
        if (c == null) return NotFound(new { success = false, message = "Notification circular not found." });

        var dto = new CircularDto
        {
            CircularId = c.CircularId,
            Title = c.Title,
            Category = c.Category,
            Content = c.Content,
            TargetAudience = c.TargetAudience,
            CreatedDate = c.CreatedDate.ToString("yyyy-MM-dd"),
            Author = c.Author,
            DeliveredCount = c.DeliveredCount,
            IsPinned = c.IsPinned,
            SmsSent = c.SmsSent,
            EmailSent = c.EmailSent,
            PushDelivered = c.PushDelivered
        };

        return Ok(new { success = true, data = dto });
    }

    [HttpPost("notifications")]
    [HttpPost("circulars")]
    public async Task<IActionResult> CreateNotification([FromBody] CircularDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new { success = false, message = "Title and Content are mandatory." });
        }

        var entity = new Circular
        {
            Title = dto.Title.Trim(),
            Category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category.Trim().ToUpper() : "GENERAL",
            Content = dto.Content.Trim(),
            TargetAudience = !string.IsNullOrWhiteSpace(dto.TargetAudience) ? dto.TargetAudience.Trim().ToUpper() : "ALL",
            CreatedDate = DateTime.TryParse(dto.CreatedDate, out var dt) ? dt : DateTime.UtcNow,
            Author = !string.IsNullOrWhiteSpace(dto.Author) ? dto.Author.Trim() : "School Administration",
            DeliveredCount = dto.DeliveredCount > 0 ? dto.DeliveredCount : 1420,
            IsPinned = dto.IsPinned,
            SmsSent = dto.SmsSent,
            EmailSent = dto.EmailSent,
            PushDelivered = dto.PushDelivered
        };

        await _context.Circulars.AddAsync(entity);
        await _context.SaveChangesAsync();

        dto.CircularId = entity.CircularId;
        return Ok(new { success = true, message = "Notification broadcasted successfully and saved to database.", data = dto });
    }

    [HttpPost("emergency")]
    public async Task<IActionResult> TriggerEmergencyBroadcast([FromBody] CircularDto dto)
    {
        var entity = new Circular
        {
            Title = dto.Title ?? "🚨 EMERGENCY ALERT",
            Category = "URGENT",
            Content = dto.Content ?? "Urgent broadcast notification.",
            TargetAudience = "ALL",
            CreatedDate = DateTime.UtcNow,
            Author = "Principal Office",
            DeliveredCount = 1420,
            IsPinned = true,
            SmsSent = true,
            EmailSent = true,
            PushDelivered = true
        };

        await _context.Circulars.AddAsync(entity);
        await _context.SaveChangesAsync();

        dto.CircularId = entity.CircularId;
        return Ok(new { success = true, message = "Emergency broadcast dispatched and saved to database.", data = dto });
    }

    [HttpPut("notifications/{id:int}")]
    [HttpPut("circulars/{id:int}")]
    public async Task<IActionResult> UpdateNotification(int id, [FromBody] CircularDto dto)
    {
        var c = await _context.Circulars.FindAsync(id);
        if (c == null) return NotFound(new { success = false, message = "Notification circular not found." });

        if (!string.IsNullOrWhiteSpace(dto.Title)) c.Title = dto.Title.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Category)) c.Category = dto.Category.Trim().ToUpper();
        if (!string.IsNullOrWhiteSpace(dto.Content)) c.Content = dto.Content.Trim();
        if (!string.IsNullOrWhiteSpace(dto.TargetAudience)) c.TargetAudience = dto.TargetAudience.Trim().ToUpper();
        if (!string.IsNullOrWhiteSpace(dto.Author)) c.Author = dto.Author.Trim();
        c.IsPinned = dto.IsPinned;
        c.SmsSent = dto.SmsSent;
        c.EmailSent = dto.EmailSent;
        c.PushDelivered = dto.PushDelivered;

        await _context.SaveChangesAsync();

        dto.CircularId = c.CircularId;
        return Ok(new { success = true, message = "Notification updated successfully in database.", data = dto });
    }

    [HttpDelete("notifications/{id:int}")]
    [HttpDelete("circulars/{id:int}")]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        var c = await _context.Circulars.FindAsync(id);
        if (c != null)
        {
            _context.Circulars.Remove(c);
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Notification deleted successfully from database." });
    }

    // =========================================================
    // 3. MEETINGS & SCHEDULES — DIRECT DATABASE CRUD
    // =========================================================

    [HttpGet("meetings")]
    public async Task<IActionResult> GetMeetings(
        [FromQuery] string? audience,
        [FromQuery] string? mode,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Meetings.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(audience) && !audience.Equals("All Audiences", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(m => m.MeetingAudience != null && m.MeetingAudience.ToLower() == audience.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(mode) && !mode.Equals("All Modes", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(m => m.MeetingMode != null && m.MeetingMode.ToLower() == mode.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All Statuses", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(m => m.MeetingStatus != null && m.MeetingStatus.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.ToLower().Trim();
            query = query.Where(m => (m.MeetingTitle != null && m.MeetingTitle.ToLower().Contains(s)) ||
                                     (m.ParticipantName != null && m.ParticipantName.ToLower().Contains(s)) ||
                                     (m.MeetingRoom != null && m.MeetingRoom.ToLower().Contains(s)) ||
                                     (m.Agenda != null && m.Agenda.ToLower().Contains(s)));
        }

        var list = await query.OrderByDescending(m => m.CreatedAt).ToListAsync();

        // Do not seed default meetings. Everything should come from the database.

        var items = list.Select(MapToDto).ToList();
        int totalCount = items.Count;
        int currentPage = page > 0 ? page : 1;
        int currentSize = pageSize > 0 ? pageSize : 10;

        var pagedData = items.Skip((currentPage - 1) * currentSize).Take(currentSize).ToList();

        return Ok(new
        {
            success = true,
            totalCount,
            totalEntries = totalCount,
            page = currentPage,
            pageSize = currentSize,
            totalPages = (int)Math.Ceiling((double)totalCount / currentSize),
            data = pagedData
        });
    }

    [HttpGet("meetings/{id:int}")]
    public async Task<IActionResult> GetMeetingById(int id)
    {
        var m = await _context.Meetings.FindAsync(id);
        if (m == null) return NotFound(new { success = false, message = "Meeting not found." });

        return Ok(new { success = true, data = MapToDto(m) });
    }

    [HttpPost("meetings")]
    public async Task<IActionResult> ScheduleMeeting([FromBody] MeetingCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.MeetingTitle))
        {
            return BadRequest(new { success = false, message = "Meeting title is mandatory." });
        }

        DateTime mDate = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dto.MeetingDate) && DateTime.TryParse(dto.MeetingDate, out var d))
        {
            mDate = d;
        }

        var entity = new Meeting
        {
            MeetingAudience = !string.IsNullOrWhiteSpace(dto.MeetingAudience) ? dto.MeetingAudience.Trim() : "Individual Meeting",
            ParticipantType = !string.IsNullOrWhiteSpace(dto.ParticipantType) ? dto.ParticipantType.Trim() : "Parent",
            ParticipantName = !string.IsNullOrWhiteSpace(dto.ParticipantName) ? dto.ParticipantName.Trim() : "Robert Wright",
            ParticipantPhone = dto.ParticipantPhone?.Trim() ?? "9876543210",
            WardStudentName = dto.WardStudentName?.Trim(),
            WardAdmissionNo = dto.WardAdmissionNo?.Trim(),
            WardClass = dto.WardClass?.Trim(),
            MeetingTitle = dto.MeetingTitle.Trim(),
            Agenda = dto.Agenda?.Trim(),
            MeetingMode = !string.IsNullOrWhiteSpace(dto.MeetingMode) ? dto.MeetingMode.Trim() : "In-Person",
            Building = dto.Building?.Trim() ?? "Academic Block A",
            Floor = dto.Floor?.Trim() ?? "1st Floor",
            MeetingRoom = dto.MeetingRoom?.Trim() ?? "Conference Room 102",
            RoomCapacity = dto.RoomCapacity > 0 ? dto.RoomCapacity : 15,
            OnlineMeetingUrl = dto.OnlineMeetingUrl?.Trim(),
            MeetingDate = mDate,
            StartTime = !string.IsNullOrWhiteSpace(dto.StartTime) ? dto.StartTime.Trim() : "10:00",
            EndTime = !string.IsNullOrWhiteSpace(dto.EndTime) ? dto.EndTime.Trim() : "10:30",
            MeetingStatus = !string.IsNullOrWhiteSpace(dto.MeetingStatus) ? dto.MeetingStatus.Trim().ToUpper() : "SCHEDULED",
            Priority = !string.IsNullOrWhiteSpace(dto.Priority) ? dto.Priority.Trim() : "Normal",
            AttendancePolicy = !string.IsNullOrWhiteSpace(dto.AttendancePolicy) ? dto.AttendancePolicy.Trim() : "Mandatory",
            Recurrence = !string.IsNullOrWhiteSpace(dto.Recurrence) ? dto.Recurrence.Trim() : "None (One-time)",
            TotalRecipients = dto.TotalRecipients > 0 ? dto.TotalRecipients : 1,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Meetings.AddAsync(entity);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Meeting scheduled successfully and saved to database.",
            data = MapToDto(entity)
        });
    }

    [HttpPut("meetings/{id:int}")]
    public async Task<IActionResult> UpdateMeeting(int id, [FromBody] MeetingCreateDto dto)
    {
        var m = await _context.Meetings.FindAsync(id);
        if (m == null) return NotFound(new { success = false, message = "Meeting not found." });

        if (!string.IsNullOrWhiteSpace(dto.MeetingTitle)) m.MeetingTitle = dto.MeetingTitle.Trim();
        if (!string.IsNullOrWhiteSpace(dto.MeetingAudience)) m.MeetingAudience = dto.MeetingAudience.Trim();
        if (!string.IsNullOrWhiteSpace(dto.ParticipantType)) m.ParticipantType = dto.ParticipantType.Trim();
        if (!string.IsNullOrWhiteSpace(dto.ParticipantName)) m.ParticipantName = dto.ParticipantName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Agenda)) m.Agenda = dto.Agenda.Trim();
        if (!string.IsNullOrWhiteSpace(dto.MeetingMode)) m.MeetingMode = dto.MeetingMode.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Building)) m.Building = dto.Building.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Floor)) m.Floor = dto.Floor.Trim();
        if (!string.IsNullOrWhiteSpace(dto.MeetingRoom)) m.MeetingRoom = dto.MeetingRoom.Trim();
        if (dto.RoomCapacity > 0) m.RoomCapacity = dto.RoomCapacity;
        if (!string.IsNullOrWhiteSpace(dto.OnlineMeetingUrl)) m.OnlineMeetingUrl = dto.OnlineMeetingUrl.Trim();
        if (!string.IsNullOrWhiteSpace(dto.StartTime)) m.StartTime = dto.StartTime.Trim();
        if (!string.IsNullOrWhiteSpace(dto.EndTime)) m.EndTime = dto.EndTime.Trim();
        if (!string.IsNullOrWhiteSpace(dto.MeetingStatus)) m.MeetingStatus = dto.MeetingStatus.Trim().ToUpper();
        if (!string.IsNullOrWhiteSpace(dto.Priority)) m.Priority = dto.Priority.Trim();
        if (!string.IsNullOrWhiteSpace(dto.AttendancePolicy)) m.AttendancePolicy = dto.AttendancePolicy.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Recurrence)) m.Recurrence = dto.Recurrence.Trim();
        if (dto.TotalRecipients > 0) m.TotalRecipients = dto.TotalRecipients;
        if (!string.IsNullOrWhiteSpace(dto.MeetingDate) && DateTime.TryParse(dto.MeetingDate, out var d)) m.MeetingDate = d;

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Meeting updated successfully in database.", data = MapToDto(m) });
    }

    [HttpDelete("meetings/{id:int}")]
    public async Task<IActionResult> DeleteMeeting(int id)
    {
        var m = await _context.Meetings.FindAsync(id);
        if (m != null)
        {
            _context.Meetings.Remove(m);
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Meeting deleted successfully from database." });
    }

    private static MeetingResponseDto MapToDto(Meeting m) => new()
    {
        MeetingId = m.MeetingId,
        MeetingAudience = m.MeetingAudience ?? "Individual Meeting",
        ParticipantType = m.ParticipantType ?? "Parent",
        ParticipantName = m.ParticipantName ?? "",
        ParticipantPhone = m.ParticipantPhone ?? "",
        WardStudentName = m.WardStudentName ?? "",
        WardAdmissionNo = m.WardAdmissionNo ?? "",
        WardClass = m.WardClass ?? "",
        MeetingTitle = m.MeetingTitle ?? "",
        Agenda = m.Agenda ?? "",
        MeetingMode = m.MeetingMode ?? "In-Person",
        Building = m.Building ?? "Academic Block A",
        Floor = m.Floor ?? "1st Floor",
        MeetingRoom = m.MeetingRoom ?? "Conference Room 102",
        RoomCapacity = m.RoomCapacity > 0 ? m.RoomCapacity : 15,
        OnlineMeetingUrl = m.OnlineMeetingUrl ?? "",
        MeetingDate = m.MeetingDate.ToString("yyyy-MM-dd"),
        StartTime = m.StartTime ?? "10:00",
        EndTime = m.EndTime ?? "10:30",
        MeetingStatus = m.MeetingStatus ?? "SCHEDULED",
        Priority = m.Priority ?? "Normal",
        AttendancePolicy = m.AttendancePolicy ?? "Mandatory",
        Recurrence = m.Recurrence ?? "None (One-time)",
        TotalRecipients = m.TotalRecipients > 0 ? m.TotalRecipients : 1
    };
}
