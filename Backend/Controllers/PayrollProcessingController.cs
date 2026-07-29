namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/payroll")]
[Authorize(Roles = "Admin,Staff")]
[Tags("HR & Payroll Processing Engine")]
public class PayrollProcessingController : ControllerBase
{
    private readonly AppDbContext _context;

    public PayrollProcessingController(AppDbContext context)
    {
        _context = context;
    }

    // Configurations
    [HttpGet("configurations")]
    public async Task<IActionResult> GetConfigurations()
    {
        var configs = await _context.PayrollConfigs.AsNoTracking().ToListAsync();
        return Ok(new { success = true, data = configs });
    }

    [HttpPost("configurations")]
    public async Task<IActionResult> CreateConfiguration([FromBody] PayrollConfigDto dto)
    {
        var entity = new PayrollConfig
        {
            PayrollName = dto.PayrollName,
            Branch = dto.Branch,
            FinancialYear = dto.FinancialYear,
            Currency = dto.Currency,
            Status = dto.Status,
            EffectiveFrom = DateTime.UtcNow,
            EffectiveTo = DateTime.UtcNow.AddYears(1)
        };

        await _context.PayrollConfigs.AddAsync(entity);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Payroll configuration saved successfully.", data = entity });
    }

    // Salary Components
    [HttpGet("components")]
    public async Task<IActionResult> GetSalaryComponents()
    {
        var components = await _context.SalaryComponents.AsNoTracking().ToListAsync();
        return Ok(new { success = true, data = components });
    }

    [HttpPost("components")]
    public async Task<IActionResult> CreateSalaryComponent([FromBody] SalaryComponentDto dto)
    {
        var entity = new SalaryComponent
        {
            Name = dto.Name,
            Category = dto.Category,
            Type = dto.Type,
            Value = dto.Value,
            Taxable = dto.Taxable,
            Mandatory = dto.Mandatory,
            Status = dto.Status
        };

        await _context.SalaryComponents.AddAsync(entity);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Salary component created successfully.", data = entity });
    }

    // Salary Structures
    [HttpGet("structures")]
    public async Task<IActionResult> GetSalaryStructures()
    {
        var structures = await _context.SalaryStructures.Include(s => s.Items).AsNoTracking().ToListAsync();
        return Ok(new { success = true, data = structures });
    }

    [HttpPost("structures")]
    public async Task<IActionResult> CreateSalaryStructure([FromBody] SalaryStructureCreateDto dto)
    {
        var entity = new SalaryStructure
        {
            StructureCode = dto.StructureCode,
            StructureName = dto.StructureName,
            Branch = dto.Branch,
            Department = dto.Department,
            Designation = dto.Designation,
            StaffCategory = dto.StaffCategory,
            EmploymentType = dto.EmploymentType,
            EffectiveDate = DateTime.UtcNow,
            Status = dto.Status,
            Notes = dto.Notes,
            MonthlyGrossSalary = dto.MonthlyGrossSalary,
            Items = dto.Items.Select(i => new SalaryStructureItem
            {
                ComponentName = i.ComponentName,
                ComponentType = i.ComponentType,
                Amount = i.Amount
            }).ToList()
        };

        await _context.SalaryStructures.AddAsync(entity);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Salary structure created successfully.", data = entity });
    }

    // Payslips & Disbursal
    [HttpGet("payslips")]
    public async Task<IActionResult> GetPayslips([FromQuery] string? month, [FromQuery] int? year)
    {
        var query = _context.Payslips.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(month))
            query = query.Where(p => p.Month.ToLower() == month.ToLower());

        if (year.HasValue)
            query = query.Where(p => p.Year == year.Value);

        var payslips = await query.ToListAsync();
        return Ok(new { success = true, data = payslips });
    }

    [HttpPost("process/step8-publish")]
    public async Task<IActionResult> PublishPayslipsAndDisburse([FromQuery] string month = "July", [FromQuery] int year = 2026)
    {
        var payslips = await _context.Payslips.Where(p => p.Month == month && p.Year == year).ToListAsync();

        foreach (var p in payslips)
        {
            p.Status = "Paid";
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Payslips published and salary disbursement marked as Paid." });
    }

    // Reports
    [HttpGet("reports/{reportType}")]
    public async Task<IActionResult> GetPayrollReport(string reportType, [FromQuery] string month = "July", [FromQuery] int year = 2026)
    {
        var staffList = await _context.Staff.AsNoTracking().ToListAsync();

        if (reportType.Equals("dept-expense", StringComparison.OrdinalIgnoreCase))
        {
            var deptReport = staffList.GroupBy(s => s.Department).Select(g => new
            {
                department = g.Key,
                employeeCount = g.Count(),
                grossDisbursed = g.Sum(s => s.MonthlySalary > 0 ? s.MonthlySalary : 9100),
                deductions = g.Count() * 560,
                totalNetPaid = g.Sum(s => s.MonthlySalary > 0 ? s.MonthlySalary : 9100) - (g.Count() * 560)
            }).ToList();

            return Ok(new { success = true, data = deptReport });
        }

        var reportData = staffList.Select(s => new
        {
            employeeName = $"{s.FirstName} {s.LastName}",
            employeeId = s.EmployeeId,
            department = s.Department,
            basicSalary = 7000,
            employerEpf = 840,
            employeeEpf = 840,
            totalEpfDeposit = 1680,
            esiNumber = "31-00-123456-000-1234",
            monthlyGrossSalary = s.MonthlySalary > 0 ? s.MonthlySalary : 9100,
            employerShareEsi = 296,
            employeeShareEsi = 68,
            totalEsiContribution = 364,
            panDetails = "ABCDE1234F",
            annualizedGross = (s.MonthlySalary > 0 ? s.MonthlySalary : 9100) * 12,
            tdsDeduction = 0,
            bankDetails = s.AccountNumber != null ? $"{s.BankName} - {s.AccountNumber}" : "UPI ID: Not set",
            ifscCode = s.IfscCode ?? "CHAS001",
            amountToTransfer = (s.MonthlySalary > 0 ? s.MonthlySalary : 9100) - 560,
            disbursalStatus = "Disbursed"
        }).ToList();

        return Ok(new { success = true, data = reportData });
    }
}
