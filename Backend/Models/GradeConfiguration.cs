namespace SMS.Api.Models;

using System.ComponentModel.DataAnnotations;

public class GradeConfiguration
{
    [Key]
    public int GradeId { get; set; }

    public string SchemeName { get; set; } = "Default Scholastic";

    public string GradeLetter { get; set; } = "A+";

    public decimal MinPercentage { get; set; } = 90;

    public decimal MaxPercentage { get; set; } = 100;

    public decimal GradePoints { get; set; } = 10;

    public string CriteriaStatus { get; set; } = "Pass";
}
