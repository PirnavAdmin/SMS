using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.FinanceManagement;

[Table("fee_schedule_monthly_dates")]
public class FeeScheduleMonthlyDate
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string FeeScheduleId { get; set; } = string.Empty;

    public int MonthIndex { get; set; }

    [Required]
    [MaxLength(50)]
    public string MonthName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string DueDate { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("FeeScheduleId")]
    public FeeSchedule? FeeSchedule { get; set; }
}
