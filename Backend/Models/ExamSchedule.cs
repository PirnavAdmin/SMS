namespace SMS.Api.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class ExamSchedule
{
    [Key]
    public int ScheduleId { get; set; }

    [Required]
    public long ExamId { get; set; }

    public string ExamTitle { get; set; } = "Mid-Term Examination 2026";

    public string ClassName { get; set; } = "Class 10";

    public string SectionName { get; set; } = "Section A";

    public string SubjectName { get; set; } = "Computer - CS";

    public DateTime ExamDate { get; set; }

    public string StartTime { get; set; } = "09:00";

    public string EndTime { get; set; } = "12:00";

    public decimal MaxMarks { get; set; } = 100;

    public decimal PassMarks { get; set; } = 33;

    public string AcademicYear { get; set; } = "2025-2026";

    public string BranchName { get; set; } = "Main Campus";

    public ICollection<ExamInvigilatorAssignment> InvigilatorAssignments { get; set; } = new List<ExamInvigilatorAssignment>();
}
