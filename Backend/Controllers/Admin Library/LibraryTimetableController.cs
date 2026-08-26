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
[Route("api/library-timetable")]
[Route("api/library/timetable")]
[AllowAnonymous]
[Tags("Library Timetable Management")]
public class LibraryTimetableController : ControllerBase
{
    private readonly AppDbContext _context;

    public LibraryTimetableController(AppDbContext context)
    {
        _context = context;
    }

    private bool IsAdminUser()
    {
        string? role = User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                       ?? User?.FindFirst("role")?.Value
                       ?? Request.Headers["X-User-Role"].FirstOrDefault()
                       ?? Request.Headers["User-Role"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(role)) return false;

        return role.Equals("Admin", StringComparison.OrdinalIgnoreCase) || 
               role.Equals("Administrator", StringComparison.OrdinalIgnoreCase) || 
               role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase);
    }

    private IActionResult? CheckAdminReadOnly()
    {
        if (IsAdminUser())
        {
            return StatusCode(403, new
            {
                success = false,
                message = "Administrator is in Read-Only Mode (View Purpose Only). Only Librarians can modify library timetable slots."
            });
        }
        return null;
    }

    [HttpGet]
    public async Task<IActionResult> GetLibraryTimetable(
        [FromQuery] string? day = "Tuesday",
        [FromQuery] string? view = "daily")
    {
        string currentDay = string.IsNullOrWhiteSpace(day) ? "Tuesday" : day.Trim();

        var dbSlots = await _context.LibraryTimetableSlots.AsNoTracking()
            .Where(s => s.DayOfWeek.ToLower() == currentDay.ToLower())
            .OrderBy(s => s.PeriodNumber)
            .ToListAsync();

        var defaultPeriods = new List<object>
        {
            new { slotId = 1, periodNumber = 1, periodName = "PERIOD 1", timeRange = "08:30 AM - 09:15 AM", startTime = "08:30 AM", endTime = "09:15 AM", subject = "Library Free / Maintenance", displayStatus = "No class scheduled", isFreeSlot = true },
            new { slotId = 2, periodNumber = 2, periodName = "PERIOD 2", timeRange = "09:15 AM - 10:00 AM", startTime = "09:15 AM", endTime = "10:00 AM", subject = "Library Free / Maintenance", displayStatus = "No class scheduled", isFreeSlot = true },
            new { slotId = 3, periodNumber = 3, periodName = "PERIOD 3", timeRange = "10:15 AM - 11:00 AM", startTime = "10:15 AM", endTime = "11:00 AM", subject = "Library Free / Maintenance", displayStatus = "No class scheduled", isFreeSlot = true },
            new { slotId = 4, periodNumber = 4, periodName = "PERIOD 4", timeRange = "11:00 AM - 11:45 AM", startTime = "11:00 AM", endTime = "11:45 AM", subject = "Library Free / Maintenance", displayStatus = "No class scheduled", isFreeSlot = true },
            new { slotId = 5, periodNumber = 5, periodName = "PERIOD 5", timeRange = "11:45 AM - 12:30 PM", startTime = "11:45 AM", endTime = "12:30 PM", subject = "Library Free / Maintenance", displayStatus = "No class scheduled", isFreeSlot = true },
            new { slotId = 6, periodNumber = 6, periodName = "PERIOD 6", timeRange = "01:15 PM - 02:00 PM", startTime = "01:15 PM", endTime = "02:00 PM", subject = "Library Free / Maintenance", displayStatus = "No class scheduled", isFreeSlot = true },
            new { slotId = 7, periodNumber = 7, periodName = "PERIOD 7", timeRange = "02:00 PM - 02:45 PM", startTime = "02:00 PM", endTime = "02:45 PM", subject = "Library Free / Maintenance", displayStatus = "No class scheduled", isFreeSlot = true },
            new { slotId = 8, periodNumber = 8, periodName = "PERIOD 8", timeRange = "02:45 PM - 03:30 PM", startTime = "02:45 PM", endTime = "03:30 PM", subject = "Library Free / Maintenance", displayStatus = "No class scheduled", isFreeSlot = true }
        };

        var slotsToReturn = dbSlots.Any()
            ? dbSlots.Select(s => new
            {
                slotId = s.SlotId,
                periodNumber = s.PeriodNumber,
                periodName = s.PeriodName,
                timeRange = $"{s.StartTime} - {s.EndTime}",
                startTime = s.StartTime,
                endTime = s.EndTime,
                className = s.ClassName ?? "",
                section = s.Section ?? "",
                subject = s.Subject,
                displayStatus = s.IsFreeSlot ? "No class scheduled" : $"{s.ClassName}-{s.Section}",
                isFreeSlot = s.IsFreeSlot
            }).Cast<object>().ToList()
            : defaultPeriods;

        var totalWeeklyPeriods = await _context.LibraryTimetableSlots.AsNoTracking().CountAsync(s => !s.IsFreeSlot);
        var classesCovered = await _context.LibraryTimetableSlots.AsNoTracking().Where(s => !s.IsFreeSlot && !string.IsNullOrEmpty(s.ClassName)).Select(s => s.ClassName).Distinct().CountAsync();
        var todaysSessions = dbSlots.Count(s => !s.IsFreeSlot);

        return Ok(new
        {
            success = true,
            summary = new
            {
                totalWeeklyPeriods = $"{totalWeeklyPeriods} Slots",
                classesCovered = $"{classesCovered} Batches",
                todaysSessions = $"{todaysSessions} Periods",
                librarianStaff = "2 Staff (Bhanu Prakash & Rachel Green)"
            },
            selectedDay = currentDay,
            timeRangeSummary = "8 Periods (08:30 AM - 03:30 PM)",
            totalCount = slotsToReturn.Count,
            data = slotsToReturn
        });
    }

    [HttpGet("options")]
    public IActionResult GetTimetableOptions()
    {
        var classes = new List<string> { "Nursery", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12" };
        var sections = new List<string> { "Section A", "Section B", "Section C", "Section D" };

        return Ok(new { success = true, data = new { classes, sections } });
    }

    [HttpGet("matrix")]
    public async Task<IActionResult> GetWeeklyMasterMatrix()
    {
        var dbSlots = await _context.LibraryTimetableSlots.AsNoTracking().ToListAsync();

        var periods = new List<object>
        {
            new { periodNumber = 1, periodName = "Period 1", timeRange = "08:30 AM - 09:15 AM", monday = "--", tuesday = "--", wednesday = "--", thursday = "--", friday = "--", saturday = "--" },
            new { periodNumber = 2, periodName = "Period 2", timeRange = "09:15 AM - 10:00 AM", monday = "--", tuesday = "--", wednesday = "--", thursday = "--", friday = "--", saturday = "--" },
            new { periodNumber = 3, periodName = "Period 3", timeRange = "10:15 AM - 11:00 AM", monday = "--", tuesday = "--", wednesday = "--", thursday = "--", friday = "--", saturday = "--" },
            new { periodNumber = 4, periodName = "Period 4", timeRange = "11:00 AM - 11:45 AM", monday = "--", tuesday = "--", wednesday = "--", thursday = "--", friday = "--", saturday = "--" },
            new { periodNumber = 5, periodName = "Period 5", timeRange = "11:45 AM - 12:30 PM", monday = "--", tuesday = "--", wednesday = "--", thursday = "--", friday = "--", saturday = "--" },
            new { periodNumber = 6, periodName = "Period 6", timeRange = "01:15 PM - 02:00 PM", monday = "--", tuesday = "--", wednesday = "--", thursday = "--", friday = "--", saturday = "--" },
            new { periodNumber = 7, periodName = "Period 7", timeRange = "02:00 PM - 02:45 PM", monday = "--", tuesday = "--", wednesday = "--", thursday = "--", friday = "--", saturday = "--" },
            new { periodNumber = 8, periodName = "Period 8", timeRange = "02:45 PM - 03:30 PM", monday = "--", tuesday = "--", wednesday = "--", thursday = "--", friday = "--", saturday = "--" }
        };

        return Ok(new { success = true, title = "Weekly Library Master Matrix (Monday to Saturday)", data = periods });
    }

    [HttpGet("class-schedule")]
    public async Task<IActionResult> GetClassSectionSchedule([FromQuery] string? className, [FromQuery] string? section)
    {
        if (string.IsNullOrWhiteSpace(className) || string.IsNullOrWhiteSpace(section))
        {
            return Ok(new { success = true, message = "Please Select Class & Section", data = new List<object>() });
        }

        var slots = await _context.LibraryTimetableSlots.AsNoTracking()
            .Where(s => s.ClassName != null && s.ClassName.ToLower() == className.ToLower().Trim() && s.Section != null && s.Section.ToLower() == section.ToLower().Trim())
            .ToListAsync();

        return Ok(new { success = true, className, section, totalCount = slots.Count, data = slots });
    }

    [HttpPost("sync")]
    public async Task<IActionResult> SyncAdminTimetable()
    {
        var readOnlyCheck = CheckAdminReadOnly();
        if (readOnlyCheck != null) return readOnlyCheck;

        var seededSlots = new List<LibraryTimetableSlot>
        {
            new LibraryTimetableSlot { DayOfWeek = "Monday", PeriodNumber = 1, PeriodName = "PERIOD 1", StartTime = "08:30 AM", EndTime = "09:15 AM", ClassName = "Class 5", Section = "A", Subject = "Library & Reading", AssignedLibrarian = "Bhanu Prakash", IsFreeSlot = false },
            new LibraryTimetableSlot { DayOfWeek = "Monday", PeriodNumber = 2, PeriodName = "PERIOD 2", StartTime = "09:15 AM", EndTime = "10:00 AM", ClassName = "Class 3", Section = "B", Subject = "Library Period", AssignedLibrarian = "Rachel Green", IsFreeSlot = false },
            new LibraryTimetableSlot { DayOfWeek = "Tuesday", PeriodNumber = 1, PeriodName = "PERIOD 1", StartTime = "08:30 AM", EndTime = "09:15 AM", ClassName = "Class 4", Section = "A", Subject = "Library Period", AssignedLibrarian = "Rachel Green", IsFreeSlot = false },
            new LibraryTimetableSlot { DayOfWeek = "Wednesday", PeriodNumber = 1, PeriodName = "PERIOD 1", StartTime = "08:30 AM", EndTime = "09:15 AM", ClassName = "Class 7", Section = "B", Subject = "Library Period", AssignedLibrarian = "Bhanu Prakash", IsFreeSlot = false },
            new LibraryTimetableSlot { DayOfWeek = "Wednesday", PeriodNumber = 2, PeriodName = "PERIOD 2", StartTime = "09:15 AM", EndTime = "10:00 AM", ClassName = "Class 10", Section = "A", Subject = "Library & Reading", AssignedLibrarian = "Rachel Green", IsFreeSlot = false },
            new LibraryTimetableSlot { DayOfWeek = "Wednesday", PeriodNumber = 3, PeriodName = "PERIOD 3", StartTime = "10:15 AM", EndTime = "11:00 AM", ClassName = "Class 5", Section = "A", Subject = "Library & Storytelling", AssignedLibrarian = "Bhanu Prakash", IsFreeSlot = false },
            new LibraryTimetableSlot { DayOfWeek = "Thursday", PeriodNumber = 1, PeriodName = "PERIOD 1", StartTime = "08:30 AM", EndTime = "09:15 AM", ClassName = "Class 11", Section = "B", Subject = "Library & Reference", AssignedLibrarian = "Rachel Green", IsFreeSlot = false },
            new LibraryTimetableSlot { DayOfWeek = "Friday", PeriodNumber = 1, PeriodName = "PERIOD 1", StartTime = "08:30 AM", EndTime = "09:15 AM", ClassName = "Class 9", Section = "B", Subject = "Library Period", AssignedLibrarian = "Bhanu Prakash", IsFreeSlot = false }
        };

        var existing = await _context.LibraryTimetableSlots.ToListAsync();
        _context.LibraryTimetableSlots.RemoveRange(existing);
        await _context.LibraryTimetableSlots.AddRangeAsync(seededSlots);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = $"Successfully synced {seededSlots.Count} Library Period slots from Admin Master Timetable.", totalSynced = seededSlots.Count });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTimetableSlot([FromBody] CreateLibraryTimetableSlotDto dto)
    {
        var readOnlyCheck = CheckAdminReadOnly();
        if (readOnlyCheck != null) return readOnlyCheck;

        var slot = new LibraryTimetableSlot
        {
            DayOfWeek = !string.IsNullOrWhiteSpace(dto.DayOfWeek) ? dto.DayOfWeek.Trim() : "Tuesday",
            PeriodNumber = dto.PeriodNumber > 0 ? dto.PeriodNumber : 1,
            PeriodName = !string.IsNullOrWhiteSpace(dto.PeriodName) ? dto.PeriodName.Trim() : $"PERIOD {dto.PeriodNumber}",
            StartTime = !string.IsNullOrWhiteSpace(dto.StartTime) ? dto.StartTime.Trim() : "08:30 AM",
            EndTime = !string.IsNullOrWhiteSpace(dto.EndTime) ? dto.EndTime.Trim() : "09:15 AM",
            ClassName = dto.ClassName?.Trim(),
            Section = dto.Section?.Trim(),
            Subject = !string.IsNullOrWhiteSpace(dto.Subject) ? dto.Subject.Trim() : "Library Period",
            AssignedLibrarian = !string.IsNullOrWhiteSpace(dto.AssignedLibrarian) ? dto.AssignedLibrarian.Trim() : "Bhanu Prakash",
            IsFreeSlot = dto.IsFreeSlot
        };

        await _context.LibraryTimetableSlots.AddAsync(slot);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Library timetable slot created successfully.", data = slot });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateTimetableSlot(int id, [FromBody] CreateLibraryTimetableSlotDto dto)
    {
        var readOnlyCheck = CheckAdminReadOnly();
        if (readOnlyCheck != null) return readOnlyCheck;

        var slot = await _context.LibraryTimetableSlots.FindAsync(id);
        if (slot == null) return NotFound(new { success = false, message = "Timetable slot not found." });

        if (!string.IsNullOrWhiteSpace(dto.DayOfWeek)) slot.DayOfWeek = dto.DayOfWeek.Trim();
        if (dto.PeriodNumber > 0) slot.PeriodNumber = dto.PeriodNumber;
        if (!string.IsNullOrWhiteSpace(dto.ClassName)) slot.ClassName = dto.ClassName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Section)) slot.Section = dto.Section.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Subject)) slot.Subject = dto.Subject.Trim();
        slot.IsFreeSlot = dto.IsFreeSlot;

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Library timetable slot updated successfully.", data = slot });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTimetableSlot(int id)
    {
        var readOnlyCheck = CheckAdminReadOnly();
        if (readOnlyCheck != null) return readOnlyCheck;

        var slot = await _context.LibraryTimetableSlots.FindAsync(id);
        if (slot != null)
        {
            _context.LibraryTimetableSlots.Remove(slot);
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Library timetable slot removed." });
    }
}
