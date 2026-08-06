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

    // =========================================================
    // SALARY STRUCTURES API
    // =========================================================

    [HttpGet("salary-structures")]
    public async Task<IActionResult> GetSalaryStructures()
    {
        var list = await _context.SalaryStructures
            .Include(s => s.Items)
            .AsNoTracking()
            .ToListAsync();
        return Ok(new { success = true, data = list.Select(MapStructureToDto).ToList() });
    }

    [HttpPost("salary-structures")]
    public async Task<IActionResult> CreateSalaryStructure([FromBody] SalaryStructureCreateDto dto)
    {
        var s = new SalaryStructure
        {
            StructureCode = "SAL-STR-" + DateTime.UtcNow.Ticks.ToString().Substring(12),
            StructureName = dto.StructureName,
            StaffCategory = dto.EmployeeCategory,
            Branch = dto.Branch,
            Department = dto.Department,
            Designation = dto.Designation,
            EmploymentType = dto.EmploymentType,
            EffectiveDate = ParseEffectiveDate(dto.EffectiveDate),
            Status = dto.Status,
            Notes = dto.Notes,
            MonthlyGrossSalary = dto.GrossSalary,
            PayrollFrequency = dto.PayrollFrequency,
            SalaryPaymentDay = dto.SalaryPaymentDay,
            PfApplicable = dto.PfApplicable,
            PfPercentage = dto.PfPercentage,
            EsiApplicable = dto.EsiApplicable,
            EsiPercentage = dto.EsiPercentage,
            ProfessionalTaxApplicable = dto.ProfessionalTaxApplicable,
            ProfessionalTaxAmount = dto.ProfessionalTaxAmount,
            RoundOffRule = dto.RoundOffRule
        };

        if (dto.Earnings != null)
        {
            foreach (var item in dto.Earnings)
            {
                s.Items.Add(new SalaryStructureItem { ComponentName = item.Name, ComponentType = "Earning", Amount = item.Amount });
            }
        }
        if (dto.Deductions != null)
        {
            foreach (var item in dto.Deductions)
            {
                s.Items.Add(new SalaryStructureItem { ComponentName = item.Name, ComponentType = "Deduction", Amount = item.Amount });
            }
        }

        await _context.SalaryStructures.AddAsync(s);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Salary structure created successfully.", data = MapStructureToDto(s) });
    }

    [HttpPut("salary-structures/{id:int}")]
    public async Task<IActionResult> UpdateSalaryStructure(int id, [FromBody] SalaryStructureCreateDto dto)
    {
        var s = await _context.SalaryStructures
            .Include(s => s.Items)
            .FirstOrDefaultAsync(item => item.StructureId == id);
            
        if (s == null) return NotFound(new { success = false, message = "Salary structure not found." });

        s.StructureName = dto.StructureName;
        s.StaffCategory = dto.EmployeeCategory;
        s.Branch = dto.Branch;
        s.Department = dto.Department;
        s.Designation = dto.Designation;
        s.EmploymentType = dto.EmploymentType;
        s.EffectiveDate = ParseEffectiveDate(dto.EffectiveDate);
        s.Status = dto.Status;
        s.Notes = dto.Notes;
        s.MonthlyGrossSalary = dto.GrossSalary;
        s.PayrollFrequency = dto.PayrollFrequency;
        s.SalaryPaymentDay = dto.SalaryPaymentDay;
        s.PfApplicable = dto.PfApplicable;
        s.PfPercentage = dto.PfPercentage;
        s.EsiApplicable = dto.EsiApplicable;
        s.EsiPercentage = dto.EsiPercentage;
        s.ProfessionalTaxApplicable = dto.ProfessionalTaxApplicable;
        s.ProfessionalTaxAmount = dto.ProfessionalTaxAmount;
        s.RoundOffRule = dto.RoundOffRule;

        _context.SalaryStructureItems.RemoveRange(s.Items);
        s.Items.Clear();

        if (dto.Earnings != null)
        {
            foreach (var item in dto.Earnings)
            {
                s.Items.Add(new SalaryStructureItem { ComponentName = item.Name, ComponentType = "Earning", Amount = item.Amount });
            }
        }
        if (dto.Deductions != null)
        {
            foreach (var item in dto.Deductions)
            {
                s.Items.Add(new SalaryStructureItem { ComponentName = item.Name, ComponentType = "Deduction", Amount = item.Amount });
            }
        }

        await _context.SaveChangesAsync();

        // Update active assignments and staff properties dynamically
        var (basic, allowances, deductions) = CalculateBreakdown(s);
        var activeAssignments = await _context.EmployeeSalaryAssignments
            .Where(a => a.StructureId == id && a.Status == "Active")
            .ToListAsync();

        foreach (var assignment in activeAssignments)
        {
            if (assignment.SalaryOverride) continue;

            var staff = await _context.Staff.FindAsync(assignment.StaffId);
            if (staff != null)
            {
                staff.GrossSalary = s.MonthlyGrossSalary;
                staff.NetSalary = Math.Max(0, s.MonthlyGrossSalary - deductions);
                staff.SalaryStructureName = s.StructureName;
            }
        }
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Salary structure updated successfully.", data = MapStructureToDto(s) });
    }

    [HttpDelete("salary-structures/{id:int}")]
    public async Task<IActionResult> DeleteSalaryStructure(int id)
    {
        var s = await _context.SalaryStructures.FindAsync(id);
        if (s == null) return NotFound(new { success = false, message = "Salary structure not found." });

        var activeAssignments = await _context.EmployeeSalaryAssignments
            .Where(a => a.StructureId == id && a.Status == "Active")
            .ToListAsync();

        foreach (var assignment in activeAssignments)
        {
            assignment.Status = "Inactive";
            var staff = await _context.Staff.FindAsync(assignment.StaffId);
            if (staff != null)
            {
                staff.SalaryStructureId = null;
                staff.SalaryStructureName = null;
                staff.SalaryStructureEffectiveDate = null;
                staff.GrossSalary = 0;
                staff.NetSalary = 0;
            }
        }

        _context.SalaryStructures.Remove(s);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Salary structure deleted successfully." });
    }

    [HttpPost("salary-structures/{id:int}/clone")]
    public async Task<IActionResult> CloneSalaryStructure(int id)
    {
        var source = await _context.SalaryStructures
            .Include(s => s.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.StructureId == id);

        if (source == null) return NotFound(new { success = false, message = "Salary structure not found." });

        var clone = new SalaryStructure
        {
            StructureCode = "SAL-STR-" + DateTime.UtcNow.Ticks.ToString().Substring(12),
            StructureName = $"{source.StructureName} Copy",
            StaffCategory = source.StaffCategory,
            Branch = source.Branch,
            Department = source.Department,
            Designation = source.Designation,
            EmploymentType = source.EmploymentType,
            EffectiveDate = DateTime.UtcNow.Date,
            Status = "Inactive",
            Notes = source.Notes,
            MonthlyGrossSalary = source.MonthlyGrossSalary,
            PayrollFrequency = source.PayrollFrequency,
            SalaryPaymentDay = source.SalaryPaymentDay,
            PfApplicable = source.PfApplicable,
            PfPercentage = source.PfPercentage,
            EsiApplicable = source.EsiApplicable,
            EsiPercentage = source.EsiPercentage,
            ProfessionalTaxApplicable = source.ProfessionalTaxApplicable,
            ProfessionalTaxAmount = source.ProfessionalTaxAmount,
            RoundOffRule = source.RoundOffRule
        };

        foreach (var item in source.Items)
        {
            clone.Items.Add(new SalaryStructureItem { ComponentName = item.ComponentName, ComponentType = item.ComponentType, Amount = item.Amount });
        }

        await _context.SalaryStructures.AddAsync(clone);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Salary structure cloned successfully.", data = MapStructureToDto(clone) });
    }

    // =========================================================
    // EMPLOYEE SALARY ASSIGNMENTS API
    // =========================================================

    [HttpGet("salary-assignments")]
    public async Task<IActionResult> GetSalaryAssignments()
    {
        var assignments = await _context.EmployeeSalaryAssignments
            .Include(a => a.Staff)
            .Include(a => a.Structure)
            .AsNoTracking()
            .ToListAsync();

        var list = assignments.Select(a => new EmployeeSalaryAssignmentDto
        {
            Id = a.AssignmentId.ToString(),
            EmployeeId = a.StaffId.ToString(),
            EmployeeName = a.Staff != null ? $"{a.Staff.FirstName} {a.Staff.LastName}" : "N/A",
            EmpId = a.Staff?.EmployeeId ?? "N/A",
            EmployeeCategory = a.Staff?.EmployeeCategory ?? "Teacher",
            Branch = a.Staff?.BranchName ?? "Main Campus",
            Department = a.Staff?.Department ?? "General",
            SalaryStructureId = a.StructureId.ToString(),
            SalaryStructureName = a.Structure?.StructureName ?? "Unassigned",
            EffectiveDate = a.EffectiveDate.ToString("yyyy-MM-dd"),
            Status = a.Status,
            MonthlyGross = a.Structure?.MonthlyGrossSalary ?? 0,
            PreviousGross = 0,
            AssignedDate = a.AssignedDate.ToString("yyyy-MM-dd"),
            Reason = a.Reason,
            SalaryOverride = a.SalaryOverride,
            OverrideBasicSalary = a.OverrideBasicSalary,
            OverrideAllowances = a.OverrideAllowances,
            OverrideDeductions = a.OverrideDeductions,
            OverrideNetSalary = a.OverrideNetSalary,
            UpdatedBy = a.UpdatedBy,
            UpdatedAt = a.UpdatedAt?.ToString("yyyy-MM-dd HH:mm")
        }).ToList();

        return Ok(new { success = true, data = list });
    }

    [HttpPost("salary-assignments")]
    public async Task<IActionResult> AssignSalaryStructure([FromBody] EmployeeSalaryAssignmentCreateDto dto)
    {
        int staffId = int.Parse(dto.EmployeeId);
        int structureId = int.Parse(dto.SalaryStructureId);

        var staff = await _context.Staff.FindAsync(staffId);
        if (staff == null) return NotFound(new { success = false, message = "Staff member not found." });

        var structure = await _context.SalaryStructures
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.StructureId == structureId);
        if (structure == null) return NotFound(new { success = false, message = "Salary structure not found." });

        // Deactivate previous active assignment
        var prevActive = await _context.EmployeeSalaryAssignments
            .Where(a => a.StaffId == staffId && a.Status == "Active")
            .FirstOrDefaultAsync();
        if (prevActive != null)
        {
            prevActive.Status = "Inactive";
        }

        var assignment = new EmployeeSalaryAssignment
        {
            StaffId = staffId,
            StructureId = structureId,
            Status = dto.Status,
            EffectiveDate = ParseEffectiveDate(dto.EffectiveDate),
            AssignedDate = DateTime.UtcNow.Date,
            Reason = dto.Reason,
            SalaryOverride = dto.SalaryOverride,
            OverrideBasicSalary = dto.OverrideBasicSalary,
            OverrideAllowances = dto.OverrideAllowances,
            OverrideDeductions = dto.OverrideDeductions,
            OverrideNetSalary = dto.OverrideNetSalary,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.EmployeeSalaryAssignments.AddAsync(assignment);

        // Update Staff details
        var (basic, allowances, deductions) = CalculateBreakdown(structure);
        decimal gross = dto.SalaryOverride ? (dto.OverrideBasicSalary ?? basic) + (dto.OverrideAllowances ?? allowances) : structure.MonthlyGrossSalary;
        decimal net = dto.SalaryOverride ? (dto.OverrideNetSalary ?? (gross - (dto.OverrideDeductions ?? deductions))) : Math.Max(0, structure.MonthlyGrossSalary - deductions);

        staff.SalaryStructureId = structureId;
        staff.SalaryStructureName = structure.StructureName;
        staff.SalaryStructureEffectiveDate = assignment.EffectiveDate;
        staff.GrossSalary = gross;
        staff.NetSalary = net;
        staff.MonthlySalary = gross; // Keep MonthlySalary in sync

        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Salary structure assigned successfully." });
    }

    private static (decimal basic, decimal allowances, decimal deductions) CalculateBreakdown(SalaryStructure structure)
    {
        decimal basic = 0;
        decimal allowances = 0;
        decimal deductions = 0;

        foreach (var item in structure.Items)
        {
            if (item.ComponentType.Equals("Earning", StringComparison.OrdinalIgnoreCase))
            {
                if (item.ComponentName.Equals("Basic Salary", StringComparison.OrdinalIgnoreCase) || 
                    item.ComponentName.Equals("Basic", StringComparison.OrdinalIgnoreCase))
                {
                    basic += item.Amount;
                }
                else
                {
                    allowances += item.Amount;
                }
            }
            else if (item.ComponentType.Equals("Deduction", StringComparison.OrdinalIgnoreCase))
            {
                deductions += item.Amount;
            }
        }

        return (basic, allowances, deductions);
    }

    private static SalaryStructureDto MapStructureToDto(SalaryStructure s) => new()
    {
        Id = s.StructureId.ToString(),
        StructureName = s.StructureName,
        EmployeeCategory = s.StaffCategory,
        Branch = s.Branch,
        Department = s.Department,
        Designation = s.Designation,
        EmploymentType = s.EmploymentType,
        EffectiveDate = s.EffectiveDate.ToString("yyyy-MM-dd"),
        Status = s.Status,
        Notes = s.Notes,
        GrossSalary = s.MonthlyGrossSalary,
        PayrollFrequency = s.PayrollFrequency,
        SalaryPaymentDay = s.SalaryPaymentDay,
        PfApplicable = s.PfApplicable,
        PfPercentage = s.PfPercentage,
        EsiApplicable = s.EsiApplicable,
        EsiPercentage = s.EsiPercentage,
        ProfessionalTaxApplicable = s.ProfessionalTaxApplicable,
        ProfessionalTaxAmount = s.ProfessionalTaxAmount,
        RoundOffRule = s.RoundOffRule,
        Earnings = s.Items.Where(i => i.ComponentType.Equals("Earning", StringComparison.OrdinalIgnoreCase))
            .Select(i => new PayrollAmountLineDto { Name = i.ComponentName, Amount = i.Amount })
            .ToList(),
        Deductions = s.Items.Where(i => i.ComponentType.Equals("Deduction", StringComparison.OrdinalIgnoreCase))
            .Select(i => new PayrollAmountLineDto { Name = i.ComponentName, Amount = i.Amount })
            .ToList()
    };

    private DateTime ParseEffectiveDate(string? dateStr)
    {
        if (string.IsNullOrEmpty(dateStr)) return DateTime.UtcNow.Date;
        if (DateTime.TryParse(dateStr, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var d1)) return d1;
        if (DateTime.TryParse(dateStr, out var d2)) return d2;
        return DateTime.UtcNow.Date;
    }
}
