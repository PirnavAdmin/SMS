namespace SMS.Api.Models.StaffManagement;

using System;
using System.ComponentModel.DataAnnotations;

public class LeaveTypeConfig
{
    [Key]
    public int LeaveTypeId { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty; // e.g. "Casual Leave", "Sick Leave", "Earned Leave"

    [Required]
    public string Code { get; set; } = string.Empty; // e.g. "CL", "SL", "EL"

    public int AnnualAllowance { get; set; } = 10;

    public bool CarryForward { get; set; } = false;

    public int MaxConsecutiveDays { get; set; } = 3;

    public bool RequiresAttachment { get; set; } = false;

    public bool IsPaid { get; set; } = true;

    public string Status { get; set; } = "Active"; // "Active", "Inactive"
}

