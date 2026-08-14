using System;
using System.Security.Claims;

namespace SMS.Api.Helpers;

public static class ClaimsPrincipalExtensions
{
    public static int? GetStaffId(this ClaimsPrincipal principal)
    {
        if (principal == null) return null;

        var claimValue = principal.FindFirst("StaffId")?.Value 
                      ?? principal.FindFirst("staff_id")?.Value
                      ?? principal.FindFirst("staffId")?.Value;

        if (!string.IsNullOrEmpty(claimValue) && int.TryParse(claimValue, out int staffId))
        {
            return staffId;
        }

        return null;
    }

    public static int? GetUserId(this ClaimsPrincipal principal)
    {
        if (principal == null) return null;

        var claimValue = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? principal.FindFirst("sub")?.Value
                      ?? principal.FindFirst("UserId")?.Value
                      ?? principal.FindFirst("userId")?.Value;

        if (!string.IsNullOrEmpty(claimValue) && int.TryParse(claimValue, out int userId))
        {
            return userId;
        }

        return null;
    }

    public static string? GetEmail(this ClaimsPrincipal principal)
    {
        if (principal == null) return null;

        return principal.FindFirst(ClaimTypes.Email)?.Value
            ?? principal.FindFirst("email")?.Value;
    }

    public static string? GetRole(this ClaimsPrincipal principal)
    {
        if (principal == null) return null;

        return principal.FindFirst(ClaimTypes.Role)?.Value
            ?? principal.FindFirst("role")?.Value;
    }
}
