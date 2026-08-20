namespace SMS.Api.Dtos.TeacherScreens;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class TeacherDocumentDto
{
    public int Id { get; set; }

    public int StaffId { get; set; }

    public string DocumentTitle { get; set; } = string.Empty;

    public string DocumentType { get; set; } = string.Empty;

    public string? FileUrl { get; set; }

    public string? FileName { get; set; }

    public bool IsRequired { get; set; }

    public string Status { get; set; } = "Pending";

    public DateTime? UploadedAt { get; set; }
}

public class CreateOrUpdateTeacherDocumentDto
{
    [Required(ErrorMessage = "Document title is required.")]
    public string DocumentTitle { get; set; } = string.Empty;

    public string? DocumentType { get; set; }

    [Required(ErrorMessage = "File URL is required.")]
    public string FileUrl { get; set; } = string.Empty;

    public string? FileName { get; set; }

    public bool IsRequired { get; set; } = true;
}

public class BulkUpdateTeacherDocumentDto
{
    public List<CreateOrUpdateTeacherDocumentDto> Documents { get; set; } = new List<CreateOrUpdateTeacherDocumentDto>();
}
