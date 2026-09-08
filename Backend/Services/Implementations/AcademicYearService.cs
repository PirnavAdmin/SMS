namespace SMS.Api.Services.Implementations;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Services.Interfaces;

public class AcademicYearService : IAcademicYearService
{
    private readonly AppDbContext _context;

    public AcademicYearService(AppDbContext context)
    {
        _context = context;
    }

    private async Task EnsureDefaultAcademicYearsAsync()
    {
        if (!await _context.AcademicYears.AnyAsync())
        {
            var now = DateTime.UtcNow;
            int startYear = now.Month >= 6 ? now.Year : now.Year - 1;
            var defaults = new List<AcademicYear>
            {
                new AcademicYear { AcademicYearName = $"{startYear}-{startYear + 1}", StartDate = new DateTime(startYear, 6, 1), EndDate = new DateTime(startYear + 1, 4, 30), IsCurrent = true, IsActive = true },
                new AcademicYear { AcademicYearName = $"{startYear - 1}-{startYear}", StartDate = new DateTime(startYear - 1, 6, 1), EndDate = new DateTime(startYear, 4, 30), IsCurrent = false, IsActive = true }
            };
            _context.AcademicYears.AddRange(defaults);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<string> GetCurrentAcademicYearAsync()
    {
        await EnsureDefaultAcademicYearsAsync();

        var activeYear = await _context.AcademicYears
            .AsNoTracking()
            .Where(ay => !ay.IsDeleted && ay.IsActive && ay.IsCurrent)
            .Select(ay => ay.AcademicYearName)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrWhiteSpace(activeYear))
        {
            return activeYear;
        }

        var latestYear = await _context.AcademicYears
            .AsNoTracking()
            .Where(ay => !ay.IsDeleted && ay.IsActive)
            .OrderByDescending(ay => ay.StartDate)
            .Select(ay => ay.AcademicYearName)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrWhiteSpace(latestYear))
        {
            return latestYear;
        }

        var now = DateTime.UtcNow;
        int currentStart = now.Month >= 6 ? now.Year : now.Year - 1;
        return $"{currentStart}-{currentStart + 1}";
    }

    public async Task<List<AcademicYearDto>> GetAllAcademicYearsAsync()
    {
        await EnsureDefaultAcademicYearsAsync();

        return await _context.AcademicYears
            .AsNoTracking()
            .Where(ay => !ay.IsDeleted)
            .OrderByDescending(ay => ay.IsCurrent)
            .ThenByDescending(ay => ay.AcademicYearId)
            .Select(ay => new AcademicYearDto
            {
                Id = $"AY-{ay.AcademicYearId}",
                AcademicYearId = ay.AcademicYearId,
                AcademicYear = ay.AcademicYearName,
                StartDate = ay.StartDate.ToString("yyyy-MM-dd"),
                EndDate = ay.EndDate.ToString("yyyy-MM-dd"),
                Status = ay.IsCurrent ? "Active" : (ay.IsActive ? "Upcoming" : "Closed"),
                Description = ay.IsCurrent ? "Current active academic session" : "",
                IsCurrentAcademicYear = ay.IsCurrent
            })
            .ToListAsync();
    }
}
