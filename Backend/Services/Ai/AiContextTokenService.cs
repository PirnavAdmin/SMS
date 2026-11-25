using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SMS.Api.Data;

namespace SMS.Api.Services.Ai;

public sealed class AiSecurityContextPayload
{
    [JsonPropertyName("user_id")]
    public int UserId { get; set; }

    [JsonPropertyName("user_name")]
    public string UserName { get; set; } = string.Empty;

    [JsonPropertyName("user_email")]
    public string UserEmail { get; set; } = string.Empty;

    [JsonPropertyName("raw_role")]
    public string RawRole { get; set; } = "Staff";

    [JsonPropertyName("role")]
    public string Role { get; set; } = "Staff";

    [JsonPropertyName("tenant_id")]
    public string TenantId { get; set; } = "tenant-default";

    [JsonPropertyName("school_id")]
    public int? SchoolId { get; set; }

    [JsonPropertyName("allowed_branch_ids")]
    public List<int> AllowedBranchIds { get; set; } = new();

    [JsonPropertyName("active_branch_id")]
    public int? ActiveBranchId { get; set; }

    [JsonPropertyName("active_branch_name")]
    public string? ActiveBranchName { get; set; }

    [JsonPropertyName("academic_year_id")]
    public int? AcademicYearId { get; set; }

    [JsonPropertyName("academic_year_name")]
    public string? AcademicYearName { get; set; }

    [JsonPropertyName("staff_id")]
    public int? StaffId { get; set; }

    [JsonPropertyName("student_id")]
    public int? StudentId { get; set; }

    [JsonPropertyName("linked_child_student_ids")]
    public List<int> LinkedChildStudentIds { get; set; } = new();

    [JsonPropertyName("assigned_class_ids")]
    public List<int> AssignedClassIds { get; set; } = new();

    [JsonPropertyName("assigned_section_ids")]
    public List<int> AssignedSectionIds { get; set; } = new();

    [JsonPropertyName("issued_at")]
    public long IssuedAt { get; set; }

    [JsonPropertyName("nonce")]
    public string Nonce { get; set; } = string.Empty;
}

