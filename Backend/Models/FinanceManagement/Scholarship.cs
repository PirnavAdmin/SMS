using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.FinanceManagement;

[Table("scholarships")]
public class Scholarship
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = "Merit";

    [Required]
    [MaxLength(30)]
    public string DiscountType { get; set; } = "Percentage";

    [Column(TypeName = "decimal(10,2)")]
    public decimal Percentage { get; set; } = 0m;

    [Column(TypeName = "decimal(10,2)")]
    public decimal FixedAmount { get; set; } = 0m;

    public string? ApplicableFeeHeadIdsJson { get; set; } = "[]";

    public string? ApplicableClassesJson { get; set; } = "[]";

    [MaxLength(30)]
    public string StartDate { get; set; } = "2026-04-01";

    [MaxLength(30)]
    public string EndDate { get; set; } = "2027-03-31";

    [MaxLength(255)]
    public string? Eligibility { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
