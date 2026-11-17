using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/superadmin/companies")]
    [Authorize(Roles = "SuperAdmin,Super Admin")]
    public class CompanyManagementController : ControllerBase
    {
        private readonly TenantStoreDbContext _tenantStore;
        private readonly AppDbContext _appDbContext;

        public CompanyManagementController(TenantStoreDbContext tenantStore, AppDbContext appDbContext)
        {
            _tenantStore = tenantStore;
            _appDbContext = appDbContext;
        }

        // =========================================================
        // 1. LIST ALL CLIENT COMPANIES
        // =========================================================
        [HttpGet]
        public async Task<ActionResult<List<CompanyResponseDto>>> GetCompanies([FromQuery] string? search, [FromQuery] bool? isActive)
        {
            var query = _tenantStore.AppTenants.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(t => t.CompanyName.ToLower().Contains(term) || t.Identifier.ToLower().Contains(term));
            }

            if (isActive.HasValue)
            {
                query = query.Where(t => t.IsActive == isActive.Value);
            }

            var tenants = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();

            // Fetch user counts across tenants using IgnoreQueryFilters
            var userCounts = await _appDbContext.Users
                .IgnoreQueryFilters()
                .Where(u => u.TenantId != null)
                .GroupBy(u => u.TenantId)
                .Select(g => new { TenantId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TenantId!, x => x.Count);

            var result = tenants.Select(t => new CompanyResponseDto
            {
                Id = t.Id,
                Identifier = t.Identifier,
                CompanyName = t.CompanyName,
                PrimaryColor = t.PrimaryColor,
                LogoUrl = t.LogoUrl,
                IsActive = t.IsActive,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                UsersCount = userCounts.TryGetValue(t.Id, out var count) ? count : 0
            }).ToList();

            return Ok(result);
        }

        // =========================================================
        // 2. GET COMPANY BY ID
        // =========================================================
        [HttpGet("{id}")]
        public async Task<ActionResult<CompanyResponseDto>> GetCompanyById(string id)
        {
            var tenant = await _tenantStore.AppTenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id || t.Identifier == id);
            if (tenant == null)
            {
                return NotFound(new { message = $"Company with ID or identifier '{id}' was not found." });
            }

            var userCount = await _appDbContext.Users
                .IgnoreQueryFilters()
                .CountAsync(u => u.TenantId == tenant.Id);

            return Ok(new CompanyResponseDto
            {
                Id = tenant.Id,
                Identifier = tenant.Identifier,
                CompanyName = tenant.CompanyName,
                PrimaryColor = tenant.PrimaryColor,
                LogoUrl = tenant.LogoUrl,
                IsActive = tenant.IsActive,
                CreatedAt = tenant.CreatedAt,
                UpdatedAt = tenant.UpdatedAt,
                UsersCount = userCount
            });
        }

        // =========================================================
        // 3. CREATE NEW CLIENT COMPANY
        // =========================================================
        [HttpPost]
        public async Task<ActionResult<CompanyResponseDto>> CreateCompany([FromBody] CreateCompanyDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var cleanIdentifier = dto.Identifier.Trim().ToLowerInvariant();

            // Validate uniqueness of identifier
            bool exists = await _tenantStore.AppTenants.AnyAsync(t => t.Identifier.ToLower() == cleanIdentifier);
            if (exists)
            {
                return Conflict(new { message = $"A company with identifier/subdomain '{cleanIdentifier}' already exists." });
            }

            var tenant = new AppTenantInfo
            {
                Id = Guid.NewGuid().ToString("N"),
                Identifier = cleanIdentifier,
                Name = dto.CompanyName.Trim(),
                CompanyName = dto.CompanyName.Trim(),
                PrimaryColor = string.IsNullOrWhiteSpace(dto.PrimaryColor) ? "#0284c7" : dto.PrimaryColor.Trim(),
                LogoUrl = dto.LogoUrl?.Trim() ?? string.Empty,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            await _tenantStore.AppTenants.AddAsync(tenant);
            await _tenantStore.SaveChangesAsync();

            // Synchronize with Schools table
            var school = await _appDbContext.Schools.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.SchoolCode == cleanIdentifier.ToUpper());
            if (school == null)
            {
                school = new School
                {
                    SchoolName = dto.CompanyName.Trim(),
                    SchoolCode = cleanIdentifier.ToUpper(),
                    Status = dto.IsActive ? "Active" : "Inactive",
                    CreatedAt = DateTime.UtcNow
                };
                await _appDbContext.Schools.AddAsync(school);
                await _appDbContext.SaveChangesAsync();
            }

            // Optional: Create initial CompanyAdmin user
            if (!string.IsNullOrWhiteSpace(dto.AdminEmail) && !string.IsNullOrWhiteSpace(dto.AdminPassword))
            {
                var cleanEmail = dto.AdminEmail.Trim().ToLowerInvariant();
                var cleanMobile = dto.AdminMobile?.Trim() ?? string.Empty;

                var companyAdminUser = new User
                {
                    TenantId = tenant.Id,
                    SchoolId = school.SchoolId,
                    FullName = string.IsNullOrWhiteSpace(dto.AdminFullName) ? $"{tenant.CompanyName} Admin" : dto.AdminFullName.Trim(),
                    Email = cleanEmail,
                    MobileNumber = cleanMobile,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.AdminPassword),
                    Role = "CompanyAdmin",
                    IsEmailVerified = true,
                    IsMobileVerified = true,
                    CreatedAt = DateTime.UtcNow
                };

                var companyAdminRole = await _appDbContext.Roles.FirstOrDefaultAsync(r => r.RoleName == "CompanyAdmin" || r.RoleName == "Admin");
                if (companyAdminRole != null)
                {
                    companyAdminUser.Roles.Add(companyAdminRole);
                }

                await _appDbContext.Users.AddAsync(companyAdminUser);

                // Also populate Admin entity for full compatibility
                var adminEntity = new Admin
                {
                    FullName = companyAdminUser.FullName,
                    Email = cleanEmail,
                    MobileNumber = cleanMobile,
                    PasswordHash = companyAdminUser.PasswordHash,
                    Role = "Admin",
                    SchoolId = school.SchoolId,
                    TenantId = tenant.Id,
                    IsEmailVerified = true,
                    IsMobileVerified = true,
                    CreatedAt = DateTime.UtcNow
                };
                if (companyAdminRole != null) adminEntity.Roles.Add(companyAdminRole);
                await _appDbContext.Admins.AddAsync(adminEntity);

                await _appDbContext.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetCompanyById), new { id = tenant.Id }, new CompanyResponseDto
            {
                Id = tenant.Id,
                Identifier = tenant.Identifier,
                CompanyName = tenant.CompanyName,
                PrimaryColor = tenant.PrimaryColor,
                LogoUrl = tenant.LogoUrl,
                IsActive = tenant.IsActive,
                CreatedAt = tenant.CreatedAt,
                UsersCount = !string.IsNullOrWhiteSpace(dto.AdminEmail) ? 1 : 0
            });
        }

        // =========================================================
        // 4. UPDATE CLIENT COMPANY
        // =========================================================
        [HttpPut("{id}")]
        public async Task<ActionResult<CompanyResponseDto>> UpdateCompany(string id, [FromBody] UpdateCompanyDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenant = await _tenantStore.AppTenants.FirstOrDefaultAsync(t => t.Id == id);
            if (tenant == null)
            {
                return NotFound(new { message = $"Company with ID '{id}' was not found." });
            }

            if (!string.IsNullOrWhiteSpace(dto.Identifier) && !string.Equals(tenant.Identifier, dto.Identifier.Trim().ToLowerInvariant(), StringComparison.OrdinalIgnoreCase))
            {
                var newIdent = dto.Identifier.Trim().ToLowerInvariant();
                bool exists = await _tenantStore.AppTenants.AnyAsync(t => t.Id != id && t.Identifier.ToLower() == newIdent);
                if (exists) return Conflict(new { message = $"Identifier '{newIdent}' is already in use by another company." });
                tenant.Identifier = newIdent;
            }

            tenant.CompanyName = dto.CompanyName.Trim();
            tenant.Name = dto.CompanyName.Trim();
            if (dto.PrimaryColor != null) tenant.PrimaryColor = dto.PrimaryColor.Trim();
            if (dto.LogoUrl != null) tenant.LogoUrl = dto.LogoUrl.Trim();
            if (dto.IsActive.HasValue) tenant.IsActive = dto.IsActive.Value;
            tenant.UpdatedAt = DateTime.UtcNow;

            await _tenantStore.SaveChangesAsync();

            return Ok(new CompanyResponseDto
            {
                Id = tenant.Id,
                Identifier = tenant.Identifier,
                CompanyName = tenant.CompanyName,
                PrimaryColor = tenant.PrimaryColor,
                LogoUrl = tenant.LogoUrl,
                IsActive = tenant.IsActive,
                CreatedAt = tenant.CreatedAt,
                UpdatedAt = tenant.UpdatedAt
            });
        }

        // =========================================================
        // 5. TOGGLE ACTIVE STATUS FOR CLIENT COMPANY
        // =========================================================
        [HttpPatch("{id}/toggle-status")]
        public async Task<ActionResult<CompanyResponseDto>> ToggleCompanyStatus(string id, [FromBody] ToggleCompanyStatusDto? dto = null)
        {
            var tenant = await _tenantStore.AppTenants.FirstOrDefaultAsync(t => t.Id == id);
            if (tenant == null)
            {
                return NotFound(new { message = $"Company with ID '{id}' was not found." });
            }

            tenant.IsActive = dto != null ? dto.IsActive : !tenant.IsActive;
            tenant.UpdatedAt = DateTime.UtcNow;

            await _tenantStore.SaveChangesAsync();

            return Ok(new CompanyResponseDto
            {
                Id = tenant.Id,
                Identifier = tenant.Identifier,
                CompanyName = tenant.CompanyName,
                PrimaryColor = tenant.PrimaryColor,
                LogoUrl = tenant.LogoUrl,
                IsActive = tenant.IsActive,
                CreatedAt = tenant.CreatedAt,
                UpdatedAt = tenant.UpdatedAt
            });
        }

        // =========================================================
        // 6. DELETE CLIENT COMPANY
        // =========================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(string id)
        {
            var tenant = await _tenantStore.AppTenants.FirstOrDefaultAsync(t => t.Id == id);
            if (tenant == null)
            {
                return NotFound(new { message = $"Company with ID '{id}' was not found." });
            }

            _tenantStore.AppTenants.Remove(tenant);
            await _tenantStore.SaveChangesAsync();

            return NoContent();
        }
    }
}