public sealed class AiContextTokenService
{
    private const string DefaultDevSecret = "pirnav-dev-ai-bridge-hmac-secret-key-2026-32chars!";
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = null,
        WriteIndented = false,
    };

    private static readonly HashSet<string> ExecutiveRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Super Admin",
        "SuperAdmin",
        "Admin",
        "Principal",
    };

    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public AiContextTokenService(AppDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public string GetHmacSecret()
    {
        return _configuration["AiPlatform:HmacSecret"]
               ?? Environment.GetEnvironmentVariable("AI_CONTEXT_HMAC_SECRET")
               ?? DefaultDevSecret;
    }

    public static string NormalizeCanonicalRole(string? rawRole)
    {
        if (string.IsNullOrWhiteSpace(rawRole))
        {
            return "Staff";
        }

        var clean = string.Join(" ", rawRole.Trim().ToLowerInvariant()
            .Replace("_", " ")
            .Replace("-", " ")
            .Split(' ', StringSplitOptions.RemoveEmptyEntries));

        return clean switch
        {
            "superadmin" or "super admin" => "Super Admin",
            "admin" => "Admin",
            "principal" => "Principal",
            "teacher" or "faculty" or "class teacher" => "Teacher",
            "hr" => "HR",
            "accountant" or "finance" => "Accountant",
            "librarian" => "Librarian",
            "transport manager" or "transportmanager" or "transport" => "Transport Manager",
            "driver" or "bus driver" or "bus attendant" or "chauffeur" => "Driver",
            "hostel warden" or "hostelwarden" or "warden" => "Hostel Warden",
            "receptionist" => "Receptionist",
            "parent" => "Parent",
            "student" => "Student",
            _ => "Staff",
        };
    }

    public async Task<(AiSecurityContextPayload Payload, string SignedToken)> BuildVerifiedContextAsync(
        ClaimsPrincipal user,
        HttpRequest? httpRequest = null,
        int? requestedBranchId = null,
        string? requestedBranchName = null,
        int? requestedAcademicYearId = null,
        string? requestedAcademicYear = null)
    {
        var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? user.FindFirst("sub")?.Value;
        _ = int.TryParse(userIdStr, out var userId);

        var dbUser = userId > 0
            ? await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId)
            : null;

        var rawRole = dbUser?.Role
                      ?? user.FindFirst(ClaimTypes.Role)?.Value
                      ?? user.FindFirst("role")?.Value
                      ?? "Staff";
        var canonicalRole = NormalizeCanonicalRole(rawRole);

        var tenantId = dbUser?.TenantId
                       ?? user.FindFirst("TenantId")?.Value
                       ?? user.FindFirst("tenant")?.Value
                       ?? httpRequest?.Headers["X-Tenant-ID"].FirstOrDefault()
                       ?? "tenant-default";

        var userName = dbUser?.FullName
                       ?? user.FindFirst(ClaimTypes.Name)?.Value
                       ?? "ERP User";
        var userEmail = dbUser?.Email
                        ?? user.FindFirst(ClaimTypes.Email)?.Value
                        ?? string.Empty;

        int? schoolId = dbUser?.SchoolId;
        if (!schoolId.HasValue && int.TryParse(user.FindFirst("schoolId")?.Value, out var claimSchoolId))
        {
            schoolId = claimSchoolId;
        }

        // Resolve Staff entity from claim or matching user email/mobile
        int? staffId = null;
        if (int.TryParse(user.FindFirst("StaffId")?.Value ?? user.FindFirst("staff_id")?.Value, out var claimStaffId))
        {
            staffId = claimStaffId;
        }

        Models.Staff? staffRow = null;
        if (staffId.HasValue)
        {
            staffRow = await _db.Staff.AsNoTracking().FirstOrDefaultAsync(s => s.StaffId == staffId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(userEmail))
        {
            staffRow = await _db.Staff.AsNoTracking().FirstOrDefaultAsync(s => s.Email == userEmail);
            staffId = staffRow?.StaffId;
        }

        // Resolve branches permitted for this user
        var activeBranches = await _db.Branches.AsNoTracking()
            .Where(b => b.Status == "Active")
            .OrderBy(b => b.BranchId)
            .ToListAsync();

        var allowedBranchIds = new List<int>();
        if (!ExecutiveRoles.Contains(canonicalRole))
        {
            if (staffRow != null && !string.IsNullOrWhiteSpace(staffRow.BranchName))
            {
                var matched = activeBranches.FirstOrDefault(b =>
                    b.BranchName.Equals(staffRow.BranchName, StringComparison.OrdinalIgnoreCase) ||
                    b.BranchCode.Equals(staffRow.BranchName, StringComparison.OrdinalIgnoreCase));
                if (matched != null)
                {
                    allowedBranchIds.Add(matched.BranchId);
                }
            }
        }

        // Resolve student / linked children scopes
        int? studentId = null;
        var linkedChildren = new List<int>();
        if (canonicalRole == "Parent" && userId > 0)
        {
            linkedChildren = await _db.ParentStudentMappings.AsNoTracking()
                .Where(m => m.ParentUserId == userId && m.Status == "Active")
                .Select(m => m.StudentId)
                .Distinct()
                .ToListAsync();

            if (allowedBranchIds.Count == 0 && linkedChildren.Count > 0)
            {
                allowedBranchIds = await _db.Students.AsNoTracking()
                    .Where(s => linkedChildren.Contains(s.StudentId) && !s.IsDeleted)
                    .Select(s => s.BranchId)
                    .Distinct()
                    .ToListAsync();
            }
        }
        else if (canonicalRole == "Student")
        {
            if (int.TryParse(user.FindFirst("StudentId")?.Value ?? user.FindFirst("student_id")?.Value, out var claimStudentId))
            {
                studentId = claimStudentId;
            }
            else if (!string.IsNullOrWhiteSpace(userEmail))
            {
                var st = await _db.Students.AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Email == userEmail && !s.IsDeleted);
                if (st != null)
                {
                    studentId = st.StudentId;
                    if (!allowedBranchIds.Contains(st.BranchId))
                    {
                        allowedBranchIds.Add(st.BranchId);
                    }
                }
            }
        }

        // Resolve assigned classes for Teacher
        var assignedClassIds = new List<int>();
        if (canonicalRole == "Teacher" && staffId.HasValue)
        {
            var classIds1 = await _db.TeacherAssignments.AsNoTracking()
                .Where(t => t.TeacherId == staffId.Value && t.Status == "Active")
                .Select(t => t.ClassId)
                .ToListAsync();
            var classIds2 = await _db.TeacherSubjectAssignments.AsNoTracking()
                .Where(t => t.StaffId == staffId.Value)
                .Select(t => t.ClassId)
                .ToListAsync();
            assignedClassIds = classIds1.Concat(classIds2).Where(id => id > 0).Distinct().ToList();
        }

        // Resolve active branch context safely against authorized branches
        int? resolvedBranchId = requestedBranchId;
        string? resolvedBranchName = null;
        if (!resolvedBranchId.HasValue && int.TryParse(httpRequest?.Headers["X-Branch-ID"].FirstOrDefault(), out var hdrBranch))
        {
            resolvedBranchId = hdrBranch;
        }
        if (!resolvedBranchId.HasValue && !string.IsNullOrWhiteSpace(requestedBranchName))
        {
            var matched = activeBranches.FirstOrDefault(b =>
                b.BranchName.Equals(requestedBranchName, StringComparison.OrdinalIgnoreCase) ||
                b.BranchCode.Equals(requestedBranchName, StringComparison.OrdinalIgnoreCase));
            resolvedBranchId = matched?.BranchId;
        }
        if (resolvedBranchId.HasValue)
        {
            if (allowedBranchIds.Count > 0 && !allowedBranchIds.Contains(resolvedBranchId.Value))
            {
                resolvedBranchId = allowedBranchIds[0];
            }
            resolvedBranchName = activeBranches.FirstOrDefault(b => b.BranchId == resolvedBranchId.Value)?.BranchName;
        }
        else if (allowedBranchIds.Count > 0)
        {
            resolvedBranchId = allowedBranchIds[0];
            resolvedBranchName = activeBranches.FirstOrDefault(b => b.BranchId == resolvedBranchId.Value)?.BranchName;
        }

        // Resolve academic year
        var years = await _db.AcademicYears.AsNoTracking()
            .Where(y => !y.IsDeleted)
            .OrderByDescending(y => y.IsCurrent)
            .ThenByDescending(y => y.AcademicYearId)
            .ToListAsync();
        Models.AcademicYear? selectedYear = null;
        if (requestedAcademicYearId.HasValue)
        {
            selectedYear = years.FirstOrDefault(y => y.AcademicYearId == requestedAcademicYearId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(requestedAcademicYear))
        {
            selectedYear = years.FirstOrDefault(y =>
                y.AcademicYearName.Equals(requestedAcademicYear.Trim(), StringComparison.OrdinalIgnoreCase));
        }
        selectedYear ??= years.FirstOrDefault(y => y.IsCurrent) ?? years.FirstOrDefault();

        var payload = new AiSecurityContextPayload
        {
            UserId = userId > 0 ? userId : 1,
            UserName = userName,
            UserEmail = userEmail,
            RawRole = rawRole,
            Role = canonicalRole,
            TenantId = tenantId,
            SchoolId = schoolId,
            AllowedBranchIds = allowedBranchIds,
            ActiveBranchId = resolvedBranchId,
            ActiveBranchName = resolvedBranchName,
            AcademicYearId = selectedYear?.AcademicYearId,
            AcademicYearName = selectedYear?.AcademicYearName,
            StaffId = staffId,
            StudentId = studentId,
            LinkedChildStudentIds = linkedChildren,
            AssignedClassIds = assignedClassIds,
            AssignedSectionIds = new List<int>(),
            IssuedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            Nonce = Guid.NewGuid().ToString("N")[..12],
        };

        return (payload, SignPayload(payload, GetHmacSecret()));
    }

    public static string SignPayload(AiSecurityContextPayload payload, string secret)
    {
        var json = JsonSerializer.Serialize(payload, JsonOptions);
        var b64Body = Base64UrlEncode(Encoding.UTF8.GetBytes(json));
        var sig = ComputeHexHmac(b64Body, secret);
        return $"{b64Body}.{sig}";
    }

    public static bool TryVerifyToken(string? token, string secret, int maxAgeSeconds, out AiSecurityContextPayload? payload, out string error)
    {
        payload = null;
        error = string.Empty;
        if (string.IsNullOrWhiteSpace(token) || !token.Contains('.'))
        {
            error = "Missing or malformed X-AI-Context token.";
            return false;
        }

        var parts = token.Split('.', 2);
        var b64Body = parts[0];
        var providedSig = parts[1];
        var expectedSig = ComputeHexHmac(b64Body, secret);

        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(providedSig.ToLowerInvariant()),
                Encoding.ASCII.GetBytes(expectedSig.ToLowerInvariant())))
        {
            error = "Invalid X-AI-Context signature.";
            return false;
        }

        try
        {
            var rawBytes = Base64UrlDecode(b64Body);
            payload = JsonSerializer.Deserialize<AiSecurityContextPayload>(rawBytes);
        }
        catch (Exception ex)
        {
            error = $"Corrupt X-AI-Context payload: {ex.Message}";
            return false;
        }

        if (payload == null)
        {
            error = "Empty X-AI-Context payload.";
            return false;
        }

        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (payload.IssuedAt <= 0 || (now - payload.IssuedAt) > maxAgeSeconds || (payload.IssuedAt - now) > 30)
        {
            error = "Expired X-AI-Context token.";
            return false;
        }

        return true;
    }

    private static string ComputeHexHmac(string b64Body, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.ASCII.GetBytes(b64Body));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string Base64UrlEncode(byte[] bytes)
    {
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static byte[] Base64UrlDecode(string b64Url)
    {
        var padded = b64Url.Replace('-', '+').Replace('_', '/');
        var mod = padded.Length % 4;
        if (mod > 0)
        {
            padded = padded.PadRight(padded.Length + (4 - mod), '=');
        }
        return Convert.FromBase64String(padded);
    }
}
