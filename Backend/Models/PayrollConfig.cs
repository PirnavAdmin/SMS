namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class PayrollConfig
{
    [Key]
    public int PayrollConfigId { get; set; }

    [Required]
    public string PayrollName { get; set; } = "Main Campus Payroll";

    public string Branch { get; set; } = "Main Campus";

    public string FinancialYear { get; set; } = "2026-2027";

    public string Currency { get; set; } = "INR";

    public string Status { get; set; } = "Active";

    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;

    public DateTime EffectiveTo { get; set; } = DateTime.UtcNow.AddYears(1);

    public string? LeaveRulesJson { get; set; }
    public string? AttendanceRulesJson { get; set; }
    public string? DeductionRulesJson { get; set; }
    public string? CycleJson { get; set; }
    public string? OvertimeJson { get; set; }
}
