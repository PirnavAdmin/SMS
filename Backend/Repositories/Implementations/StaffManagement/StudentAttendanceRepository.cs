namespace SMS.Api.Repositories.Implementations.StaffManagement;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class StudentAttendanceRepository : IStudentAttendanceRepository
{
    private readonly AppDbContext _context;

    public StudentAttendanceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<StudentAttendance>> GetStudentAttendanceRecordsAsync(
        int? studentId,
        string? filterType,
        int? month,
        int? year,
        DateTime? date,
        DateTime? startDate,
        DateTime? endDate,
        string? statusFilter)
    {
        var query = _context.StudentAttendances
       .AsNoTracking()
       .Include(a => a.AttendanceSession)
       .Include(a => a.Student)
       .AsQueryable();

        // Filter by student
        if (studentId.HasValue && studentId.Value > 0)
        {
            query = query.Where(a => a.StudentId == studentId.Value);
        }

        // Filter by attendance date stored in the parent session
        if (!string.IsNullOrWhiteSpace(filterType))
        {
            switch (filterType.Trim().ToLower())
            {
                case "month":
                    {
                        int targetYear = year ?? DateTime.Now.Year;
                        int targetMonth = month ?? DateTime.Now.Month;

                        if (targetMonth < 1 || targetMonth > 12)
                        {
                            throw new ArgumentException(
                                "Month must be between 1 and 12.");
                        }

                        query = query.Where(a =>
                            a.AttendanceSession != null &&
                            a.AttendanceSession.AttendanceDate.Year == targetYear &&
                            a.AttendanceSession.AttendanceDate.Month == targetMonth);

                        break;
                    }

                case "day":
                    {
                        if (!date.HasValue)
                        {
                            throw new ArgumentException(
                                "Date is required when filter type is Day.");
                        }

                        DateTime selectedDate = date.Value.Date;

                        query = query.Where(a =>
                            a.AttendanceSession != null &&
                            a.AttendanceSession.AttendanceDate.Date == selectedDate);

                        break;
                    }

                case "custom":
                    {
                        if (!startDate.HasValue && !endDate.HasValue)
                        {
                            throw new ArgumentException(
                                "Start date or end date is required for a custom filter.");
                        }

                        if (startDate.HasValue &&
                            endDate.HasValue &&
                            startDate.Value.Date > endDate.Value.Date)
                        {
                            throw new ArgumentException(
                                "Start date cannot be later than end date.");
                        }

                        if (startDate.HasValue)
                        {
                            DateTime selectedStartDate = startDate.Value.Date;

                            query = query.Where(a =>
                                a.AttendanceSession != null &&
                                a.AttendanceSession.AttendanceDate.Date >=
                                selectedStartDate);
                        }

                        if (endDate.HasValue)
                        {
                            DateTime selectedEndDate = endDate.Value.Date;

                            query = query.Where(a =>
                                a.AttendanceSession != null &&
                                a.AttendanceSession.AttendanceDate.Date <=
                                selectedEndDate);
                        }

                        break;
                    }

                default:
                    throw new ArgumentException(
                        "Filter type must be Month, Day, or Custom.");
            }
        }

        // Filter by attendance status
        if (!string.IsNullOrWhiteSpace(statusFilter) &&
            !statusFilter.Equals(
                "All",
                StringComparison.OrdinalIgnoreCase))
        {
            string normalizedStatus = NormalizeStatus(statusFilter);

            query = query.Where(a => a.Status == normalizedStatus);
        }

        return await query
            .OrderByDescending(a =>
                a.AttendanceSession!.AttendanceDate)
            .ThenBy(a => a.StudentId)
            .ToListAsync();
    }

    public async Task AddStudentAttendanceAsync(
        StudentAttendance attendance)
    {
        ArgumentNullException.ThrowIfNull(attendance);

        await _context.StudentAttendances.AddAsync(attendance);
    }

    public async Task AddStudentAttendanceRangeAsync(
        IEnumerable<StudentAttendance> attendances)
    {
        ArgumentNullException.ThrowIfNull(attendances);

        await _context.StudentAttendances.AddRangeAsync(attendances);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    private static string NormalizeStatus(string status)
    {
        string normalized = status
            .Trim()
            .Replace(" ", string.Empty)
            .ToLowerInvariant();

        return normalized switch
        {
            "present" => "Present",
            "absent" => "Absent",
            "late" => "Late",
            "halfday" => "HalfDay",
            "leave" => "Leave",
            _ => throw new ArgumentException(
                "Status must be Present, Absent, Late, HalfDay, Leave, or All.")
        };
    }
}
