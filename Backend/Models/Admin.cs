using System;
using System.Collections.Generic;

namespace SMS.Api.Models;

public class Admin
{
    public int AdminId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string MobileNumber { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public bool IsEmailVerified { get; set; } = false;
    public bool IsMobileVerified { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    
    public int? SchoolId { get; set; }
    public School? School { get; set; }

    public ICollection<Role> Roles { get; set; } = new List<Role>();
    public ICollection<OtpVerification> OtpVerifications { get; set; } = new List<OtpVerification>();
}
