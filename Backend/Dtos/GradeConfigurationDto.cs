namespace SMS.Api.Dtos;

public class GradeConfigurationDto
{
    public int GradeId { get; set; }
    public string SchemeName { get; set; } = "Default Scholastic";
    public string GradeLetter { get; set; } = "A+";
    public decimal MinPercentage { get; set; }
    public decimal MaxPercentage { get; set; }
    public decimal GradePoints { get; set; }
    public string CriteriaStatus { get; set; } = "Pass";
}
