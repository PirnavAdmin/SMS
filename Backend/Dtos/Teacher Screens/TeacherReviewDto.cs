namespace SMS.Api.Dtos.TeacherScreens;

using System;
using System.Collections.Generic;

public class TeacherReviewSummaryDto
{
    public int StaffId { get; set; }

    public TeacherPersonalInfoDto? Personal { get; set; }

    public TeacherAddressDto? Address { get; set; }

    public List<TeacherEducationDto> Qualifications { get; set; } = new List<TeacherEducationDto>();

    public List<TeacherExperienceDto> Experiences { get; set; } = new List<TeacherExperienceDto>();

    public TeacherBankDto? Bank { get; set; }

    public List<TeacherDocumentDto> Documents { get; set; } = new List<TeacherDocumentDto>();

    public int TotalUploadedDocumentsCount { get; set; }

    public int TotalRequiredDocumentsCount { get; set; }

    public bool IsProfileComplete { get; set; }

    public string ProfileStatus { get; set; } = "Pending";
}

public class SubmitTeacherProfileDto
{
    public string? Remarks { get; set; }
}

public class TeacherSubmissionResultDto
{
    public bool Success { get; set; }

    public string Message { get; set; } = string.Empty;

    public string ProfileStatus { get; set; } = "Completed";

    public DateTime SubmittedAt { get; set; }
}
