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
[AllowAnonymous]
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
        var dtos = configs.Select(c => new PayrollConfigDto
        {
            PayrollConfigId = c.PayrollConfigId,
            Id = c.PayrollConfigId.ToString(),
            PayrollName = c.PayrollName,
            Branch = c.Branch,
            FinancialYear = c.FinancialYear,
            Currency = c.Currency,
            Status = c.Status,
            EffectiveFrom = c.EffectiveFrom.ToString("yyyy-MM-dd"),
            EffectiveTo = c.EffectiveTo.ToString("yyyy-MM-dd"),
            LeaveRules = !string.IsNullOrEmpty(c.LeaveRulesJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(c.LeaveRulesJson) : null,
            AttendanceRules = !string.IsNullOrEmpty(c.AttendanceRulesJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(c.AttendanceRulesJson) : null,
            DeductionRules = !string.IsNullOrEmpty(c.DeductionRulesJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(c.DeductionRulesJson) : null,
            Cycle = !string.IsNullOrEmpty(c.CycleJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(c.CycleJson) : null,
            Overtime = !string.IsNullOrEmpty(c.OvertimeJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(c.OvertimeJson) : null
        }).ToList();
        return Ok(new { success = true, data = dtos });
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
            EffectiveTo = DateTime.UtcNow.AddYears(1),
            LeaveRulesJson = dto.LeaveRules != null ? System.Text.Json.JsonSerializer.Serialize(dto.LeaveRules) : null,
            AttendanceRulesJson = dto.AttendanceRules != null ? System.Text.Json.JsonSerializer.Serialize(dto.AttendanceRules) : null,
            DeductionRulesJson = dto.DeductionRules != null ? System.Text.Json.JsonSerializer.Serialize(dto.DeductionRules) : null,
            CycleJson = dto.Cycle != null ? System.Text.Json.JsonSerializer.Serialize(dto.Cycle) : null,
            OvertimeJson = dto.Overtime != null ? System.Text.Json.JsonSerializer.Serialize(dto.Overtime) : null
        };

        await _context.PayrollConfigs.AddAsync(entity);
        await _context.SaveChangesAsync();

        dto.PayrollConfigId = entity.PayrollConfigId;
        dto.Id = entity.PayrollConfigId.ToString();
        return Ok(new { success = true, message = "Payroll configuration saved successfully.", data = dto });
    }

    [HttpPut("configurations/{id:int}")]
    public async Task<IActionResult> UpdateConfiguration(int id, [FromBody] PayrollConfigDto dto)
    {
        var entity = await _context.PayrollConfigs.FindAsync(id);
        if (entity == null) return NotFound(new { success = false, message = "Configuration not found." });

        entity.PayrollName = dto.PayrollName;
        entity.Branch = dto.Branch;
        entity.FinancialYear = dto.FinancialYear;
        entity.Currency = dto.Currency;
        entity.Status = dto.Status;
        entity.LeaveRulesJson = dto.LeaveRules != null ? System.Text.Json.JsonSerializer.Serialize(dto.LeaveRules) : null;
        entity.AttendanceRulesJson = dto.AttendanceRules != null ? System.Text.Json.JsonSerializer.Serialize(dto.AttendanceRules) : null;
        entity.DeductionRulesJson = dto.DeductionRules != null ? System.Text.Json.JsonSerializer.Serialize(dto.DeductionRules) : null;
        entity.CycleJson = dto.Cycle != null ? System.Text.Json.JsonSerializer.Serialize(dto.Cycle) : null;
        entity.OvertimeJson = dto.Overtime != null ? System.Text.Json.JsonSerializer.Serialize(dto.Overtime) : null;

        await _context.SaveChangesAsync();
        dto.PayrollConfigId = entity.PayrollConfigId;
        dto.Id = entity.PayrollConfigId.ToString();
        return Ok(new { success = true, message = "Payroll configuration updated successfully.", data = dto });
    }

    [HttpDelete("configurations/{id:int}")]
    public async Task<IActionResult> DeleteConfiguration(int id)
    {
        var entity = await _context.PayrollConfigs.FindAsync(id);
        if (entity == null) return NotFound(new { success = false, message = "Configuration not found." });

        _context.PayrollConfigs.Remove(entity);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Payroll configuration deleted successfully." });
    }

    [HttpPut("configurations/{id:int}/activate")]
    public async Task<IActionResult> ActivateConfiguration(int id)
    {
        var entity = await _context.PayrollConfigs.FindAsync(id);
        if (entity == null) return NotFound(new { success = false, message = "Configuration not found." });

        var others = await _context.PayrollConfigs
            .Where(c => c.Branch == entity.Branch && c.PayrollConfigId != id)
            .ToListAsync();
        foreach (var o in others)
        {
            o.Status = "Inactive";
        }

        entity.Status = "Active";
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Payroll configuration activated successfully." });
    }

    [HttpPut("configurations/{id:int}/deactivate")]
    public async Task<IActionResult> DeactivateConfiguration(int id)
    {
        var entity = await _context.PayrollConfigs.FindAsync(id);
        if (entity == null) return NotFound(new { success = false, message = "Configuration not found." });

        entity.Status = "Inactive";
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Payroll configuration deactivated successfully." });
    }

    // Salary Components
    [HttpGet("components")]
    public async Task<IActionResult> GetSalaryComponents()
    {
        var components = await _context.SalaryComponents.AsNoTracking().ToListAsync();
        var dtos = components.Select(c => new SalaryComponentDto
        {
            ComponentId = c.ComponentId,
            Id = c.ComponentId.ToString(),
            Name = c.Name,
            Category = c.Category,
            Type = c.Type,
            Value = c.Value,
            Taxable = c.Taxable,
            Mandatory = c.Mandatory,
            Status = c.Status
        }).ToList();
        return Ok(new { success = true, data = dtos });
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

        dto.ComponentId = entity.ComponentId;
        dto.Id = entity.ComponentId.ToString();
        return Ok(new { success = true, message = "Salary component created successfully.", data = dto });
    }

    [HttpPut("components/{id:int}")]
    public async Task<IActionResult> UpdateSalaryComponent(int id, [FromBody] SalaryComponentDto dto)
    {
        var entity = await _context.SalaryComponents.FindAsync(id);
        if (entity == null) return NotFound(new { success = false, message = "Component not found." });

        entity.Name = dto.Name;
        entity.Category = dto.Category;
        entity.Type = dto.Type;
        entity.Value = dto.Value;
        entity.Taxable = dto.Taxable;
        entity.Mandatory = dto.Mandatory;
        entity.Status = dto.Status;

        await _context.SaveChangesAsync();
        dto.ComponentId = entity.ComponentId;
        dto.Id = entity.ComponentId.ToString();
        return Ok(new { success = true, message = "Salary component updated successfully.", data = dto });
    }

    [HttpDelete("components/{id:int}")]
    public async Task<IActionResult> DeleteSalaryComponent(int id)
    {
        var entity = await _context.SalaryComponents.FindAsync(id);
        if (entity == null) return NotFound(new { success = false, message = "Component not found." });

        _context.SalaryComponents.Remove(entity);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Salary component deleted successfully." });
    }


    // Payslips & Disbursal
    [HttpGet("payslips")]
    public async Task<IActionResult> GetPayslips([FromQuery] string? month, [FromQuery] int? year)
    {
        var query = _context.Payslips.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(month))
        {
            var cleanMonth = month.Trim();
            var parts = cleanMonth.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var mName = parts[0];
            int? parsedYear = parts.Length > 1 && int.TryParse(parts[1], out var py) ? py : null;

            query = query.Where(p => p.Month.ToLower() == mName.ToLower());
            if (parsedYear.HasValue && !year.HasValue)
            {
                year = parsedYear;
            }
        }

        if (year.HasValue)
            query = query.Where(p => p.Year == year.Value);

        var payslips = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

        var dtos = payslips.Select(p => new PayslipResponseDto
        {
            Id = p.PayslipId.ToString(),
            PayslipId = p.PayslipId,
            EmployeeId = p.EmployeeId,
            EmpId = !string.IsNullOrEmpty(p.EmpId) ? p.EmpId : p.EmployeeId,
            EmployeeName = p.EmployeeName,
            Branch = p.Branch ?? "",
            Department = p.Department,
            Designation = p.Designation,
            EmployeeCategory = p.EmployeeCategory ?? "Teaching Staff",
            Month = $"{p.Month} {p.Year}".Trim(),
            Year = p.Year,
            BasicSalary = p.BasicSalary,
            Hra = p.HouseRentAllowance,
            Da = p.DearnessAllowance,
            HouseRentAllowance = p.HouseRentAllowance,
            DearnessAllowance = p.DearnessAllowance,
            GrossSalary = p.GrossEarnings,
            GrossEarnings = p.GrossEarnings,
            OtherDeductions = p.TotalDeductions,
            TotalDeductions = p.TotalDeductions,
            PfDeduction = p.ProvidentFund,
            ProvidentFund = p.ProvidentFund,
            Esi = p.Esi,
            LeaveDeduction = p.LeaveDeduction,
            LopDeduction = p.LopDeduction,
            NetSalary = p.NetPay,
            NetPay = p.NetPay,
            BankAccount = p.BankAccount ?? "N/A",
            DisbursedDate = p.DisbursedDate ?? p.CreatedAt.ToString("yyyy-MM-dd"),
            PaymentDate = p.PaymentDate ?? p.CreatedAt.ToString("yyyy-MM-dd"),
            PanNumber = p.PanNumber,
            PfNumber = p.PfNumber,
            EsiNumber = p.EsiNumber,
            Status = p.Status,
            Earnings = !string.IsNullOrEmpty(p.EarningsJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(p.EarningsJson) : null,
            Deductions = !string.IsNullOrEmpty(p.DeductionsJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(p.DeductionsJson) : null,
            LeaveDetails = !string.IsNullOrEmpty(p.LeaveDetailsJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(p.LeaveDetailsJson) : null
        }).ToList();

        return Ok(new { success = true, data = dtos });
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
            Branch = a.Staff?.BranchName ?? "",
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
        Staff? staff = null;
        if (int.TryParse(dto.EmployeeId, out int parsedStaffId))
        {
            staff = await _context.Staff.FindAsync(parsedStaffId);
        }
        if (staff == null && !string.IsNullOrEmpty(dto.EmpId))
        {
            staff = await _context.Staff.FirstOrDefaultAsync(s => s.EmployeeId == dto.EmpId);
        }
        if (staff == null && !string.IsNullOrEmpty(dto.EmployeeId))
        {
            staff = await _context.Staff.FirstOrDefaultAsync(s => s.EmployeeId == dto.EmployeeId);
        }
        if (staff == null && !string.IsNullOrEmpty(dto.EmployeeId))
        {
            var matchDigits = System.Text.RegularExpressions.Regex.Match(dto.EmployeeId, @"\d+");
            if (matchDigits.Success && int.TryParse(matchDigits.Value, out int extractedStaffId))
            {
                staff = await _context.Staff.FindAsync(extractedStaffId);
            }
        }
        if (staff == null && !string.IsNullOrEmpty(dto.EmployeeName))
        {
            var nameParts = dto.EmployeeName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            if (nameParts.Length > 0)
            {
                var fn = nameParts[0];
                var ln = nameParts.Length > 1 ? nameParts[1] : "";
                staff = await _context.Staff.FirstOrDefaultAsync(s =>
                    s.FirstName.ToLower() == fn.ToLower() &&
                    (string.IsNullOrEmpty(ln) || s.LastName.ToLower() == ln.ToLower()));
            }
        }

        if (staff == null) return NotFound(new { success = false, message = "Staff member not found." });

        SalaryStructure? structure = null;
        if (int.TryParse(dto.SalaryStructureId, out int parsedStructureId))
        {
            structure = await _context.SalaryStructures
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.StructureId == parsedStructureId);
        }
        if (structure == null && !string.IsNullOrEmpty(dto.SalaryStructureId))
        {
            var matchDigits = System.Text.RegularExpressions.Regex.Match(dto.SalaryStructureId, @"\d+");
            if (matchDigits.Success && int.TryParse(matchDigits.Value, out int numStructId))
            {
                structure = await _context.SalaryStructures
                    .Include(s => s.Items)
                    .FirstOrDefaultAsync(s => s.StructureId == numStructId);
            }
        }
        if (structure == null && !string.IsNullOrEmpty(dto.SalaryStructureName))
        {
            structure = await _context.SalaryStructures
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.StructureName.ToLower() == dto.SalaryStructureName.ToLower());
        }

        if (structure == null)
        {
            return NotFound(new { success = false, message = "Salary structure not found in database. Please configure a salary structure first." });
        }

        int staffId = staff.StaffId;
        int structureId = structure.StructureId;

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
            Status = dto.Status ?? "Active",
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
        staff.MonthlySalary = gross;

        await _context.SaveChangesAsync();

        // Recalculate assigned employees count on structure
        var totalActiveForStructure = await _context.EmployeeSalaryAssignments
            .CountAsync(a => a.StructureId == structureId && a.Status == "Active");
        structure.AssignedEmployeesCount = totalActiveForStructure;
        await _context.SaveChangesAsync();

        return Ok(new { 
            success = true, 
            message = "Salary structure assigned successfully.",
            data = new EmployeeSalaryAssignmentDto
            {
                Id = assignment.AssignmentId.ToString(),
                EmployeeId = staff.StaffId.ToString(),
                EmployeeName = $"{staff.FirstName} {staff.LastName}".Trim(),
                EmpId = staff.EmployeeId ?? "",
                EmployeeCategory = staff.EmployeeCategory ?? "Teacher",
                Branch = staff.BranchName ?? "",
                Department = staff.Department ?? "General",
                SalaryStructureId = structure.StructureId.ToString(),
                SalaryStructureName = structure.StructureName,
                EffectiveDate = assignment.EffectiveDate.ToString("yyyy-MM-dd"),
                Status = assignment.Status,
                MonthlyGross = gross,
                PreviousGross = 0,
                AssignedDate = assignment.AssignedDate.ToString("yyyy-MM-dd"),
                Reason = assignment.Reason,
                SalaryOverride = assignment.SalaryOverride,
                OverrideBasicSalary = assignment.OverrideBasicSalary,
                OverrideAllowances = assignment.OverrideAllowances,
                OverrideDeductions = assignment.OverrideDeductions,
                OverrideNetSalary = assignment.OverrideNetSalary,
                UpdatedAt = assignment.UpdatedAt?.ToString("yyyy-MM-dd HH:mm")
            }
        });
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

    // =========================================================
    // PAYROLL RUNS API
    // =========================================================

    [HttpGet("runs")]
    public async Task<IActionResult> GetPayrollRuns([FromQuery] string? month, [FromQuery] string? category, [FromQuery] string? department)
    {
        var query = _context.PayrollRuns.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(month))
        {
            query = query.Where(r => r.PayrollMonth.ToLower() == month.ToLower());
        }
        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(r => r.EmployeeCategory.ToLower() == category.ToLower());
        }
        if (!string.IsNullOrWhiteSpace(department))
        {
            query = query.Where(r => r.Department.ToLower() == department.ToLower());
        }

        var runs = await query.ToListAsync();
        var dtos = runs.Select(r => new PayrollRunDto
        {
            Id = r.Id.ToString(),
            EmployeeId = r.EmployeeId,
            EmployeeName = r.EmployeeName,
            EmpId = r.EmpId,
            Branch = r.Branch,
            Department = r.Department,
            EmployeeCategory = r.EmployeeCategory,
            PayrollMonth = r.PayrollMonth,
            GrossSalary = r.GrossSalary,
            LeaveDeduction = r.LeaveDeduction,
            OtherDeductions = r.OtherDeductions,
            NetSalary = r.NetSalary,
            Status = r.Status,
            SalaryStructureId = r.SalaryStructureId,
            ConfigurationId = r.ConfigurationId,
            Notes = r.Notes,
            ProcessedDate = r.ProcessedDate,
            LockedDate = r.LockedDate,
            PaymentDate = r.PaymentDate,
            WorkflowStage = r.WorkflowStage,
            Earnings = !string.IsNullOrEmpty(r.EarningsJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(r.EarningsJson) : null,
            Deductions = !string.IsNullOrEmpty(r.DeductionsJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(r.DeductionsJson) : null,
            LeaveDetails = !string.IsNullOrEmpty(r.LeaveDetailsJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(r.LeaveDetailsJson) : null,
            ManualAdjustments = !string.IsNullOrEmpty(r.ManualAdjustmentsJson) ? System.Text.Json.JsonSerializer.Deserialize<object>(r.ManualAdjustmentsJson) : null
        }).ToList();

        return Ok(new { success = true, data = dtos });
    }

    [HttpPost("runs/upsert")]
    public async Task<IActionResult> UpsertPayrollRun([FromBody] PayrollRunDto dto)
    {
        if (string.IsNullOrEmpty(dto.EmployeeId) || string.IsNullOrEmpty(dto.PayrollMonth))
        {
            return BadRequest(new { success = false, message = "EmployeeId and PayrollMonth are required." });
        }

        var existing = await _context.PayrollRuns
            .FirstOrDefaultAsync(r => r.EmployeeId == dto.EmployeeId && r.PayrollMonth.ToLower() == dto.PayrollMonth.ToLower());

        if (existing != null)
        {
            existing.EmployeeName = dto.EmployeeName;
            existing.EmpId = dto.EmpId;
            existing.Branch = dto.Branch;
            existing.Department = dto.Department;
            existing.EmployeeCategory = dto.EmployeeCategory;
            existing.GrossSalary = dto.GrossSalary;
            existing.LeaveDeduction = dto.LeaveDeduction;
            existing.OtherDeductions = dto.OtherDeductions;
            existing.NetSalary = dto.NetSalary;
            existing.Status = dto.Status;
            existing.SalaryStructureId = dto.SalaryStructureId;
            existing.ConfigurationId = dto.ConfigurationId;
            existing.Notes = dto.Notes;
            existing.ProcessedDate = dto.ProcessedDate;
            existing.LockedDate = dto.LockedDate;
            existing.PaymentDate = dto.PaymentDate;
            existing.WorkflowStage = dto.WorkflowStage;
            existing.EarningsJson = dto.Earnings != null ? System.Text.Json.JsonSerializer.Serialize(dto.Earnings) : null;
            existing.DeductionsJson = dto.Deductions != null ? System.Text.Json.JsonSerializer.Serialize(dto.Deductions) : null;
            existing.LeaveDetailsJson = dto.LeaveDetails != null ? System.Text.Json.JsonSerializer.Serialize(dto.LeaveDetails) : null;
            existing.ManualAdjustmentsJson = dto.ManualAdjustments != null ? System.Text.Json.JsonSerializer.Serialize(dto.ManualAdjustments) : null;
        }
        else
        {
            existing = new PayrollRun
            {
                EmployeeId = dto.EmployeeId,
                EmployeeName = dto.EmployeeName,
                EmpId = dto.EmpId,
                Branch = dto.Branch,
                Department = dto.Department,
                EmployeeCategory = dto.EmployeeCategory,
                PayrollMonth = dto.PayrollMonth,
                GrossSalary = dto.GrossSalary,
                LeaveDeduction = dto.LeaveDeduction,
                OtherDeductions = dto.OtherDeductions,
                NetSalary = dto.NetSalary,
                Status = dto.Status,
                SalaryStructureId = dto.SalaryStructureId,
                ConfigurationId = dto.ConfigurationId,
                Notes = dto.Notes,
                ProcessedDate = dto.ProcessedDate,
                LockedDate = dto.LockedDate,
                PaymentDate = dto.PaymentDate,
                WorkflowStage = dto.WorkflowStage,
                EarningsJson = dto.Earnings != null ? System.Text.Json.JsonSerializer.Serialize(dto.Earnings) : null,
                DeductionsJson = dto.Deductions != null ? System.Text.Json.JsonSerializer.Serialize(dto.Deductions) : null,
                LeaveDetailsJson = dto.LeaveDetails != null ? System.Text.Json.JsonSerializer.Serialize(dto.LeaveDetails) : null,
                ManualAdjustmentsJson = dto.ManualAdjustments != null ? System.Text.Json.JsonSerializer.Serialize(dto.ManualAdjustments) : null
            };
            await _context.PayrollRuns.AddAsync(existing);
        }

        await _context.SaveChangesAsync();
        dto.Id = existing.Id.ToString();
        return Ok(new { success = true, message = "Payroll run saved successfully.", data = dto });
    }

    [HttpPut("runs/{id}")]
    public async Task<IActionResult> UpdatePayrollRun(string id, [FromBody] PayrollRunDto dto)
    {
        int runId = 0;
        PayrollRun? existing = null;

        if (int.TryParse(id, out runId))
        {
            existing = await _context.PayrollRuns.FindAsync(runId);
        }

        if (existing == null && !string.IsNullOrEmpty(dto.EmployeeId) && !string.IsNullOrEmpty(dto.PayrollMonth))
        {
            existing = await _context.PayrollRuns
                .FirstOrDefaultAsync(r => r.EmployeeId == dto.EmployeeId && r.PayrollMonth.ToLower() == dto.PayrollMonth.ToLower());
        }

        if (existing == null)
        {
            return NotFound(new { success = false, message = "Payroll run not found." });
        }

        existing.GrossSalary = dto.GrossSalary != 0 ? dto.GrossSalary : existing.GrossSalary;
        existing.LeaveDeduction = dto.LeaveDeduction != 0 ? dto.LeaveDeduction : existing.LeaveDeduction;
        existing.OtherDeductions = dto.OtherDeductions != 0 ? dto.OtherDeductions : existing.OtherDeductions;
        existing.NetSalary = dto.NetSalary != 0 ? dto.NetSalary : existing.NetSalary;
        existing.Status = !string.IsNullOrEmpty(dto.Status) ? dto.Status : existing.Status;
        existing.Notes = dto.Notes ?? existing.Notes;
        existing.ProcessedDate = dto.ProcessedDate ?? existing.ProcessedDate;
        existing.LockedDate = dto.LockedDate ?? existing.LockedDate;
        existing.PaymentDate = dto.PaymentDate ?? existing.PaymentDate;
        existing.WorkflowStage = dto.WorkflowStage ?? existing.WorkflowStage;

        if (dto.Earnings != null)
            existing.EarningsJson = System.Text.Json.JsonSerializer.Serialize(dto.Earnings);
        if (dto.Deductions != null)
            existing.DeductionsJson = System.Text.Json.JsonSerializer.Serialize(dto.Deductions);
        if (dto.LeaveDetails != null)
            existing.LeaveDetailsJson = System.Text.Json.JsonSerializer.Serialize(dto.LeaveDetails);
        if (dto.ManualAdjustments != null)
            existing.ManualAdjustmentsJson = System.Text.Json.JsonSerializer.Serialize(dto.ManualAdjustments);

        await _context.SaveChangesAsync();
        dto.Id = existing.Id.ToString();
        return Ok(new { success = true, message = "Payroll run updated successfully.", data = dto });
    }

    [HttpDelete("runs/{id}")]
    public async Task<IActionResult> DeletePayrollRun(string id)
    {
        int runId = 0;
        PayrollRun? existing = null;

        if (int.TryParse(id, out runId))
        {
            existing = await _context.PayrollRuns.FindAsync(runId);
        }

        if (existing == null)
        {
            return NotFound(new { success = false, message = "Payroll run not found." });
        }

        _context.PayrollRuns.Remove(existing);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Payroll run deleted successfully." });
    }

    [HttpPost("payslips")]
    public async Task<IActionResult> CreatePayslip([FromBody] PayslipCreateDto dto)
    {
        if (dto == null) return BadRequest(new { success = false, message = "Payslip data is required." });

        // Parse month and year
        string monthName = "July";
        int year = dto.Year ?? DateTime.UtcNow.Year;

        if (!string.IsNullOrEmpty(dto.Month))
        {
            var parts = dto.Month.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            monthName = parts[0];
            if (parts.Length > 1 && int.TryParse(parts[1], out var parsedYear) && !dto.Year.HasValue)
            {
                year = parsedYear;
            }
        }

        // Look up staff
        Staff? staff = null;
        if (!string.IsNullOrEmpty(dto.EmployeeId) && int.TryParse(dto.EmployeeId, out int parsedStaffId))
        {
            staff = await _context.Staff.FindAsync(parsedStaffId);
        }
        if (staff == null && !string.IsNullOrEmpty(dto.EmpId))
        {
            staff = await _context.Staff.FirstOrDefaultAsync(s => s.EmployeeId == dto.EmpId);
        }
        if (staff == null && !string.IsNullOrEmpty(dto.EmployeeId))
        {
            staff = await _context.Staff.FirstOrDefaultAsync(s => s.EmployeeId == dto.EmployeeId);
        }

        string employeeId = dto.EmployeeId ?? staff?.StaffId.ToString() ?? "";
        string empId = dto.EmpId ?? staff?.EmployeeId ?? dto.EmployeeId ?? "";
        string employeeName = !string.IsNullOrEmpty(dto.EmployeeName) ? dto.EmployeeName : (staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : "Staff Member");
        string department = !string.IsNullOrEmpty(dto.Department) ? dto.Department : (staff?.Department ?? "General");
        string designation = !string.IsNullOrEmpty(dto.Designation) ? dto.Designation : (staff?.Designation ?? "Staff");
        string employeeCategory = !string.IsNullOrEmpty(dto.EmployeeCategory) ? dto.EmployeeCategory : (staff?.EmployeeCategory ?? "Teaching Staff");
        string branch = !string.IsNullOrEmpty(dto.Branch) ? dto.Branch : (staff?.BranchName ?? "");

        decimal basicSalary = dto.BasicSalary ?? 0;
        decimal grossSalary = dto.GrossSalary ?? dto.GrossEarnings ?? 0;
        decimal totalDeductions = dto.OtherDeductions ?? dto.TotalDeductions ?? 0;
        decimal netSalary = dto.NetSalary ?? dto.NetPay ?? Math.Max(0, grossSalary - totalDeductions);
        decimal pf = dto.PfDeduction ?? dto.ProvidentFund ?? 0;
        decimal hra = dto.Hra ?? dto.HouseRentAllowance ?? 0;
        decimal da = dto.Da ?? dto.DearnessAllowance ?? 0;
        decimal leaveDeduction = dto.LeaveDeduction ?? 0;
        decimal lopDeduction = dto.LopDeduction ?? 0;

        // Remove existing payslip for this employee, month, and year
        var existing = await _context.Payslips
            .Where(p => (p.EmployeeId == employeeId || p.EmpId == empId || (staff != null && p.EmployeeId == staff.StaffId.ToString())) && p.Month.ToLower() == monthName.ToLower() && p.Year == year)
            .ToListAsync();
        if (existing.Any())
        {
            _context.Payslips.RemoveRange(existing);
        }

        var entity = new Payslip
        {
            EmployeeId = employeeId,
            EmpId = empId,
            EmployeeName = employeeName,
            Department = department,
            Designation = designation,
            EmployeeCategory = employeeCategory,
            Branch = branch,
            Month = monthName,
            Year = year,
            BasicSalary = basicSalary,
            HouseRentAllowance = hra,
            DearnessAllowance = da,
            GrossEarnings = grossSalary,
            ProvidentFund = pf,
            Esi = dto.Esi ?? 0,
            TotalDeductions = totalDeductions,
            LeaveDeduction = leaveDeduction,
            LopDeduction = lopDeduction,
            NetPay = netSalary,
            BankAccount = dto.BankAccount ?? staff?.AccountNumber ?? "N/A",
            DisbursedDate = dto.DisbursedDate ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
            PaymentDate = dto.PaymentDate ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
            PanNumber = dto.PanNumber ?? staff?.PanNumber ?? "N/A",
            PfNumber = dto.PfNumber ?? "N/A",
            EsiNumber = dto.EsiNumber ?? "N/A",
            Status = dto.Status ?? "Generated",
            EarningsJson = dto.Earnings != null ? System.Text.Json.JsonSerializer.Serialize(dto.Earnings) : null,
            DeductionsJson = dto.Deductions != null ? System.Text.Json.JsonSerializer.Serialize(dto.Deductions) : null,
            LeaveDetailsJson = dto.LeaveDetails != null ? System.Text.Json.JsonSerializer.Serialize(dto.LeaveDetails) : null,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Payslips.AddAsync(entity);
        await _context.SaveChangesAsync();

        var responseDto = new PayslipResponseDto
        {
            Id = entity.PayslipId.ToString(),
            PayslipId = entity.PayslipId,
            EmployeeId = entity.EmployeeId,
            EmpId = entity.EmpId,
            EmployeeName = entity.EmployeeName,
            Department = entity.Department,
            Designation = entity.Designation,
            EmployeeCategory = entity.EmployeeCategory,
            Branch = entity.Branch,
            Month = $"{entity.Month} {entity.Year}".Trim(),
            Year = entity.Year,
            BasicSalary = entity.BasicSalary,
            Hra = entity.HouseRentAllowance,
            Da = entity.DearnessAllowance,
            HouseRentAllowance = entity.HouseRentAllowance,
            DearnessAllowance = entity.DearnessAllowance,
            GrossSalary = entity.GrossEarnings,
            GrossEarnings = entity.GrossEarnings,
            OtherDeductions = entity.TotalDeductions,
            TotalDeductions = entity.TotalDeductions,
            PfDeduction = entity.ProvidentFund,
            ProvidentFund = entity.ProvidentFund,
            Esi = entity.Esi,
            LeaveDeduction = entity.LeaveDeduction,
            LopDeduction = entity.LopDeduction,
            NetSalary = entity.NetPay,
            NetPay = entity.NetPay,
            BankAccount = entity.BankAccount,
            DisbursedDate = entity.DisbursedDate,
            PaymentDate = entity.PaymentDate,
            PanNumber = entity.PanNumber,
            PfNumber = entity.PfNumber,
            EsiNumber = entity.EsiNumber,
            Status = entity.Status,
            Earnings = dto.Earnings,
            Deductions = dto.Deductions,
            LeaveDetails = dto.LeaveDetails
        };

        return Ok(new { success = true, message = "Payslip saved successfully.", data = responseDto });
    }

    [HttpDelete("payslips/{id:int}")]
    public async Task<IActionResult> DeletePayslip(int id)
    {
        var existing = await _context.Payslips.FindAsync(id);
        if (existing == null) return NotFound(new { success = false, message = "Payslip not found." });

        _context.Payslips.Remove(existing);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Payslip deleted successfully." });
    }
}
