namespace SMS.Api.Dtos;

using System;
using System.Collections.Generic;

public class StaffLetterRecordDto
{
    public string Id { get; set; } = string.Empty;
    public string LetterNumber { get; set; } = string.Empty;
    public string LetterType { get; set; } = "offer";
    public string StaffId { get; set; } = string.Empty;
    public string StaffEmpId { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string IssueDate { get; set; } = string.Empty;
    public string GeneratedBy { get; set; } = "Institutional HR Administration";
    public string Status { get; set; } = "Issued";
    public object? Payload { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class CreateStaffLetterDto
{
    public string? Id { get; set; }
    public string LetterNumber { get; set; } = string.Empty;
    public string LetterType { get; set; } = "offer";
    public string StaffId { get; set; } = string.Empty;
    public string StaffEmpId { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string IssueDate { get; set; } = string.Empty;
    public string GeneratedBy { get; set; } = "Institutional HR Administration";
    public string Status { get; set; } = "Issued";
    public object? Payload { get; set; }
}

public class GlobalLetterSettingsDto
{
    public string SignatoryName { get; set; } = string.Empty;
    public string SignatoryTitle { get; set; } = string.Empty;
    public int ProbationMonths { get; set; } = 6;
    public int NoticePeriodDays { get; set; } = 30;
    public string? SignatureImageUrl { get; set; }
    public string? SealImageUrl { get; set; }
    public List<string>? MasterTerms { get; set; }
}
