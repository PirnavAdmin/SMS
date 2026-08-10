namespace SMS.Api.Dtos.Examination;

using System.Collections.Generic;

public class GradingScaleOptionsDto
{
    public List<string> ExamTypes { get; set; } = new List<string>
    {
        "All",
        "Periodic Assessment (PT)",
        "Unit Test (UT)",
        "Formative Assessment (FA)",
        "Summative Assessment (SA)",
        "Mid-Term Examination",
        "Half-Yearly Examination",
        "Pre-Board Examination",
        "Annual / Final Examination",
        "Practical & Laboratory Assessment",
        "Internal / Continuous Evaluation"
    };

    public List<string> PassFailOptions { get; set; } = new List<string> { "PASS", "FAIL" };
}

public class GradingScaleRuleItemDto
{
    public int RuleId { get; set; }
    public string Grade { get; set; } = "A+";
    public decimal MinMarks { get; set; } = 90;
    public decimal MaxMarks { get; set; } = 100;
    public decimal Gpa { get; set; } = 4.0m;
    public string GpaDisplay => $"{Gpa:F1} GPA";
    public string PassFail { get; set; } = "PASS";
    public string Remarks { get; set; } = string.Empty;
}

public class GradingScaleResponseDto
{
    public string ExamType { get; set; } = "All";
    public List<GradingScaleRuleItemDto> ScaleRules { get; set; } = new List<GradingScaleRuleItemDto>();
}

public class SaveGradingScaleRequestDto
{
    public string ExamType { get; set; } = "All";
    public List<GradingScaleRuleItemDto> ScaleRules { get; set; } = new List<GradingScaleRuleItemDto>();
}

