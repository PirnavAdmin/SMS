using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.FinanceManagement;

[Table("fee_schedules")]
public class FeeSchedule
{
    [Key]
    public string Id { get; set; } = string.Empty;

    public string AcademicYear { get; set; } = string.Empty;

    public int NumberOfTerms { get; set; } = 4;

    public int DueDateOffsetDays { get; set; } = 45;

    public string Status { get; set; } = "Published";

    public string AnnualDueDate { get; set; } = string.Empty;

    public string OneTimeDueDate { get; set; } = string.Empty;

    public bool ApplySameDayToAllMonths { get; set; } = true;

    public int MonthlyDueDay { get; set; } = 5;

    public string? TermsJson { get; set; }

    public string? MonthlyConfigJson { get; set; }

    public List<FeeScheduleTerm> Terms { get; set; } = new();

    public List<FeeScheduleMonthlyDate> MonthlyDates { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
