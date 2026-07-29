namespace SMS.Api.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class SalaryStructure
{
    [Key]
    public int StructureId { get; set; }

    [Required]
    public string StructureCode { get; set; } = string.Empty;

    [Required]
    public string StructureName { get; set; } = string.Empty;

    public string Branch { get; set; } = "Main Campus";

    public string Department { get; set; } = "General";

    public string Designation { get; set; } = "Teacher";

    public string StaffCategory { get; set; } = "Teacher";

    public string EmploymentType { get; set; } = "Full-time";

    public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;

    public string Status { get; set; } = "Active";

    public string? Notes { get; set; }

    public decimal MonthlyGrossSalary { get; set; }

    public int AssignedEmployeesCount { get; set; } = 1;

    public ICollection<SalaryStructureItem> Items { get; set; } = new List<SalaryStructureItem>();
}
