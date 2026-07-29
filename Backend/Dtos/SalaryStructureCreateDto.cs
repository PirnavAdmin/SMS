namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class SalaryStructureCreateDto
{
    public string StructureCode { get; set; } = "STR-5693";
    public string StructureName { get; set; } = "Teacher Grade A";
    public string Branch { get; set; } = "Main Campus";
    public string Department { get; set; } = "General";
    public string Designation { get; set; } = "Teacher";
    public string StaffCategory { get; set; } = "Teacher";
    public string EmploymentType { get; set; } = "Full-time";
    public string EffectiveDate { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public string? Notes { get; set; }
    public decimal MonthlyGrossSalary { get; set; }
    public List<SalaryStructureItemDto> Items { get; set; } = new();
}
