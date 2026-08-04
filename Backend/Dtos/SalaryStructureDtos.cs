namespace SMS.Api.Dtos;

using System;
using System.Collections.Generic;

public class SalaryStructureDto
{
    public string Id { get; set; } = string.Empty;
    public string StructureName { get; set; } = string.Empty;
    public string EmployeeCategory { get; set; } = "Teacher"; // Maps StaffCategory
    public string Branch { get; set; } = "Main Campus";
    public string Department { get; set; } = "General";
    public string Designation { get; set; } = "Teacher";
    public string EmploymentType { get; set; } = "Full-time";
    public string EffectiveDate { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public string? Notes { get; set; }
    public decimal GrossSalary { get; set; }
    public string NetSalaryFormula { get; set; } = "Gross - Deductions";
    
    public string PayrollFrequency { get; set; } = "Monthly";
    public string SalaryPaymentDay { get; set; } = "5";
    public bool PfApplicable { get; set; }
    public decimal PfPercentage { get; set; }
    public bool EsiApplicable { get; set; }
    public decimal EsiPercentage { get; set; }
    public bool ProfessionalTaxApplicable { get; set; }
    public decimal ProfessionalTaxAmount { get; set; }
    public string RoundOffRule { get; set; } = "No Round Off";

    public List<PayrollAmountLineDto> Earnings { get; set; } = new();
    public List<PayrollAmountLineDto> Deductions { get; set; } = new();
}

public class PayrollAmountLineDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Type { get; set; } // "Fixed" or "Percentage"
    public decimal? Value { get; set; }
}


public class EmployeeSalaryAssignmentDto
{
    public string Id { get; set; } = string.Empty; // Maps AssignmentId.ToString()
    public string EmployeeId { get; set; } = string.Empty; // Maps StaffId.ToString()
    public string EmployeeName { get; set; } = string.Empty;
    public string EmpId { get; set; } = string.Empty;
    public string EmployeeCategory { get; set; } = "Teacher";
    public string Branch { get; set; } = "Main Campus";
    public string Department { get; set; } = "General";
    public string SalaryStructureId { get; set; } = string.Empty; // Maps StructureId.ToString()
    public string SalaryStructureName { get; set; } = string.Empty;
    public string EffectiveDate { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    
    public decimal? MonthlyGross { get; set; }
    public decimal? PreviousGross { get; set; }
    public string? UpdatedBy { get; set; }
    public string? UpdatedAt { get; set; }
    public string? AssignedDate { get; set; }
    public string? Reason { get; set; }
    
    public bool SalaryOverride { get; set; }
    public decimal? OverrideBasicSalary { get; set; }
    public decimal? OverrideAllowances { get; set; }
    public decimal? OverrideDeductions { get; set; }
    public decimal? OverrideNetSalary { get; set; }
}

public class EmployeeSalaryAssignmentCreateDto
{
    public string EmployeeId { get; set; } = string.Empty; // StaffId
    public string SalaryStructureId { get; set; } = string.Empty; // StructureId
    public string EffectiveDate { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public string? Reason { get; set; }
    public bool SalaryOverride { get; set; }
    public decimal? OverrideBasicSalary { get; set; }
    public decimal? OverrideAllowances { get; set; }
    public decimal? OverrideDeductions { get; set; }
    public decimal? OverrideNetSalary { get; set; }
}
