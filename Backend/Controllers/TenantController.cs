using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Finbuckle.MultiTenant;
using SMS.Api.Data;
using SMS.Api.Models;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/tenant")]
    [AllowAnonymous]
    public class TenantController : ControllerBase
    {
        private readonly IMultiTenantContextAccessor<AppTenantInfo> _tenantAccessor;
        private readonly TenantStoreDbContext _tenantStore;
        private readonly AppDbContext _appDbContext;

        public TenantController(
            IMultiTenantContextAccessor<AppTenantInfo> tenantAccessor,
            TenantStoreDbContext tenantStore,
            AppDbContext appDbContext)
        {
            _tenantAccessor = tenantAccessor;
            _tenantStore = tenantStore;
            _appDbContext = appDbContext;
        }

        [HttpGet("current")]
        [HttpGet("info")]
        public async Task<IActionResult> GetCurrentTenant()
        {
            var tenant = _tenantAccessor.MultiTenantContext?.TenantInfo;
            if (tenant == null)
            {
                tenant = await _tenantStore.AppTenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == "tenant-default" || t.Identifier == "default");
                if (tenant == null)
                {
                    return Ok(new
                    {
                        isResolved = false,
                        message = "No company tenant resolved from subdomain or X-Tenant-ID header."
                    });
                }
            }

            // Always resolve effective school branding from SchoolSettings if configured
            var schoolSettings = await _appDbContext.SchoolSettings.AsNoTracking().FirstOrDefaultAsync();
            var effectiveName = !string.IsNullOrWhiteSpace(schoolSettings?.SchoolName)
                ? schoolSettings.SchoolName
                : (!string.IsNullOrWhiteSpace(tenant.CompanyName) ? tenant.CompanyName : "School Portal");
            var effectiveLogo = !string.IsNullOrWhiteSpace(schoolSettings?.LogoUrl)
                ? schoolSettings.LogoUrl
                : (tenant.LogoUrl ?? string.Empty);

            return Ok(new
            {
                isResolved = true,
                id = tenant.Id,
                identifier = tenant.Identifier,
                companyName = effectiveName,
                primaryColor = tenant.PrimaryColor ?? "#0284c7",
                logoUrl = effectiveLogo,
                isActive = tenant.IsActive
            });
        }

        [HttpGet("info/{identifier}")]
        public async Task<IActionResult> GetTenantByIdentifier(string identifier)
        {
            var clean = identifier.Trim().ToLowerInvariant();
            var tenant = await _tenantStore.AppTenants.AsNoTracking().FirstOrDefaultAsync(t => (t.Identifier != null && t.Identifier.ToLower() == clean) || t.Id == clean);
            if (tenant == null)
            {
                return NotFound(new
                {
                    isResolved = false,
                    message = $"Company with identifier '{identifier}' not found."
                });
            }

            // Always resolve effective school branding from SchoolSettings if configured
            var schoolSettings = await _appDbContext.SchoolSettings.AsNoTracking().FirstOrDefaultAsync();
            var effectiveName = !string.IsNullOrWhiteSpace(schoolSettings?.SchoolName)
                ? schoolSettings.SchoolName
                : (!string.IsNullOrWhiteSpace(tenant.CompanyName) ? tenant.CompanyName : identifier);
            var effectiveLogo = !string.IsNullOrWhiteSpace(schoolSettings?.LogoUrl)
                ? schoolSettings.LogoUrl
                : (tenant.LogoUrl ?? string.Empty);

            return Ok(new
            {
                isResolved = true,
                id = tenant.Id,
                identifier = tenant.Identifier,
                companyName = effectiveName,
                primaryColor = tenant.PrimaryColor ?? "#0284c7",
                logoUrl = effectiveLogo,
                isActive = tenant.IsActive
            });
        }
    }
}
