namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class EmployeeSalaryAssignment
{
    [Key]
    public int AssignmentId { get; set; }

    [Required]
    public int StaffId { get; set; }

    [ForeignKey("StaffId")]
    public Staff? Staff { get; set; }

    [Required]
    public int StructureId { get; set; }

    [ForeignKey("StructureId")]
    public SalaryStructure? Structure { get; set; }

    public string Status { get; set; } = "Active";

    public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;

    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;

    public string? Reason { get; set; }

    public bool SalaryOverride { get; set; } = false;

    public decimal? OverrideBasicSalary { get; set; }

    public decimal? OverrideAllowances { get; set; }

    public decimal? OverrideDeductions { get; set; }

    public decimal? OverrideNetSalary { get; set; }

    public string? UpdatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
