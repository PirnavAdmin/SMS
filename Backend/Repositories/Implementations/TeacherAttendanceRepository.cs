namespace SMS.Api.Repositories.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

public class TeacherAttendanceRepository
    : ITeacherAttendanceRepository
{
    private readonly AppDbContext _context;

    public TeacherAttendanceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Staff?> GetTeacherByEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return await _context.Staff.AsNoTracking().FirstOrDefaultAsync();
        }

        var normalizedEmail = email.Trim().ToLower();

        var staffByEmail = await _context.Staff
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Email != null &&
                x.Email.ToLower() == normalizedEmail &&
                (x.IsActive == null || x.IsActive == true));

        if (staffByEmail != null) return staffByEmail;

        var staffByEmpId = await _context.Staff
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                (x.EmployeeId != null && x.EmployeeId.ToLower() == normalizedEmail) ||
                (x.FirstName != null && x.FirstName.ToLower() == normalizedEmail) ||
                ((x.FirstName + " " + (x.LastName ?? "")).ToLower().Trim() == normalizedEmail));

        if (staffByEmpId != null) return staffByEmpId;

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                (u.Email != null && u.Email.ToLower() == normalizedEmail) ||
                (u.FullName != null && u.FullName.ToLower() == normalizedEmail));

        if (user != null && !string.IsNullOrEmpty(user.Email))
        {
            var uEmail = user.Email.Trim().ToLower();
            var s = await _context.Staff
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Email != null && x.Email.ToLower() == uEmail);
            if (s != null) return s;
        }

        return await _context.Staff.AsNoTracking().FirstOrDefaultAsync();
    }

    public async Task<StaffAttendance?> GetTodayAttendanceAsync(
        int staffId,
        DateTime date)
    {
        var attendanceDate = date.Date;
        var nextDate = attendanceDate.AddDays(1);

        return await _context.StaffAttendances
            .FirstOrDefaultAsync(x =>
                x.StaffId == staffId &&
                x.Date >= attendanceDate &&
                x.Date < nextDate);
    }

    public async Task<TeacherAttendancePagedResultDto>
        GetHistoryAsync(
            int staffId,
            TeacherAttendanceFilterDto filter)
    {
        var query = _context.StaffAttendances
            .AsNoTracking()
            .Where(x => x.StaffId == staffId);

        if (filter.FromDate.HasValue)
        {
            var fromDate = filter.FromDate.Value.Date;

            query = query.Where(x => x.Date >= fromDate);
        }

        if (filter.ToDate.HasValue)
        {
            var toDateExclusive =
                filter.ToDate.Value.Date.AddDays(1);

            query = query.Where(x =>
                x.Date < toDateExclusive);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            var status = filter.Status.Trim();

            query = query.Where(x =>
                x.Status == status);
        }

        var totalRecords = await query.CountAsync();

        var items = await query
            .OrderByDescending(x => x.Date)
            .Skip(
                (filter.PageNumber - 1) *
                filter.PageSize)
            .Take(filter.PageSize)
            .Select(x => new TeacherAttendanceDto
            {
                // Correct StaffAttendance primary key
                AttendanceId = x.StaffAttendanceId,
                StaffId = x.StaffId,
                Date = x.Date,
                Status = x.Status,
                InTime = x.InTime,
                OutTime = x.OutTime,
                Remarks = x.Remarks
            })
            .ToListAsync();

        return new TeacherAttendancePagedResultDto
        {
            Items = items,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalRecords = totalRecords
        };
    }

    public async Task<StaffAttendance> CreateAttendanceAsync(
        StaffAttendance attendance)
    {
        await _context.StaffAttendances.AddAsync(attendance);
        await _context.SaveChangesAsync();

        return attendance;
    }

    public async Task UpdateAttendanceAsync(
        StaffAttendance attendance)
    {
        _context.StaffAttendances.Update(attendance);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasPendingCorrectionAsync(
        int staffId,
        DateTime attendanceDate)
    {
        var selectedDate = attendanceDate.Date;
        var nextDate = selectedDate.AddDays(1);

        return await _context
            .TeacherAttendanceCorrections
            .AsNoTracking()
            .AnyAsync(x =>
                x.StaffId == staffId &&
                x.AttendanceDate >= selectedDate &&
                x.AttendanceDate < nextDate &&
                x.Status == "Pending");
    }

    public async Task<TeacherAttendanceCorrection>
        CreateCorrectionAsync(
            TeacherAttendanceCorrection correction)
    {
        await _context
            .TeacherAttendanceCorrections
            .AddAsync(correction);

        await _context.SaveChangesAsync();

        return correction;
    }

    public async Task<List<AttendanceCorrectionDto>>
        GetCorrectionsAsync(int staffId)
    {
        return await _context
            .TeacherAttendanceCorrections
            .AsNoTracking()
            .Where(x => x.StaffId == staffId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new AttendanceCorrectionDto
            {
                CorrectionId = x.CorrectionId,
                StaffId = x.StaffId,
                AttendanceDate = x.AttendanceDate,
                CurrentInTime = x.CurrentInTime,
                CurrentOutTime = x.CurrentOutTime,
                RequestedInTime = x.RequestedInTime,
                RequestedOutTime = x.RequestedOutTime,
                Reason = x.Reason,
                Status = x.Status,
                ApprovedRemarks = x.ApprovedRemarks,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();
    }
}