namespace SMS.Api.Repositories.Implementations;

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
        var query = _context.StudentAttendances.AsNoTracking().AsQueryable();

        if (studentId.HasValue && studentId.Value > 0)
        {
            query = query.Where(a => a.StudentId == studentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filterType))
        {
            if (filterType.Equals("Month", StringComparison.OrdinalIgnoreCase))
            {
                int targetYear = year ?? DateTime.Now.Year;
                int targetMonth = (month ?? (DateTime.Now.Month - 1));
                // Convert 0-indexed month to 1-indexed if needed
                if (targetMonth < 1) targetMonth += 1;
                if (targetMonth > 12) targetMonth = 12;

                query = query.Where(a => a.Date.Year == targetYear && a.Date.Month == targetMonth);
            }
            else if (filterType.Equals("Day", StringComparison.OrdinalIgnoreCase) && date.HasValue)
            {
                query = query.Where(a => a.Date.Date == date.Value.Date);
            }
            else if (filterType.Equals("Custom", StringComparison.OrdinalIgnoreCase))
            {
                if (startDate.HasValue)
                    query = query.Where(a => a.Date.Date >= startDate.Value.Date);

                if (endDate.HasValue)
                    query = query.Where(a => a.Date.Date <= endDate.Value.Date);
            }
        }

        if (!string.IsNullOrWhiteSpace(statusFilter) && !statusFilter.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(a => a.Status.ToLower() == statusFilter.ToLower());
        }

        return await query.OrderByDescending(a => a.Date).ToListAsync();
    }

    public async Task AddStudentAttendanceAsync(StudentAttendance attendance) =>
        await _context.StudentAttendances.AddAsync(attendance);

    public async Task AddStudentAttendanceRangeAsync(IEnumerable<StudentAttendance> attendances) =>
        await _context.StudentAttendances.AddRangeAsync(attendances);

    public async Task SaveChangesAsync() =>
        await _context.SaveChangesAsync();
}
