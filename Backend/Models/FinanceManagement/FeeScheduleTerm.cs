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
    public string TermName { get; set; } = "Term 1";

    [Required]
    [MaxLength(50)]
    public string StartDate { get; set; } = "2026-04-01";

    [Required]
    [MaxLength(50)]
    public string EndDate { get; set; } = "2026-06-30";

    [Required]
    [MaxLength(50)]
    public string DueDate { get; set; } = "2026-04-15";

    [Column(TypeName = "decimal(5,2)")]
    public decimal PercentageShare { get; set; } = 25.00m;

    [MaxLength(50)]
    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("FeeScheduleId")]
    public FeeSchedule? FeeSchedule { get; set; }
}
