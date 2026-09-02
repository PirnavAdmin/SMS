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
    public class BranchesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BranchesController(AppDbContext context)
        {
            _context = context;
        }

        private async Task EnsureDefaultBranchesAsync()
        {
            if (!await _context.Branches.AnyAsync())
            {
                var defaults = new List<Branch>
                {
                    new Branch { BranchName = "Main Campus", BranchCode = "MAIN", Address = "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081", Phone = "+91 9123456789", Email = "main@pirnavschools.edu", Status = "Active" },
                    new Branch { BranchName = "North Branch", BranchCode = "NORTH", Address = "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081", Phone = "+91 9123456789", Email = "north@pirnavschools.edu", Status = "Active" },
                    new Branch { BranchName = "West Campus", BranchCode = "WEST", Address = "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081", Phone = "+91 9123456789", Email = "west@pirnavschools.edu", Status = "Active" }
                };
                _context.Branches.AddRange(defaults);
                await _context.SaveChangesAsync();
            }
        }

        // GET: api/Branches
        [HttpGet]
        public async Task<IActionResult> GetBranches()
        {
            await EnsureDefaultBranchesAsync();
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

            return Ok(new { success = true, data = list });
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
                Address = dto.Address ?? "",
                Phone = dto.Phone ?? "",
                Email = dto.Email ?? "",
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status
            };

            _context.Branches.Add(b);
            await _context.SaveChangesAsync();

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
            if (dto.Address != null) b.Address = dto.Address;
            if (dto.Phone != null) b.Phone = dto.Phone;
            if (dto.Email != null) b.Email = dto.Email;
            if (!string.IsNullOrWhiteSpace(dto.Status)) b.Status = dto.Status;

            await _context.SaveChangesAsync();

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

            return Ok(new { success = true, message = "Campus branch deleted successfully." });
        }
    }
}
