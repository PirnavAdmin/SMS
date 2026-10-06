namespace SMS.Api.Models.FinanceManagement;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("financial_budgets")]
public class FinancialBudget
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string CategoryName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Department { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string AcademicYear { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Branch { get; set; } = string.Empty;

    public int? BranchId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal AllocatedAmount { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
