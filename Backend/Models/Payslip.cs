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

    public string? EmpId { get; set; }
    public string? EmployeeCategory { get; set; } = "Teaching Staff";
    public string? Branch { get; set; } = "Main Campus";

    public decimal LeaveDeduction { get; set; } = 0;
    public decimal LopDeduction { get; set; } = 0;

    public string? EarningsJson { get; set; }
    public string? DeductionsJson { get; set; }
    public string? LeaveDetailsJson { get; set; }

    public string? BankAccount { get; set; }
    public string? DisbursedDate { get; set; }
    public string? PaymentDate { get; set; }

    public string Status { get; set; } = "Generated";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public decimal GrossSalary
    {
        get => GrossEarnings;
        set => GrossEarnings = value;
    }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public decimal NetSalary
    {
        get => NetPay;
        set => NetPay = value;
    }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public decimal OtherDeductions
    {
        get => TotalDeductions;
        set => TotalDeductions = value;
    }
}
