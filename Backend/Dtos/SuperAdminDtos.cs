using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos;

// --- School DTOs ---

public class SchoolCreateDto
{
    [Required]
    [MaxLength(200)]
    public string SchoolName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string SchoolCode { get; set; } = string.Empty;

    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? PrincipalName { get; set; }
}

public class SchoolUpdateDto
{
    [Required]
    [MaxLength(200)]
    public string SchoolName { get; set; } = string.Empty;

    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? PrincipalName { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active"; // Active, Inactive
}

public class SchoolResponseDto
{
    public int SchoolId { get; set; }
    public string SchoolName { get; set; } = string.Empty;
    public string SchoolCode { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? PrincipalName { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public int AdminsCount { get; set; }
    public int TeachersCount { get; set; }
    public int StudentsCount { get; set; }
    public int ParentsCount { get; set; }
    public int StaffCount { get; set; }
    public int TotalUsersCount { get; set; }
}

public class SchoolUsersSummaryDto
{
    public int SchoolId { get; set; }
    public string SchoolName { get; set; } = string.Empty;
    public string SchoolCode { get; set; } = string.Empty;
    public int AdminsCount { get; set; }
    public int TeachersCount { get; set; }
    public int StudentsCount { get; set; }
    public int ParentsCount { get; set; }
    public int StaffCount { get; set; }
    public int TotalUsers { get; set; }
}

// --- Admin Management DTOs ---

public class AdminCreateDto
{
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Phone]
    [MaxLength(20)]
    public string MobileNumber { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public int SchoolId { get; set; }
}

public class AdminUpdateDto
{
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Phone]
    [MaxLength(20)]
    public string MobileNumber { get; set; } = string.Empty;

    public int? AssignedSchoolId { get; set; }
}

public class AdminResponseDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public int? SchoolId { get; set; }
    public string? SchoolName { get; set; }
    public string Role { get; set; } = "Admin";
    public DateTime CreatedAt { get; set; }
}

// --- Dashboard DTOs ---

public class SuperAdminDashboardSummaryDto
{
    public int TotalSchools { get; set; }
    public int ActiveSchools { get; set; }
    public int InactiveSchools { get; set; }
    public int TotalAdmins { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalStudents { get; set; }
    public int TotalParents { get; set; }
    public int TotalStaff { get; set; }
    public int TotalUsers { get; set; }
    public List<SchoolResponseDto> RecentSchools { get; set; } = new();
    public List<GrowthAnalyticsDto> GrowthAnalytics { get; set; } = new();
    public List<SchoolUsersSummaryDto> SchoolWiseUserStats { get; set; } = new();
    public object RevenuePlaceholder { get; set; } = new { Value = 0, Status = "Placeholder" };
    public object SubscriptionPlaceholder { get; set; } = new { PlanName = "Enterprise Plan", Price = 0.00 };
    public object SystemHealthSummary { get; set; } = new { ServerStatus = "Online", DatabaseConnection = "Healthy", DiskUsage = "28%" };
}

public class GrowthAnalyticsDto
{
    public string Month { get; set; } = string.Empty; // e.g. "Jan", "Feb"
    public int Count { get; set; }
}

public class UserStatisticsDto
{
    public int TotalUsers { get; set; }
    public int TeachersCount { get; set; }
    public int StudentsCount { get; set; }
    public int ParentsCount { get; set; }
    public int StaffCount { get; set; }
    public List<SchoolUsersSummaryDto> SchoolWiseCounts { get; set; } = new();
}

// --- Audit & Monitoring DTOs ---

public class AuditLogResponseDto
{
    public int AuditLogId { get; set; }
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserRole { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; }
    public int? SchoolId { get; set; }
    public string? SchoolName { get; set; }
}

public class SystemNotificationResponseDto
{
    public int NotificationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? SchoolId { get; set; }
    public string? SchoolName { get; set; }
}


// --- Super Admin Account DTOs ---

public class SuperAdminCreateDto
{
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string MobileNumber { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
}

public class SuperAdminResponseDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string Role { get; set; } = "SuperAdmin";
    public DateTime CreatedAt { get; set; }
}

// --- Institution Registration with Customer Admin DTOs ---

public class InstitutionRegisterDto
{
    [Required(ErrorMessage = "School / Institution Name is required")]
    [MaxLength(200, ErrorMessage = "School Name cannot exceed 200 characters")]
    [MinLength(3, ErrorMessage = "School Name must be at least 3 characters")]
    public string SchoolName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Account Subdomain Code is required")]
    [MaxLength(50, ErrorMessage = "Subdomain Code cannot exceed 50 characters")]
    [MinLength(3, ErrorMessage = "Subdomain Code must be at least 3 characters")]
    [RegularExpression(@"^[a-z0-9]+(-[a-z0-9]+)*$", ErrorMessage = "Subdomain must contain only lowercase alphanumeric characters and hyphens (e.g., greenwood)")]
    public string SchoolCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Customer Admin Email is required")]
    [EmailAddress(ErrorMessage = "Please provide a valid email address")]
    [MaxLength(150, ErrorMessage = "Email cannot exceed 150 characters")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Initial Admin Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    public string Password { get; set; } = string.Empty;

    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? PrincipalName { get; set; }
    public string? Address { get; set; }
    public string? PlanName { get; set; }
    public string? PlanType { get; set; } = "Monthly";
    public string? Currency { get; set; } = "INR";
    public string? Language { get; set; } = "English";
    public string Status { get; set; } = "Active";
}

public class InstitutionRegisterResponseDto
{
    public SchoolResponseDto School { get; set; } = null!;
    public AdminResponseDto Admin { get; set; } = null!;
    public string LoginUrl { get; set; } = string.Empty;
    public string TemporaryPassword { get; set; } = string.Empty;
}

public class PackagePlanDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public decimal YearlyPrice { get; set; }
    public string Currency { get; set; } = "USD";
    public int MaxStudents { get; set; }
    public int MaxStaff { get; set; }
    public int MaxBranches { get; set; }
    public int StorageGb { get; set; }
    public bool IsPopular { get; set; }
    public string Status { get; set; } = "Active";
    public List<string> Features { get; set; } = new();
}

public class PlatformCompanyProfileDto
{
    public int Id { get; set; } = 1;
    public string CompanyName { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = string.Empty;
    public string SupportPhone { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public string PrimaryColor { get; set; } = "#0284c7";
    public DateTime? UpdatedAt { get; set; }
}
