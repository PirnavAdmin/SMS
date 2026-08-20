using System;
using System.Collections.Generic;

namespace SMS.Api.Dtos
{
    public class StudentPromotionRowDto
    {
        public int StudentId { get; set; }
        public string Id { get; set; } = string.Empty;
        public string AdmissionNo { get; set; } = string.Empty;
        public string RollNo { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        public string Branch { get; set; } = "Main Campus";
        public string CurrentClass { get; set; } = string.Empty;
        public string CurrentSection { get; set; } = "A";
        public decimal OverallPct { get; set; } = 84.0m;
        public string Grade { get; set; } = "A2";
        public string FinalResult { get; set; } = "PASS";
        public string PromotionStatus { get; set; } = "Promote";
        public string NewClass { get; set; } = string.Empty;
        public string NewSection { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
        public bool IsAlreadyPromoted { get; set; } = false;
    }

    public class ExecuteStudentPromotionRequestDto
    {
        public string CurrentAcademicYear { get; set; } = "2026-2027";
        public string TargetAcademicYear { get; set; } = "2027-2028";
        public string CurrentClass { get; set; } = string.Empty;
        public string Branch { get; set; } = "Main Campus";
        public string Policy { get; set; } = "Manual";
        public List<StudentPromotionItemDto> Promotions { get; set; } = new();
    }

    public class StudentPromotionItemDto
    {
        public int StudentId { get; set; }
        public string Id { get; set; } = string.Empty;
        public string AdmissionNo { get; set; } = string.Empty;
        public string RollNo { get; set; } = string.Empty;
        public string CurrentClass { get; set; } = string.Empty;
        public string CurrentSection { get; set; } = string.Empty;
        public string PromotionStatus { get; set; } = "Promote"; // Promote / Retain
        public string NewClass { get; set; } = string.Empty;
        public string NewSection { get; set; } = string.Empty;
        public decimal OverallPct { get; set; }
        public string Grade { get; set; } = "A2";
        public string FinalResult { get; set; } = "PASS";
        public string Remarks { get; set; } = string.Empty;
    }

    public class StudentPromotionOptionsDto
    {
        public List<string> CurrentAcademicYears { get; set; } = new();
        public List<string> TargetAcademicYears { get; set; } = new();
        public List<string> Classes { get; set; } = new();
        public List<string> AvailableSections { get; set; } = new();
        public List<string> Policies { get; set; } = new();
    }
}
