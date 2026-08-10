namespace SMS.Api.Models.Examination;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class NewExamination
{
    [Key]
    public int ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public string AssessmentType { get; set; } = string.Empty;
    public string AcademicTerm { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string ApplicableClasses { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<NewExamSubjectConfig> SubjectConfigs { get; set; } = new List<NewExamSubjectConfig>();
}

public class NewExamSubjectConfig
{
    [Key]
    public int ConfigId { get; set; }
    public int ExamId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public decimal MaxMarks { get; set; } = 100;
    public decimal PassMarks { get; set; } = 35;
}

