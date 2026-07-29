namespace SMS.Api.Dtos;

public class PayslipResponseDto
{
    public int PayslipId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Month { get; set; } = "July";
    public int Year { get; set; } = 2026;
    public decimal BasicSalary { get; set; }
    public decimal HouseRentAllowance { get; set; }
    public decimal DearnessAllowance { get; set; }
    public decimal GrossEarnings { get; set; }
    public decimal ProvidentFund { get; set; }
    public decimal Esi { get; set; }
    public decimal TotalDeductions { get; set; }
    public decimal NetPay { get; set; }
    public string PanNumber { get; set; } = string.Empty;
    public string PfNumber { get; set; } = string.Empty;
    public string EsiNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "Generated";
}
