using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Finbuckle.MultiTenant;
using SMS.Api.Models;

namespace SMS.Api.Middleware
{
    public class TenantActiveValidationMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantActiveValidationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var tenantAccessor = context.RequestServices.GetService<IMultiTenantContextAccessor<AppTenantInfo>>();
            var tenant = tenantAccessor?.MultiTenantContext?.TenantInfo;

            if (tenant != null)
            {
                var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;
                bool isSuperAdminOrPublicRoute =
                    path.StartsWith("/api/superadmin") ||
                    path.StartsWith("/swagger") ||
                    path.StartsWith("/api/tenant/info") ||
                    path.StartsWith("/api/tenant/current");

                if (!isSuperAdminOrPublicRoute && !tenant.IsActive)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsJsonAsync(new
                    {
                        error = "TenantInactive",
                        message = $"Client company '{tenant.CompanyName}' is currently deactivated or suspended. Please contact the system Super Admin.",
                        tenantId = tenant.Id,
                        identifier = tenant.Identifier
                    });
                    return;
                }
            }

            await _next(context);
        }
    }
}
