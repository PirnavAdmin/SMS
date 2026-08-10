namespace SMS.Api.Dtos.Examination;

using System.Collections.Generic;

public class ExamConfigOptionsDto
{
    public List<string> AssessmentTypes { get; set; } = new List<string>
    {
        "Unit Test",
        "Periodic Assessment (PT)",
        "Formative Assessment (FA)",
        "Summative Assessment (SA)",
        "Mid-Term Examination",
        "Half-Yearly Examination",
        "Pre-Board Examination",
        "Annual / Final Examination",
        "Practical & Laboratory Assessment",
        "Internal / Continuous Evaluation",
        "Other / Custom..."
    };

    public List<string> AcademicTerms { get; set; } = new List<string>
    {
        "Term 1 (First Term)",
        "Term 2 (Second Term)",
        "Semester 1",
        "Semester 2",
        "Full Academic Session",
        "Quarter 1",
        "Quarter 2",
        "Quarter 3",
        "Quarter 4",
        "Other / Custom..."
    };

    public List<string> AvailableClasses { get; set; } = new List<string>
    {
        "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
        "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
    };

    public List<ExamDropdownItemDto> ExistingExams { get; set; } = new List<ExamDropdownItemDto>();
}

public class ExamDropdownItemDto
{
    public int ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public string DisplayText => $"{ExamName} ({Status})";
}

public class SaveExamDetailsRequestDto
{
    public int? ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public string AssessmentType { get; set; } = string.Empty;
    public string AcademicTerm { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public List<string> ApplicableClasses { get; set; } = new List<string>();
}

public class ExamDetailsResponseDto
{
    public int ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public string AssessmentType { get; set; } = string.Empty;
    public string AcademicTerm { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public List<string> ApplicableClasses { get; set; } = new List<string>();
    public string Status { get; set; } = "Draft";
}

public class SubjectMarksConfigItemDto
{
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = false;
    public decimal MaxMarks { get; set; } = 100;
    public decimal PassMarks { get; set; } = 35;
}

public class SubjectConfigPageResponseDto
{
    public int ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public string ClassName { get; set; } = "Class 1";
    public List<string> AvailableClasses { get; set; } = new List<string>();
    public List<SubjectMarksConfigItemDto> Subjects { get; set; } = new List<SubjectMarksConfigItemDto>();
}

public class SaveSubjectsAndMarksRequestDto
{
    public int ExamId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public List<SubjectMarksConfigItemDto> Subjects { get; set; } = new List<SubjectMarksConfigItemDto>();
    public bool ProceedToSchedule { get; set; } = true;
}

