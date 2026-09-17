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

    public async Task<string> GetCurrentAcademicYearAsync()
    {
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

        return string.Empty;
    }

    public async Task<List<AcademicYearDto>> GetAllAcademicYearsAsync()
    {
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
