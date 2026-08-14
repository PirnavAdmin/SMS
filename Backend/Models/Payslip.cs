namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class Payslip
{
    [Key]
    public int PayslipId { get; set; }

    [Required]
    public string EmployeeId { get; set; } = string.Empty;

    [Required]
    public string EmployeeName { get; set; } = string.Empty;

    public string Department { get; set; } = "Academics";

    public string Designation { get; set; } = "Teacher";

    public string Month { get; set; } = "July";

    public int Year { get; set; } = 2026;

    public decimal BasicSalary { get; set; } = 7000;
    public decimal HouseRentAllowance { get; set; } = 1400;
    public decimal DearnessAllowance { get; set; } = 700;
    public decimal GrossEarnings { get; set; } = 9100;

    public decimal ProvidentFund { get; set; } = 560;
    public decimal Esi { get; set; } = 0;
    public decimal TotalDeductions { get; set; } = 560;

    public decimal NetPay { get; set; } = 8540;

    public string PanNumber { get; set; } = "ABCDE1234F";
    public string PfNumber { get; set; } = "MH/BAN/0012345/000/0000123";
    public string EsiNumber { get; set; } = "31-00-123456-000-1234";

    public string Status { get; set; } = "Generated";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
