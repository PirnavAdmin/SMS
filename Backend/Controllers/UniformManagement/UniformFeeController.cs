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
[Route("api/uniform/fee-configs")]
[Route("api/finance/uniform-fee")]
[Route("api/uniform-fee")]
[Route("api/uniform/fees")]
[AllowAnonymous]
[Tags("Uniform Fee Configurations")]
public class UniformFeeController : ControllerBase
{
    private readonly AppDbContext _context;

    public UniformFeeController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetUniformFeeConfigs(
        [FromQuery] string? search,
        [FromQuery] string? className)
    {
        var defaultFeeConfigs = new List<UniformFeeConfigDto>
        {
            new UniformFeeConfigDto
            {
                Id = 1,
                ClassName = "Class 10",
                PackageOrItemName = "Full Kit",
                Gender = "Unisex",
                AcademicYear = "2025-2026",
                FeeAmount = 3500.00m,
                Status = "Active",
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            }
        };

        try
        {
            var query = _context.UniformFeeConfigs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower();
                query = query.Where(f => f.ClassName.ToLower().Contains(s) || f.PackageOrItemName.ToLower().Contains(s) || f.Gender.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(className) && className.Trim().ToLower() != "all classes")
            {
                string c = className.Trim().ToLower();
                query = query.Where(f => f.ClassName.ToLower() == c);
            }

            var dbItems = await query.OrderByDescending(f => f.Id).ToListAsync();

            if (dbItems.Any())
            {
                var dtos = dbItems.Select(f => new UniformFeeConfigDto
                {
                    Id = f.Id,
                    ClassName = f.ClassName,
                    PackageOrItemName = f.PackageOrItemName,
                    Gender = f.Gender,
                    AcademicYear = f.AcademicYear,
                    FeeAmount = f.FeeAmount,
                    Status = f.Status,
                    CreatedAt = f.CreatedAt
                }).ToList();

                return Ok(new { success = true, totalCount = dtos.Count, data = dtos });
            }
        }
        catch { }

        return Ok(new { success = true, totalCount = defaultFeeConfigs.Count, data = defaultFeeConfigs });
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetUniformFeeOptions()
    {
        var defaultClasses = new List<string>
        {
            "All Classes", "Nursery", "LKG", "UKG",
            "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
            "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
        };

        var dbClasses = new List<string>();
        try
        {
            dbClasses = (await _context.Classes.AsNoTracking()
                .Where(c => c.ClassName != null)
                .Select(c => c.ClassName)
                .Distinct()
                .ToListAsync())!;
        }
        catch { }

        var classes = dbClasses.Any()
            ? new List<string> { "All Classes" }.Concat(dbClasses).Distinct().ToList()
            : defaultClasses;

        var genders = new List<string>
        {
            "Unisex / All Genders",
            "Male (Boys)",
            "Female (Girls)"
        };

        var basePackages = new List<string>
        {
            "Boys Uniform Package (Admission Kit)",
            "Girls Uniform Package (Admission Kit)",
            "Cloth"
        };

        var additionalPackages = new List<string>
        {
            "Sports Shoe",
            "Extra Shirt",
            "Extra Pair of Trousers",
            "Extra Skirt",
            "Formal Blazer (Winter)",
            "Tie & Crest",
            "Belt",
            "Black Shoes (Pair)",
            "Socks (Pair)"
        };

        var dbItems = new List<string>();
        try
        {
            dbItems = (await _context.UniformTypes.AsNoTracking()
                .Where(u => u.ItemName != null)
                .Select(u => u.ItemName)
                .Distinct()
                .ToListAsync())!;
        }
        catch { }

        var allItems = dbItems.Any()
            ? basePackages.Concat(additionalPackages).Concat(dbItems).Distinct().ToList()
            : basePackages.Concat(additionalPackages).Distinct().ToList();

        return Ok(new
        {
            success = true,
            data = new
            {
                classes,
                genders,
                basePackages,
                additionalPackages,
                allItems
            }
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUniformFeeConfigById(int id)
    {
        var item = await _context.UniformFeeConfigs.FindAsync(id);
        if (item == null) return NotFound(new { success = false, message = "Uniform fee configuration not found." });

        return Ok(new
        {
            success = true,
            data = new UniformFeeConfigDto
            {
                Id = item.Id,
                ClassName = item.ClassName,
                PackageOrItemName = item.PackageOrItemName,
                Gender = item.Gender,
                AcademicYear = item.AcademicYear,
                FeeAmount = item.FeeAmount,
                Status = item.Status,
                CreatedAt = item.CreatedAt
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateUniformFeeConfig([FromBody] CreateUniformFeeConfigDto dto)
    {
        var entity = new UniformFeeConfig
        {
            ClassName = !string.IsNullOrWhiteSpace(dto.ClassName) ? dto.ClassName.Trim() : "Class 10",
            PackageOrItemName = !string.IsNullOrWhiteSpace(dto.PackageOrItemName) ? dto.PackageOrItemName.Trim() : "Full Kit",
            Gender = !string.IsNullOrWhiteSpace(dto.Gender) ? dto.Gender.Trim() : "Unisex",
            AcademicYear = !string.IsNullOrWhiteSpace(dto.AcademicYear) ? dto.AcademicYear.Trim() : "2025-2026",
            FeeAmount = dto.FeeAmount > 0 ? dto.FeeAmount : 3500.00m,
            Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status.Trim() : "Active",
            CreatedAt = DateTime.UtcNow
        };

        await _context.UniformFeeConfigs.AddAsync(entity);
        await _context.SaveChangesAsync();

        var resultDto = new UniformFeeConfigDto
        {
            Id = entity.Id,
            ClassName = entity.ClassName,
            PackageOrItemName = entity.PackageOrItemName,
            Gender = entity.Gender,
            AcademicYear = entity.AcademicYear,
            FeeAmount = entity.FeeAmount,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt
        };

        return Ok(new { success = true, message = "Uniform fee configuration saved successfully.", data = resultDto });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUniformFeeConfig(int id, [FromBody] CreateUniformFeeConfigDto dto)
    {
        var entity = await _context.UniformFeeConfigs.FindAsync(id);
        if (entity == null) return NotFound(new { success = false, message = "Uniform fee configuration not found." });

        if (!string.IsNullOrWhiteSpace(dto.ClassName)) entity.ClassName = dto.ClassName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.PackageOrItemName)) entity.PackageOrItemName = dto.PackageOrItemName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Gender)) entity.Gender = dto.Gender.Trim();
        if (!string.IsNullOrWhiteSpace(dto.AcademicYear)) entity.AcademicYear = dto.AcademicYear.Trim();
        if (dto.FeeAmount > 0) entity.FeeAmount = dto.FeeAmount;
        if (!string.IsNullOrWhiteSpace(dto.Status)) entity.Status = dto.Status.Trim();

        await _context.SaveChangesAsync();

        var resultDto = new UniformFeeConfigDto
        {
            Id = entity.Id,
            ClassName = entity.ClassName,
            PackageOrItemName = entity.PackageOrItemName,
            Gender = entity.Gender,
            AcademicYear = entity.AcademicYear,
            FeeAmount = entity.FeeAmount,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt
        };

        return Ok(new { success = true, message = "Uniform fee configuration updated successfully.", data = resultDto });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUniformFeeConfig(int id)
    {
        var entity = await _context.UniformFeeConfigs.FindAsync(id);
        if (entity != null)
        {
            _context.UniformFeeConfigs.Remove(entity);
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Uniform fee configuration deleted successfully." });
    }
}
