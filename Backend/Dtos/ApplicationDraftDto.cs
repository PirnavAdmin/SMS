namespace SMS.Api.Dtos;

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

public class SaveApplicationDraftRequestDto
{
    public int? Id { get; set; }

    public string FormType { get; set; } = string.Empty; // "student_admission", "staff_registration"

    public string? DraftKey { get; set; } = "default";

    public string? ApplicantName { get; set; }

    public string? Branch { get; set; }

    public string? AcademicYear { get; set; }

    public int CurrentStep { get; set; } = 1;

    public JsonElement? FormData { get; set; }
}

public class ApplicationDraftResponseDto
{
    public int Id { get; set; }

    public string FormType { get; set; } = string.Empty;

    public string DraftKey { get; set; } = "default";

    public string? UserId { get; set; }

    public string? UserName { get; set; }

    public string? Branch { get; set; }

    public string? AcademicYear { get; set; }

    public string? ApplicantName { get; set; }

    public int CurrentStep { get; set; } = 1;

    public object? FormData { get; set; }

    public string Status { get; set; } = "Draft";

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
