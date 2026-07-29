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
[Route("api/communications")]
[Authorize(Roles = "Admin,Teacher,Staff")]
[Tags("Communications & Meeting Management")]
public class CommunicationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public CommunicationsController(AppDbContext context)
    {
        _context = context;
    }

    // Circulars
    [HttpGet("circulars")]
    public async Task<IActionResult> GetAllCirculars()
    {
        var list = await _context.Circulars.AsNoTracking().OrderByDescending(c => c.CreatedDate).ToListAsync();
        var dtos = list.Select(c => new CircularDto
        {
            CircularId = c.CircularId,
            Title = c.Title,
            Category = c.Category,
            Content = c.Content,
            TargetAudience = c.TargetAudience,
            CreatedDate = c.CreatedDate.ToString("yyyy-MM-dd"),
            SmsSent = c.SmsSent,
            EmailSent = c.EmailSent,
            PushDelivered = c.PushDelivered
        }).ToList();

        return Ok(new { success = true, data = dtos });
    }

    [HttpPost("circulars")]
    public async Task<IActionResult> CreateCircular([FromBody] CircularDto dto)
    {
        var entity = new Circular
        {
            Title = dto.Title,
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "SPORTS - ALL" : dto.Category,
            Content = dto.Content,
            TargetAudience = dto.TargetAudience,
            CreatedDate = DateTime.UtcNow,
            SmsSent = true,
            EmailSent = true,
            PushDelivered = true
        };

        await _context.Circulars.AddAsync(entity);
        await _context.SaveChangesAsync();

        dto.CircularId = entity.CircularId;
        return Ok(new { success = true, message = "Circular broadcasted successfully.", data = dto });
    }

    // Meetings
    [HttpGet("meetings")]
    public async Task<IActionResult> GetAllMeetings([FromQuery] string? audience, [FromQuery] string? mode, [FromQuery] string? status, [FromQuery] string? search)
    {
        var query = _context.Meetings.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(audience) && !audience.Equals("All Audiences", StringComparison.OrdinalIgnoreCase))
            query = query.Where(m => m.MeetingAudience.ToLower() == audience.ToLower());

        if (!string.IsNullOrWhiteSpace(mode) && !mode.Equals("All Modes", StringComparison.OrdinalIgnoreCase))
            query = query.Where(m => m.MeetingMode.ToLower() == mode.ToLower());

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All Statuses", StringComparison.OrdinalIgnoreCase))
            query = query.Where(m => m.MeetingStatus.ToLower() == status.ToLower());

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(m => m.MeetingTitle.Contains(search) || m.ParticipantName.Contains(search) || (m.MeetingRoom != null && m.MeetingRoom.Contains(search)));

        var list = await query.OrderByDescending(m => m.CreatedAt).ToListAsync();

        var result = list.Select(m => new MeetingResponseDto
        {
            MeetingId = m.MeetingId,
            MeetingAudience = m.MeetingAudience,
            ParticipantType = m.ParticipantType,
            ParticipantName = m.ParticipantName,
            ParticipantPhone = m.ParticipantPhone,
            WardStudentName = m.WardStudentName,
            WardAdmissionNo = m.WardAdmissionNo,
            WardClass = m.WardClass,
            MeetingTitle = m.MeetingTitle,
            Agenda = m.Agenda,
            MeetingMode = m.MeetingMode,
            Building = m.Building,
            Floor = m.Floor,
            MeetingRoom = m.MeetingRoom,
            RoomCapacity = m.RoomCapacity,
            MeetingDate = m.MeetingDate.ToString("yyyy-MM-dd"),
            StartTime = m.StartTime,
            EndTime = m.EndTime,
            MeetingStatus = m.MeetingStatus
        }).ToList();

        return Ok(new { success = true, data = result });
    }

    [HttpPost("meetings")]
    public async Task<IActionResult> ScheduleMeeting([FromBody] MeetingCreateDto dto)
    {
        DateTime mDate = DateTime.TryParse(dto.MeetingDate, out var d) ? d : DateTime.UtcNow;

        var entity = new Meeting
        {
            MeetingAudience = dto.MeetingAudience,
            ParticipantType = dto.ParticipantType,
            ParticipantName = dto.ParticipantName,
            ParticipantPhone = dto.ParticipantPhone ?? "9876543210",
            WardStudentName = dto.WardStudentName,
            WardAdmissionNo = dto.WardAdmissionNo,
            WardClass = dto.WardClass,
            MeetingTitle = dto.MeetingTitle,
            Agenda = dto.Agenda,
            MeetingMode = dto.MeetingMode,
            Building = dto.Building ?? "Academic Block A",
            Floor = dto.Floor ?? "1st Floor",
            MeetingRoom = dto.MeetingRoom ?? "Conference Room 102",
            RoomCapacity = dto.RoomCapacity > 0 ? dto.RoomCapacity : 15,
            MeetingDate = mDate,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            MeetingStatus = dto.MeetingStatus,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Meetings.AddAsync(entity);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Meeting scheduled successfully.", data = entity });
    }

    [HttpPut("meetings/{id:int}")]
    public async Task<IActionResult> UpdateMeetingStatus(int id, [FromBody] string status)
    {
        var meeting = await _context.Meetings.FindAsync(id);
        if (meeting == null) return NotFound(new { success = false, message = "Meeting not found." });

        meeting.MeetingStatus = status;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Meeting status updated.", data = meeting });
    }
}
