namespace SMS.Api.Models.Examination;

using System;
using System.ComponentModel.DataAnnotations;

public class NewGradingScaleRule
{
    [Key]
    public int RuleId { get; set; }
    public string ExamType { get; set; } = "All";
    public string Grade { get; set; } = "A+";
    public decimal MinMarks { get; set; } = 90;
    public decimal MaxMarks { get; set; } = 100;
    public decimal Gpa { get; set; } = 4.0m;
    public string PassFail { get; set; } = "PASS"; // "PASS", "FAIL"
    public string Remarks { get; set; } = "Outstanding";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

