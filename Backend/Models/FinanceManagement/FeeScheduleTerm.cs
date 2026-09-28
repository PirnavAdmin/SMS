using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.FinanceManagement;

[Table("fee_schedule_terms")]
public class FeeScheduleTerm
{
    [Key]
    [MaxLength(100)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FeeScheduleId { get; set; } = string.Empty;

    public int Sequence { get; set; } = 1;

    [Required]
    [MaxLength(100)]
    public string TermName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string StartDate { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string EndDate { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string DueDate { get; set; } = string.Empty;

    [MaxLength(20)]
    public string DueDateMode { get; set; } = "AUTO";

    public int DueDateOffsetDays { get; set; } = 45;

    [Column(TypeName = "decimal(5,2)")]
    public decimal PercentageShare { get; set; } = 0.00m;

    [MaxLength(50)]
    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("FeeScheduleId")]
    public FeeSchedule? FeeSchedule { get; set; }
}
