namespace SMS.Api.Dtos;

public class PayrollRunDto
{
    public string? Id { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string EmpId { get; set; } = string.Empty;
    public string Branch { get; set; } = "Main Campus";
    public string Department { get; set; } = "General";
    public string EmployeeCategory { get; set; } = "Teacher";
    public string PayrollMonth { get; set; } = string.Empty;
    public decimal GrossSalary { get; set; }
    public decimal LeaveDeduction { get; set; }
    public decimal OtherDeductions { get; set; }
    public decimal NetSalary { get; set; }
    public string Status { get; set; } = "Pending";
    public string? SalaryStructureId { get; set; }
    public string? ConfigurationId { get; set; }
    public object? Earnings { get; set; }
    public object? Deductions { get; set; }
    public object? LeaveDetails { get; set; }
    public object? ManualAdjustments { get; set; }
    public string? Notes { get; set; }
    public string? ProcessedDate { get; set; }
    public string? LockedDate { get; set; }
    public string? PaymentDate { get; set; }
    public string? WorkflowStage { get; set; }
}
