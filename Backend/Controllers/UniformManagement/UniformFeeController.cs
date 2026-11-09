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
        try
        {
            var query = _context.UniformFeeConfigs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower();
                query = query.Where(f => (f.ClassName != null && f.ClassName.ToLower().Contains(s)) ||
                                         (f.PackageOrItemName != null && f.PackageOrItemName.ToLower().Contains(s)) ||
                                         (f.Gender != null && f.Gender.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(className) && className.Trim().ToLower() != "all classes")
            {
                string c = className.Trim().ToLower();
                query = query.Where(f => f.ClassName.ToLower() == c);
            }

            var dbItems = await query.OrderByDescending(f => f.Id).ToListAsync();

            var dtos = dbItems.Select(f => new UniformFeeConfigDto
            {
                Id = f.Id,
                ClassName = f.ClassName ?? string.Empty,
                PackageOrItemName = f.PackageOrItemName ?? string.Empty,
                Gender = f.Gender ?? string.Empty,
                AcademicYear = f.AcademicYear ?? string.Empty,
                FeeAmount = f.FeeAmount,
                Status = f.Status ?? string.Empty,
                CreatedAt = f.CreatedAt
            }).ToList();

            return Ok(new { success = true, totalCount = dtos.Count, data = dtos });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetUniformFeeOptions()
    {
        var dbClasses = new List<string>();
        try
        {
            dbClasses = await _context.Classes.AsNoTracking()
                .Where(c => !string.IsNullOrWhiteSpace(c.ClassName))
                .Select(c => c.ClassName!)
                .Distinct()
                .ToListAsync();
        }
        catch { }

        var standardClasses = new List<string> { "Nursery", "LKG", "UKG" };
        for (int i = 1; i <= 12; i++) standardClasses.Add($"Class {i}");
        var combinedClasses = standardClasses.Concat(dbClasses).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var classes = new List<string> { "All Classes" }.Concat(combinedClasses).ToList();

        var genders = new List<string>
        {
            "Unisex / All Genders",
            "Male (Boys)",
            "Female (Girls)"
        };

        var basePackages = new List<string>();
        var additionalPackages = new List<string>();

        var dbTypes = new List<UniformType>();
        try
        {
            dbTypes = await _context.UniformTypes.AsNoTracking().ToListAsync();
        }
        catch { }

        var dbCategories = new List<string>();
        try
        {
            dbCategories = await _context.UniformCategories.AsNoTracking()
                .Where(c => !string.IsNullOrWhiteSpace(c.CategoryName))
                .Select(c => c.CategoryName!)
                .Distinct()
                .ToListAsync();
        }
        catch { }

        foreach (var t in dbTypes)
        {
            if (string.IsNullOrWhiteSpace(t.ItemName)) continue;
            var name = t.ItemName.Trim();
            var lower = name.ToLower();
            bool isPkg = !string.IsNullOrWhiteSpace(t.IncludedItemsJson) ||
                         lower.Contains("package") ||
                         lower.Contains("kit");
            if (isPkg)
            {
                if (!basePackages.Contains(name, StringComparer.OrdinalIgnoreCase))
                    basePackages.Add(name);
            }
            else
            {
                if (!additionalPackages.Contains(name, StringComparer.OrdinalIgnoreCase))
                    additionalPackages.Add(name);
            }
        }

        foreach (var cat in dbCategories)
        {
            if (string.IsNullOrWhiteSpace(cat)) continue;
            var name = cat.Trim();
            var lower = name.ToLower();
            bool isPkg = lower.Contains("package") || lower.Contains("kit");
            if (isPkg)
            {
                if (!basePackages.Contains(name, StringComparer.OrdinalIgnoreCase))
                    basePackages.Add(name);
            }
            else
            {
                if (!additionalPackages.Contains(name, StringComparer.OrdinalIgnoreCase) &&
                    !basePackages.Contains(name, StringComparer.OrdinalIgnoreCase))
                {
                    additionalPackages.Add(name);
                }
            }
        }

        var allItems = basePackages.Concat(additionalPackages).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

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
                ClassName = item.ClassName ?? string.Empty,
                PackageOrItemName = item.PackageOrItemName ?? string.Empty,
                Gender = item.Gender ?? string.Empty,
                AcademicYear = item.AcademicYear ?? string.Empty,
                FeeAmount = item.FeeAmount,
                Status = item.Status ?? string.Empty,
                CreatedAt = item.CreatedAt
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateUniformFeeConfig([FromBody] CreateUniformFeeConfigDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.ClassName) || string.IsNullOrWhiteSpace(dto.PackageOrItemName))
        {
            return BadRequest(new { success = false, message = "Class Name and Uniform Package / Item Name are required." });
        }

        if (dto.FeeAmount <= 0 || dto.FeeAmount > 500000m)
        {
            return BadRequest(new { success = false, message = "Fee Amount must be greater than 0 and cannot exceed 500,000." });
        }

        var entity = new UniformFeeConfig
        {
            ClassName = dto.ClassName.Trim(),
            PackageOrItemName = dto.PackageOrItemName.Trim(),
            Gender = !string.IsNullOrWhiteSpace(dto.Gender) ? dto.Gender.Trim() : string.Empty,
            AcademicYear = !string.IsNullOrWhiteSpace(dto.AcademicYear) ? dto.AcademicYear.Trim() : string.Empty,
            FeeAmount = dto.FeeAmount >= 0 ? dto.FeeAmount : 0m,
            Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status.Trim() : "Active",
            CreatedAt = DateTime.UtcNow
        };

        await _context.UniformFeeConfigs.AddAsync(entity);
        await _context.SaveChangesAsync();

        var resultDto = new UniformFeeConfigDto
        {
            Id = entity.Id,
            ClassName = entity.ClassName ?? string.Empty,
            PackageOrItemName = entity.PackageOrItemName ?? string.Empty,
            Gender = entity.Gender ?? string.Empty,
            AcademicYear = entity.AcademicYear ?? string.Empty,
            FeeAmount = entity.FeeAmount,
            Status = entity.Status ?? string.Empty,
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
        if (dto.FeeAmount > 500000m)
        {
            return BadRequest(new { success = false, message = "Fee Amount cannot exceed 500,000." });
        }
        if (dto.FeeAmount > 0) entity.FeeAmount = dto.FeeAmount;
        if (!string.IsNullOrWhiteSpace(dto.Status)) entity.Status = dto.Status.Trim();

        await _context.SaveChangesAsync();

        var resultDto = new UniformFeeConfigDto
        {
            Id = entity.Id,
            ClassName = entity.ClassName ?? string.Empty,
            PackageOrItemName = entity.PackageOrItemName ?? string.Empty,
            Gender = entity.Gender ?? string.Empty,
            AcademicYear = entity.AcademicYear ?? string.Empty,
            FeeAmount = entity.FeeAmount,
            Status = entity.Status ?? string.Empty,
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
