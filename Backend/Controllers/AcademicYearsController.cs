using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AcademicYearsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AcademicYearsController(AppDbContext context)
        {
            _context = context;
        }

        private async Task EnsureDefaultAcademicYearsAsync()
        {
            if (!await _context.AcademicYears.AnyAsync())
            {
                var defaults = new List<AcademicYear>
                {
                    new AcademicYear { AcademicYearName = "2026–27", StartDate = new DateTime(2026, 6, 1), EndDate = new DateTime(2027, 4, 30), IsCurrent = true, IsActive = true },
                    new AcademicYear { AcademicYearName = "2025–26", StartDate = new DateTime(2025, 6, 1), EndDate = new DateTime(2026, 4, 30), IsCurrent = false, IsActive = true }
                };
                _context.AcademicYears.AddRange(defaults);
                await _context.SaveChangesAsync();
            }
        }

        // GET: api/AcademicYears
        [HttpGet]
        public async Task<IActionResult> GetAcademicYears()
        {
            await EnsureDefaultAcademicYearsAsync();
            var list = await _context.AcademicYears
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

            return Ok(new { success = true, data = list });
        }

        // POST: api/AcademicYears
        [HttpPost]
        public async Task<IActionResult> CreateAcademicYear([FromBody] AcademicYearDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.AcademicYear))
                return BadRequest("Academic Year name is required.");

            DateTime sDate = DateTime.TryParse(dto.StartDate, out var parsedS) ? parsedS : new DateTime(DateTime.UtcNow.Year, 6, 1);
            DateTime eDate = DateTime.TryParse(dto.EndDate, out var parsedE) ? parsedE : new DateTime(DateTime.UtcNow.Year + 1, 4, 30);

            if (dto.IsCurrentAcademicYear || dto.Status == "Active")
            {
                var allYears = await _context.AcademicYears.ToListAsync();
                foreach (var y in allYears)
                {
                    y.IsCurrent = false;
                }
            }

            var ay = new AcademicYear
            {
                AcademicYearName = dto.AcademicYear.Trim(),
                StartDate = sDate,
                EndDate = eDate,
                IsCurrent = dto.IsCurrentAcademicYear || dto.Status == "Active",
                IsActive = dto.Status != "Closed",
                CreatedAt = DateTime.UtcNow
            };

            _context.AcademicYears.Add(ay);
            await _context.SaveChangesAsync();

            var result = new AcademicYearDto
            {
                Id = $"AY-{ay.AcademicYearId}",
                AcademicYearId = ay.AcademicYearId,
                AcademicYear = ay.AcademicYearName,
                StartDate = ay.StartDate.ToString("yyyy-MM-dd"),
                EndDate = ay.EndDate.ToString("yyyy-MM-dd"),
                Status = ay.IsCurrent ? "Active" : (ay.IsActive ? "Upcoming" : "Closed"),
                Description = dto.Description ?? "",
                IsCurrentAcademicYear = ay.IsCurrent
            };

            return Ok(new { success = true, message = "Academic year created successfully.", data = result });
        }

        // PUT: api/AcademicYears/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAcademicYear(string id, [FromBody] AcademicYearDto dto)
        {
            if (dto == null) return BadRequest("Invalid academic year payload.");

            int numId = 0;
            if (int.TryParse(id, out var parsed)) numId = parsed;
            else if (id.StartsWith("AY-") && int.TryParse(id.Replace("AY-", ""), out var parsedAy)) numId = parsedAy;
            else if (dto.AcademicYearId > 0) numId = dto.AcademicYearId;

            var ay = await _context.AcademicYears.FirstOrDefaultAsync(x => x.AcademicYearId == numId || x.AcademicYearName.ToLower() == id.ToLower());
            if (ay == null) return NotFound("Academic year not found.");

            if (!string.IsNullOrWhiteSpace(dto.AcademicYear)) ay.AcademicYearName = dto.AcademicYear.Trim();
            if (DateTime.TryParse(dto.StartDate, out var sDate)) ay.StartDate = sDate;
            if (DateTime.TryParse(dto.EndDate, out var eDate)) ay.EndDate = eDate;

            if (dto.IsCurrentAcademicYear || dto.Status == "Active")
            {
                var allYears = await _context.AcademicYears.ToListAsync();
                foreach (var y in allYears)
                {
                    y.IsCurrent = (y.AcademicYearId == ay.AcademicYearId);
                }
                ay.IsCurrent = true;
                ay.IsActive = true;
            }
            else if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                ay.IsActive = dto.Status != "Closed";
            }

            ay.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var result = new AcademicYearDto
            {
                Id = $"AY-{ay.AcademicYearId}",
                AcademicYearId = ay.AcademicYearId,
                AcademicYear = ay.AcademicYearName,
                StartDate = ay.StartDate.ToString("yyyy-MM-dd"),
                EndDate = ay.EndDate.ToString("yyyy-MM-dd"),
                Status = ay.IsCurrent ? "Active" : (ay.IsActive ? "Upcoming" : "Closed"),
                Description = dto.Description ?? "",
                IsCurrentAcademicYear = ay.IsCurrent
            };

            return Ok(new { success = true, message = "Academic year updated successfully.", data = result });
        }

        // DELETE: api/AcademicYears/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAcademicYear(string id)
        {
            int numId = 0;
            if (int.TryParse(id, out var parsed)) numId = parsed;
            else if (id.StartsWith("AY-") && int.TryParse(id.Replace("AY-", ""), out var parsedAy)) numId = parsedAy;

            var ay = await _context.AcademicYears.FirstOrDefaultAsync(x => x.AcademicYearId == numId || x.AcademicYearName.ToLower() == id.ToLower());
            if (ay == null) return NotFound("Academic year not found.");

            ay.IsDeleted = true;
            ay.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Academic year deleted successfully." });
        }
    }
}
