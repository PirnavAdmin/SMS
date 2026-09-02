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
[Route("api/librarian-attendance")]
[Route("api/library/librarian-attendance")]
[AllowAnonymous]
[Tags("Librarian Attendance Management")]
public class LibrarianAttendanceController : ControllerBase
{
    private readonly AppDbContext _context;

    public LibrarianAttendanceController(AppDbContext context)
    {
        _context = context;
    }

    private async Task EnsureDefaultAttendanceLogsAsync()
    {
        if (!await _context.LibrarianAttendances.AnyAsync())
        {
            var defaults = new List<LibrarianAttendance>
            {
                new LibrarianAttendance { Date = new DateTime(2026, 8, 25), StaffName = "Bhanu Prakash", EmployeeCode = "EMP-LIB-01", ShiftDetails = "Morning Shift (08:30 - 17:00)", CheckInTime = "11:59 AM", CheckOutTime = "05:00 PM", TotalHours = 8.5, Status = "Late", DutyRemarks = "Late arrival check-in • Checked out at 05:00 PM" },
                new LibrarianAttendance { Date = new DateTime(2026, 8, 20), StaffName = "Bhanu Prakash", EmployeeCode = "EMP-LIB-01", ShiftDetails = "Morning Shift (08:30 - 17:00)", CheckInTime = "08:30 AM", CheckOutTime = "05:00 PM", TotalHours = 8.5, Status = "Present", DutyRemarks = "Catalog audit & inventory completed" },
                new LibrarianAttendance { Date = new DateTime(2026, 8, 20), StaffName = "Rachel Green", EmployeeCode = "EMP-LIB-02", ShiftDetails = "Morning Shift (08:30 - 17:00)", CheckInTime = "08:45 AM", CheckOutTime = "05:15 PM", TotalHours = 8.5, Status = "Present", DutyRemarks = "Circulation desk duty" },
                new LibrarianAttendance { Date = new DateTime(2026, 8, 19), StaffName = "Bhanu Prakash", EmployeeCode = "EMP-LIB-01", ShiftDetails = "Morning Shift (08:30 - 17:00)", CheckInTime = "08:28 AM", CheckOutTime = "05:05 PM", TotalHours = 8.6, Status = "Present", DutyRemarks = "Book issue renewals" }
            };
            await _context.LibrarianAttendances.AddRangeAsync(defaults);
            await _context.SaveChangesAsync();
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetLibrarianAttendance(
        [FromQuery] string? view = "daily",
        [FromQuery] string? date = null,
        [FromQuery] string? month = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        await EnsureDefaultAttendanceLogsAsync();

        var query = _context.LibrarianAttendances.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(date))
        {
            if (DateTime.TryParse(date, out var parsedDate))
            {
                query = query.Where(a => a.Date.Date == parsedDate.Date);
            }
        }

        if (!string.IsNullOrWhiteSpace(month))
        {
            if (DateTime.TryParse(month + "-01", out var parsedMonth))
            {
                query = query.Where(a => a.Date.Year == parsedMonth.Year && a.Date.Month == parsedMonth.Month);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(a => a.StaffName.ToLower().Contains(s) || a.EmployeeCode.ToLower().Contains(s) || a.Status.ToLower().Contains(s));
        }

        var dbLogs = await query.OrderByDescending(a => a.Date).ThenByDescending(a => a.AttendanceId).ToListAsync();

        var dataList = dbLogs.Select(a => new LibrarianAttendanceDto
        {
            Id = $"ATT-LIB-{a.AttendanceId}",
            AttendanceId = a.AttendanceId,
            Date = a.Date.ToString("yyyy-MM-dd"),
            StaffId = a.EmployeeCode,
            StaffName = a.StaffName,
            Role = "Librarian",
            Shift = a.ShiftDetails,
            CheckInTime = a.CheckInTime,
            CheckOutTime = a.CheckOutTime ?? "",
            TotalHours = a.TotalHours,
            WorkingHours = string.IsNullOrWhiteSpace(a.CheckOutTime) ? "--" : $"{a.TotalHours:F1} Hours",
            Status = a.Status,
            DutyRemarks = a.DutyRemarks ?? ""
        }).ToList();

        int presentCount = dbLogs.Count(a => a.Status.Equals("Present", StringComparison.OrdinalIgnoreCase) || a.Status.Equals("Late", StringComparison.OrdinalIgnoreCase));
        int lateCount = dbLogs.Count(a => a.Status.Equals("Late", StringComparison.OrdinalIgnoreCase));
        int leaveCount = dbLogs.Count(a => a.Status.Equals("On Leave", StringComparison.OrdinalIgnoreCase) || a.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase));

        return Ok(new
        {
            success = true,
            summary = new
            {
                present = presentCount,
                late = lateCount,
                onLeave = leaveCount
            },
            totalCount = dataList.Count,
            data = dataList
        });
    }

    [HttpPost]
    public async Task<IActionResult> LogAttendance([FromBody] CreateLibrarianAttendanceDto dto)
    {
        if (dto == null) return BadRequest(new { success = false, message = "Invalid attendance payload." });

        string staffName = !string.IsNullOrWhiteSpace(dto.StaffName) ? dto.StaffName.Trim() : "Bhanu Prakash";
        string empCode = !string.IsNullOrWhiteSpace(dto.StaffId) ? dto.StaffId.Trim() : (!string.IsNullOrWhiteSpace(dto.EmployeeCode) ? dto.EmployeeCode.Trim() : "EMP-LIB-01");
        DateTime attDate = DateTime.TryParse(dto.Date, out var pDate) ? pDate.Date : DateTime.UtcNow.Date;

        // Check if attendance record already exists for staff on this date
        var existing = await _context.LibrarianAttendances
            .FirstOrDefaultAsync(a => a.EmployeeCode.ToLower() == empCode.ToLower() && a.Date.Date == attDate.Date);

        if (existing != null)
        {
            if (!string.IsNullOrWhiteSpace(dto.CheckInTime)) existing.CheckInTime = dto.CheckInTime.Trim();
            if (!string.IsNullOrWhiteSpace(dto.CheckOutTime)) existing.CheckOutTime = dto.CheckOutTime.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Status)) existing.Status = dto.Status.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Remarks)) existing.DutyRemarks = dto.Remarks;
            else if (!string.IsNullOrWhiteSpace(dto.DutyRemarks)) existing.DutyRemarks = dto.DutyRemarks;

            await _context.SaveChangesAsync();

            var updatedDto = new LibrarianAttendanceDto
            {
                Id = $"ATT-LIB-{existing.AttendanceId}",
                AttendanceId = existing.AttendanceId,
                Date = existing.Date.ToString("yyyy-MM-dd"),
                StaffId = existing.EmployeeCode,
                StaffName = existing.StaffName,
                Role = "Librarian",
                Shift = existing.ShiftDetails,
                CheckInTime = existing.CheckInTime,
                CheckOutTime = existing.CheckOutTime ?? "",
                TotalHours = existing.TotalHours,
                WorkingHours = string.IsNullOrWhiteSpace(existing.CheckOutTime) ? "--" : $"{existing.TotalHours:F1} Hours",
                Status = existing.Status,
                DutyRemarks = existing.DutyRemarks ?? ""
            };

            return Ok(new { success = true, message = "Librarian shift updated successfully.", data = updatedDto });
        }

        var entity = new LibrarianAttendance
        {
            Date = attDate,
            StaffName = staffName,
            EmployeeCode = empCode,
            ShiftDetails = !string.IsNullOrWhiteSpace(dto.Shift) ? dto.Shift.Trim() : (!string.IsNullOrWhiteSpace(dto.ShiftDetails) ? dto.ShiftDetails.Trim() : "Morning Shift (08:30 - 17:00)"),
            CheckInTime = !string.IsNullOrWhiteSpace(dto.CheckInTime) ? dto.CheckInTime.Trim() : DateTime.Now.ToString("hh:mm tt"),
            CheckOutTime = !string.IsNullOrWhiteSpace(dto.CheckOutTime) ? dto.CheckOutTime.Trim() : null,
            TotalHours = dto.TotalHours > 0 ? dto.TotalHours : 8.5,
            Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status.Trim() : "Present",
            DutyRemarks = dto.Remarks ?? dto.DutyRemarks ?? "Routine shift check-in"
        };

        await _context.LibrarianAttendances.AddAsync(entity);
        await _context.SaveChangesAsync();

        var resultDto = new LibrarianAttendanceDto
        {
            Id = $"ATT-LIB-{entity.AttendanceId}",
            AttendanceId = entity.AttendanceId,
            Date = entity.Date.ToString("yyyy-MM-dd"),
            StaffId = entity.EmployeeCode,
            StaffName = entity.StaffName,
            Role = "Librarian",
            Shift = entity.ShiftDetails,
            CheckInTime = entity.CheckInTime,
            CheckOutTime = entity.CheckOutTime ?? "",
            TotalHours = entity.TotalHours,
            WorkingHours = string.IsNullOrWhiteSpace(entity.CheckOutTime) ? "--" : $"{entity.TotalHours:F1} Hours",
            Status = entity.Status,
            DutyRemarks = entity.DutyRemarks ?? ""
        };

        return Ok(new { success = true, message = "Librarian check-in recorded successfully.", data = resultDto });
    }

    [HttpPut("{id}")]
    [HttpPut("/api/librarian-attendance/{id}")]
    public async Task<IActionResult> UpdateAttendance(string id, [FromBody] CreateLibrarianAttendanceDto dto)
    {
        if (dto == null) return BadRequest(new { success = false, message = "Invalid attendance update payload." });

        int numId = 0;
        if (int.TryParse(id, out var parsed)) numId = parsed;
        else if (id.StartsWith("ATT-LIB-") && int.TryParse(id.Replace("ATT-LIB-", ""), out var parsedLib)) numId = parsedLib;

        LibrarianAttendance? item = null;

        if (numId > 0)
        {
            item = await _context.LibrarianAttendances.FindAsync(numId);
        }

        if (item == null)
        {
            // Try matching by today's date and staff code if ID was client-generated timestamp
            string staffCode = !string.IsNullOrWhiteSpace(dto.StaffId) ? dto.StaffId.Trim() : (!string.IsNullOrWhiteSpace(dto.EmployeeCode) ? dto.EmployeeCode.Trim() : "EMP-LIB-01");
            DateTime targetDate = DateTime.TryParse(dto.Date, out var d) ? d.Date : DateTime.UtcNow.Date;

            item = await _context.LibrarianAttendances
                .FirstOrDefaultAsync(a => a.EmployeeCode.ToLower() == staffCode.ToLower() && a.Date.Date == targetDate.Date)
                ?? await _context.LibrarianAttendances.OrderByDescending(a => a.AttendanceId).FirstOrDefaultAsync();
        }

        if (item == null) return NotFound(new { success = false, message = "Attendance record not found." });

        if (!string.IsNullOrWhiteSpace(dto.StaffName)) item.StaffName = dto.StaffName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.CheckInTime)) item.CheckInTime = dto.CheckInTime.Trim();
        if (!string.IsNullOrWhiteSpace(dto.CheckOutTime)) item.CheckOutTime = dto.CheckOutTime.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Status)) item.Status = dto.Status.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Remarks)) item.DutyRemarks = dto.Remarks.Trim();
        else if (!string.IsNullOrWhiteSpace(dto.DutyRemarks)) item.DutyRemarks = dto.DutyRemarks.Trim();

        await _context.SaveChangesAsync();

        var resultDto = new LibrarianAttendanceDto
        {
            Id = $"ATT-LIB-{item.AttendanceId}",
            AttendanceId = item.AttendanceId,
            Date = item.Date.ToString("yyyy-MM-dd"),
            StaffId = item.EmployeeCode,
            StaffName = item.StaffName,
            Role = "Librarian",
            Shift = item.ShiftDetails,
            CheckInTime = item.CheckInTime,
            CheckOutTime = item.CheckOutTime ?? "",
            TotalHours = item.TotalHours,
            WorkingHours = string.IsNullOrWhiteSpace(item.CheckOutTime) ? "--" : $"{item.TotalHours:F1} Hours",
            Status = item.Status,
            DutyRemarks = item.DutyRemarks ?? ""
        };

        return Ok(new { success = true, message = "Librarian check-out / shift updated successfully.", data = resultDto });
    }

    [HttpDelete("{id}")]
    [HttpDelete("/api/librarian-attendance/{id}")]
    public async Task<IActionResult> DeleteAttendance(string id)
    {
        int numId = 0;
        if (int.TryParse(id, out var parsed)) numId = parsed;
        else if (id.StartsWith("ATT-LIB-") && int.TryParse(id.Replace("ATT-LIB-", ""), out var parsedLib)) numId = parsedLib;

        if (numId > 0)
        {
            var item = await _context.LibrarianAttendances.FindAsync(numId);
            if (item != null)
            {
                _context.LibrarianAttendances.Remove(item);
                await _context.SaveChangesAsync();
            }
        }

        return Ok(new { success = true, message = "Attendance record deleted." });
    }
}
