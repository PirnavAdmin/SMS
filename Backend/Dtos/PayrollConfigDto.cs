namespace SMS.Api.Dtos;

public class PayrollConfigDto
{
    public int PayrollConfigId { get; set; }
    public string? Id { get; set; }
    public string PayrollName { get; set; } = "Main Campus Payroll";
    public string Branch { get; set; } = "Main Campus";
    public string FinancialYear { get; set; } = "2026-2027";
    public string Currency { get; set; } = "INR";
    public string Status { get; set; } = "Active";
    public string EffectiveFrom { get; set; } = string.Empty;
    public string EffectiveTo { get; set; } = string.Empty;
    public object? LeaveRules { get; set; }
    public object? AttendanceRules { get; set; }
    public object? DeductionRules { get; set; }
    public object? Cycle { get; set; }
    public object? Overtime { get; set; }
}
