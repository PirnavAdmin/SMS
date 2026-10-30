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
[Route("api/branches")]
    public class BranchesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BranchesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Branches
        [HttpGet]
        public async Task<IActionResult> GetBranches()
        {
            try
            {
                // Synchronize SchoolSettings.CampusesJson into Branches table if missing
                var settings = await _context.SchoolSettings.FirstOrDefaultAsync();
                if (settings != null && !string.IsNullOrWhiteSpace(settings.CampusesJson))
                {
                    try
                    {
                        var jsonCampuses = System.Text.Json.JsonSerializer.Deserialize<List<BranchDto>>(settings.CampusesJson, new System.Text.Json.JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                        if (jsonCampuses != null && jsonCampuses.Count > 0)
                        {
                            var existingBranches = await _context.Branches.ToListAsync();
                            bool changed = false;

                            foreach (var jc in jsonCampuses)
                            {
                                if (string.IsNullOrWhiteSpace(jc.Name)) continue;
                                var match = existingBranches.FirstOrDefault(eb =>
                                    string.Equals(eb.BranchName.Trim(), jc.Name.Trim(), StringComparison.OrdinalIgnoreCase) ||
                                    (!string.IsNullOrWhiteSpace(jc.Code) && string.Equals(eb.BranchCode.Trim(), jc.Code.Trim(), StringComparison.OrdinalIgnoreCase)));

                                if (match == null)
                                {
                                    _context.Branches.Add(new Branch
                                    {
                                        BranchName = jc.Name.Trim(),
                                        BranchCode = !string.IsNullOrWhiteSpace(jc.Code) ? jc.Code.Trim().ToUpper() : jc.Name.Trim().Substring(0, Math.Min(5, jc.Name.Trim().Length)).ToUpper(),
                                        Address = jc.Address?.Trim() ?? "",
                                        Phone = jc.Phone?.Trim() ?? "",
                                        Email = jc.Email?.Trim() ?? "",
                                        Status = string.IsNullOrWhiteSpace(jc.Status) ? "Active" : jc.Status
                                    });
                                    changed = true;
                                }
                            }

                            if (changed)
                            {
                                await _context.SaveChangesAsync();
                            }
                        }
                    }
                    catch { }
                }

                var list = await _context.Branches
                    .OrderBy(b => b.BranchId)
                    .Select(b => new BranchDto
                    {
                        Id = $"CMP-{b.BranchId:D2}",
                        BranchId = b.BranchId,
                        Name = b.BranchName,
                        Code = b.BranchCode,
                        Address = b.Address ?? "",
                        Phone = b.Phone ?? "",
                        Email = b.Email ?? "",
                        Status = b.Status ?? "Active"
                    })
                    .ToListAsync();

                // If Branches table is still empty but settings has campuses, return settings campuses
                if (list.Count == 0 && settings != null && !string.IsNullOrWhiteSpace(settings.CampusesJson))
                {
                    try
                    {
                        var jsonCampuses = System.Text.Json.JsonSerializer.Deserialize<List<BranchDto>>(settings.CampusesJson, new System.Text.Json.JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
                        if (jsonCampuses != null && jsonCampuses.Count > 0)
                        {
                            return Ok(new { success = true, data = jsonCampuses });
                        }
                    }
                    catch { }
                }

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Branches
        [HttpPost]
        public async Task<IActionResult> CreateBranch([FromBody] BranchDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Campus name is required.");

            var b = new Branch
            {
                BranchName = dto.Name.Trim(),
                BranchCode = !string.IsNullOrWhiteSpace(dto.Code) ? dto.Code.Trim().ToUpper() : dto.Name.Trim().Substring(0, Math.Min(5, dto.Name.Trim().Length)).ToUpper(),
                Address = dto.Address?.Trim() ?? "",
                Phone = dto.Phone?.Trim() ?? "",
                Email = dto.Email?.Trim() ?? "",
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status
            };

            _context.Branches.Add(b);
            await _context.SaveChangesAsync();

            await SyncBranchesToSchoolSettingsAsync();

            var result = new BranchDto
            {
                Id = $"CMP-{b.BranchId:D2}",
                BranchId = b.BranchId,
                Name = b.BranchName,
                Code = b.BranchCode,
                Address = b.Address ?? "",
                Phone = b.Phone ?? "",
                Email = b.Email ?? "",
                Status = b.Status
            };

            return Ok(new { success = true, message = "Campus branch created successfully.", data = result });
        }

        // PUT: api/Branches/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBranch(string id, [FromBody] BranchDto dto)
        {
            if (dto == null) return BadRequest("Invalid branch payload.");

            int numId = 0;
            if (int.TryParse(id, out var parsed)) numId = parsed;
            else if (id.StartsWith("CMP-") && int.TryParse(id.Replace("CMP-", ""), out var parsedCmp)) numId = parsedCmp;
            else if (dto.BranchId > 0) numId = dto.BranchId;

            var b = await _context.Branches.FirstOrDefaultAsync(x => x.BranchId == numId || x.BranchName.ToLower() == id.ToLower());
            if (b == null) return NotFound("Campus branch not found.");

            if (!string.IsNullOrWhiteSpace(dto.Name)) b.BranchName = dto.Name.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Code)) b.BranchCode = dto.Code.Trim().ToUpper();
            b.Address = dto.Address?.Trim() ?? "";
            if (dto.Phone != null) b.Phone = dto.Phone.Trim();
            if (dto.Email != null) b.Email = dto.Email.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Status)) b.Status = dto.Status;

            await _context.SaveChangesAsync();

            await SyncBranchesToSchoolSettingsAsync();

            var result = new BranchDto
            {
                Id = $"CMP-{b.BranchId:D2}",
                BranchId = b.BranchId,
                Name = b.BranchName,
                Code = b.BranchCode,
                Address = b.Address ?? "",
                Phone = b.Phone ?? "",
                Email = b.Email ?? "",
                Status = b.Status
            };

            return Ok(new { success = true, message = "Campus branch updated successfully.", data = result });
        }

        // DELETE: api/Branches/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBranch(string id)
        {
            int numId = 0;
            if (int.TryParse(id, out var parsed)) numId = parsed;
            else if (id.StartsWith("CMP-") && int.TryParse(id.Replace("CMP-", ""), out var parsedCmp)) numId = parsedCmp;

            var b = await _context.Branches.FirstOrDefaultAsync(x => x.BranchId == numId || x.BranchName.ToLower() == id.ToLower());
            if (b == null) return NotFound("Campus branch not found.");

            _context.Branches.Remove(b);
            await _context.SaveChangesAsync();

            await SyncBranchesToSchoolSettingsAsync();

            return Ok(new { success = true, message = "Campus branch deleted successfully." });
        }

        private async Task SyncBranchesToSchoolSettingsAsync()
        {
            try
            {
                var allBranches = await _context.Branches
                    .OrderBy(b => b.BranchId)
                    .Select(b => new BranchDto
                    {
                        Id = $"CMP-{b.BranchId:D2}",
                        BranchId = b.BranchId,
                        Name = b.BranchName,
                        Code = b.BranchCode,
                        Address = b.Address ?? "",
                        Phone = b.Phone ?? "",
                        Email = b.Email ?? "",
                        Status = b.Status ?? "Active"
                    })
                    .ToListAsync();

                var settings = await _context.SchoolSettings.FirstOrDefaultAsync();
                if (settings != null)
                {
                    settings.CampusesJson = System.Text.Json.JsonSerializer.Serialize(allBranches);
                    settings.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
            catch { }
        }
    }
}
