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

    private async Task EnsureSeededTimetableAsync()
    {
        // Mock seeder removed - library timetable slots come from authentic database entries
        await Task.CompletedTask;
    }

    [HttpGet]
    public async Task<IActionResult> GetLibraryTimetable(
        [FromQuery] string? day = "Wednesday",
        [FromQuery] string? view = "daily")
    {
        await EnsureSeededTimetableAsync();
        string currentDay = string.IsNullOrWhiteSpace(day) ? "Wednesday" : day.Trim();

        var dbSlots = await _context.LibraryTimetableSlots.AsNoTracking().ToListAsync();

        var daySlots = dbSlots
            .Where(s => s.DayOfWeek.Equals(currentDay, StringComparison.OrdinalIgnoreCase))
            .OrderBy(s => s.PeriodNumber)
            .ToList();

        var slotsToReturn = daySlots.Select(s => new
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
            assignedLibrarian = s.AssignedLibrarian ?? "Bhanu Prakash",
            displayStatus = s.IsFreeSlot ? "No class scheduled" : $"{s.ClassName}-{s.Section}",
            isFreeSlot = s.IsFreeSlot
        }).ToList();

        var totalWeeklyPeriods = dbSlots.Count(s => !s.IsFreeSlot);
        var classesCovered = dbSlots.Where(s => !s.IsFreeSlot && !string.IsNullOrEmpty(s.ClassName)).Select(s => s.ClassName).Distinct().Count();
        var todaysSessions = daySlots.Count(s => !s.IsFreeSlot);

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
            data = slotsToReturn,
            allSlots = dbSlots.Select(s => new
            {
                slotId = s.SlotId,
                day = s.DayOfWeek,
                periodNumber = s.PeriodNumber,
                periodName = s.PeriodName,
                timeSlot = $"{s.StartTime} - {s.EndTime}",
                startTime = s.StartTime,
                endTime = s.EndTime,
                className = s.ClassName ?? "",
                section = s.Section ?? "",
                subject = s.Subject,
                teacherName = s.AssignedLibrarian ?? "Bhanu Prakash",
                roomNo = "Central Library",
                isFreeSlot = s.IsFreeSlot
            })
        });
    }

    [HttpGet("options")]
    public IActionResult GetTimetableOptions()
    {
        var classes = new List<string> { "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12" };
        var sections = new List<string> { "A", "B", "C", "D" };

        return Ok(new { success = true, data = new { classes, sections } });
    }

    [HttpGet("matrix")]
    public async Task<IActionResult> GetWeeklyMasterMatrix()
    {
        await EnsureSeededTimetableAsync();
        var dbSlots = await _context.LibraryTimetableSlots.AsNoTracking().ToListAsync();

        var days = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };
        var matrix = new List<object>();

        for (int p = 1; p <= 8; p++)
        {
            var pSlot = dbSlots.FirstOrDefault(s => s.PeriodNumber == p);
            string timeRange = pSlot != null ? $"{pSlot.StartTime} - {pSlot.EndTime}" : "Scheduled Period";

            var row = new Dictionary<string, object>
            {
                { "periodNumber", p },
                { "periodName", $"Period {p}" },
                { "timeRange", timeRange }
            };

            foreach (var d in days)
            {
                var slot = dbSlots.FirstOrDefault(s => s.DayOfWeek.Equals(d, StringComparison.OrdinalIgnoreCase) && s.PeriodNumber == p);
                if (slot != null && !slot.IsFreeSlot)
                {
                    row[d.ToLower()] = $"{slot.ClassName} - {slot.Section}\n{slot.Subject}";
                }
                else
                {
                    row[d.ToLower()] = "--";
                }
            }

            matrix.Add(row);
        }

        return Ok(new { success = true, title = "Weekly Library Master Matrix (Monday to Saturday)", data = matrix });
    }

    [HttpGet("class-schedule")]
    public async Task<IActionResult> GetClassSectionSchedule([FromQuery] string? className, [FromQuery] string? section)
    {
        await EnsureSeededTimetableAsync();

        if (string.IsNullOrWhiteSpace(className) || string.IsNullOrWhiteSpace(section))
        {
            return Ok(new { success = true, message = "Please Select Class & Section", data = new List<object>() });
        }

        string reqClass = className.Trim();
        string reqSec = section.Trim();

        var slots = await _context.LibraryTimetableSlots.AsNoTracking()
            .Where(s => s.ClassName != null && s.ClassName.ToLower() == reqClass.ToLower() &&
                        (reqSec.Equals("All", StringComparison.OrdinalIgnoreCase) || (s.Section != null && s.Section.ToLower() == reqSec.ToLower())))
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.PeriodNumber)
            .Select(s => new
            {
                slotId = s.SlotId,
                day = s.DayOfWeek,
                periodNumber = s.PeriodNumber,
                timeSlot = $"{s.StartTime} - {s.EndTime}",
                className = s.ClassName,
                section = s.Section,
                subject = s.Subject,
                teacherName = s.AssignedLibrarian ?? "Bhanu Prakash",
                roomNo = "Central Library"
            })
            .ToListAsync();

        return Ok(new { success = true, className = reqClass, section = reqSec, totalCount = slots.Count, data = slots });
    }

    [HttpPost("sync")]
    public async Task<IActionResult> SyncAdminTimetable()
    {
        var existing = await _context.LibraryTimetableSlots.ToListAsync();
        return Ok(new
        {
            success = true,
            message = $"Library Timetable synchronized with database ({existing.Count} slots found).",
            totalSynced = existing.Count,
            data = existing
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTimetableSlot([FromBody] CreateLibraryTimetableSlotDto dto)
    {
        var slot = new LibraryTimetableSlot
        {
            DayOfWeek = !string.IsNullOrWhiteSpace(dto.DayOfWeek) ? dto.DayOfWeek.Trim() : "Wednesday",
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
        var slot = await _context.LibraryTimetableSlots.FindAsync(id);
        if (slot != null)
        {
            _context.LibraryTimetableSlots.Remove(slot);
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Library timetable slot removed." });
    }
}
