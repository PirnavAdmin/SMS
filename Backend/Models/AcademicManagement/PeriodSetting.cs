namespace SMS.Api.Models.AcademicManagement;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("period_settings")]
public class PeriodSetting
{
    [Key]
    public int PeriodId { get; set; }

    [Required]
    [MaxLength(100)]
    public string PeriodName { get; set; } = string.Empty; // e.g. "Period 1", "Morning Break"

    [Required]
    public TimeSpan StartTime { get; set; } // e.g. 08:30:00

    [Required]
    public TimeSpan EndTime { get; set; } // e.g. 09:15:00

    [Required]
    [MaxLength(50)]
    public string PeriodType { get; set; } = "Teaching Period"; // "Teaching Period", "Break / Recess", "Assembly", "Free Period"

    public int DisplayOrder { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;
}
