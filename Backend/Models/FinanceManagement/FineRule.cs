using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.FinanceManagement;

[Table("fine_rules")]
public class FineRule
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string RuleName { get; set; } = string.Empty;

    [MaxLength(30)]
    public string DueDate { get; set; } = "2026-08-15";

    public int GraceDays { get; set; } = 5;

    [Required]
    [MaxLength(50)]
    public string FineType { get; set; } = "Daily Fine"; // "Daily Fine", "Fixed Fine", "Percentage"

    [Column(TypeName = "decimal(18,2)")]
    public decimal DailyFine { get; set; } = 50m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal FixedFine { get; set; } = 200m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal MaximumFine { get; set; } = 1500m;

    [MaxLength(30)]
    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
