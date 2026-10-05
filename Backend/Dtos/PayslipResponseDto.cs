namespace SMS.Api.Dtos;

public class PayslipResponseDto
{
    public string Id { get; set; } = string.Empty;
    public int PayslipId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string EmpId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string? Branch { get; set; } = "Main Campus";
    public string? Department { get; set; } = string.Empty;
    public string? Designation { get; set; } = string.Empty;
    public string? EmployeeCategory { get; set; } = "Teaching Staff";
    public string Month { get; set; } = "July";
    public int Year { get; set; } = 2026;
    public decimal BasicSalary { get; set; }
    public decimal Hra { get; set; }
    public decimal Da { get; set; }
    public decimal HouseRentAllowance { get; set; }
    public decimal DearnessAllowance { get; set; }
    public decimal GrossSalary { get; set; }
    public decimal GrossEarnings { get; set; }
    public decimal OtherDeductions { get; set; }
    public decimal TotalDeductions { get; set; }
    public decimal PfDeduction { get; set; }
    public decimal ProvidentFund { get; set; }
    public decimal Esi { get; set; }
    public decimal LeaveDeduction { get; set; }
    public decimal LopDeduction { get; set; }
    public decimal NetSalary { get; set; }
    public decimal NetPay { get; set; }
    public string? BankAccount { get; set; }
    public string? DisbursedDate { get; set; }
    public string? PaymentDate { get; set; }
    public string PanNumber { get; set; } = string.Empty;
    public string PfNumber { get; set; } = string.Empty;
    public string EsiNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "Generated";
    public object? Earnings { get; set; }
    public object? Deductions { get; set; }
    public object? LeaveDetails { get; set; }
}

public class PayslipCreateDto
{
    public string? EmployeeId { get; set; }
    public string? EmpId { get; set; }
    public string? EmployeeName { get; set; }
    public string? Branch { get; set; }
    public string? Department { get; set; }
    public string? Designation { get; set; }
    public string? EmployeeCategory { get; set; }
    public string? Month { get; set; }
    public int? Year { get; set; }
    public decimal? BasicSalary { get; set; }
    public decimal? Hra { get; set; }
    public decimal? Da { get; set; }
    public decimal? HouseRentAllowance { get; set; }
    public decimal? DearnessAllowance { get; set; }
    public decimal? GrossSalary { get; set; }
    public decimal? GrossEarnings { get; set; }
    public decimal? OtherDeductions { get; set; }
    public decimal? TotalDeductions { get; set; }
    public decimal? PfDeduction { get; set; }
    public decimal? ProvidentFund { get; set; }
    public decimal? Esi { get; set; }
    public decimal? LeaveDeduction { get; set; }
    public decimal? LopDeduction { get; set; }
    public decimal? NetSalary { get; set; }
    public decimal? NetPay { get; set; }
    public string? BankAccount { get; set; }
    public string? DisbursedDate { get; set; }
    public string? PaymentDate { get; set; }
    public string? PanNumber { get; set; }
    public string? PfNumber { get; set; }
    public string? EsiNumber { get; set; }
    public string? Status { get; set; }
    public object? Earnings { get; set; }
    public object? Deductions { get; set; }
    public object? LeaveDetails { get; set; }
}
