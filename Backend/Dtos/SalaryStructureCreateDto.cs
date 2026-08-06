namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class SalaryStructureCreateDto
{
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
