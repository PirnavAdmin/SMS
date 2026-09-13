using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.FinanceManagement;

[Table("fee_schedules")]
public class FeeSchedule
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string AcademicYear { get; set; } = "2026-2027";

    public int NumberOfTerms { get; set; } = 4;

    public string Status { get; set; } = "Published";

    public string AnnualDueDate { get; set; } = "2026-04-15";

    public string OneTimeDueDate { get; set; } = "2026-04-15";

    public string? TermsJson { get; set; }

    public string? MonthlyConfigJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
