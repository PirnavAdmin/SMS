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

        public TenantController(
            IMultiTenantContextAccessor<AppTenantInfo> tenantAccessor,
            TenantStoreDbContext tenantStore)
        {
            _tenantAccessor = tenantAccessor;
            _tenantStore = tenantStore;
        }

        [HttpGet("current")]
        [HttpGet("info")]
        public IActionResult GetCurrentTenant()
        {
            var tenant = _tenantAccessor.MultiTenantContext?.TenantInfo;
            if (tenant == null)
            {
                return Ok(new
                {
                    isResolved = false,
                    message = "No company tenant resolved from subdomain or X-Tenant-ID header."
                });
            }

            return Ok(new
            {
                isResolved = true,
                id = tenant.Id,
                identifier = tenant.Identifier,
                companyName = tenant.CompanyName,
                primaryColor = tenant.PrimaryColor,
                logoUrl = tenant.LogoUrl,
                isActive = tenant.IsActive
            });
        }

        [HttpGet("info/{identifier}")]
        public async Task<IActionResult> GetTenantByIdentifier(string identifier)
        {
            var clean = identifier.Trim().ToLowerInvariant();
            var tenant = await _tenantStore.AppTenants.AsNoTracking().FirstOrDefaultAsync(t => t.Identifier.ToLower() == clean || t.Id == clean);
            if (tenant == null)
            {
                return NotFound(new
                {
                    isResolved = false,
                    message = $"Company with identifier '{identifier}' not found."
                });
            }

            return Ok(new
            {
                isResolved = true,
                id = tenant.Id,
                identifier = tenant.Identifier,
                companyName = tenant.CompanyName,
                primaryColor = tenant.PrimaryColor,
                logoUrl = tenant.LogoUrl,
                isActive = tenant.IsActive
            });
        }
    }
}
