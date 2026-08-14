namespace SMS.Api.Dtos.StaffManagement;

public class StaffDocumentDto
{
    public int StaffDocumentId { get; set; }
    public int StaffId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public bool IsRequired { get; set; }
    public string Status { get; set; } = "Missing";
    public string? UploadedAt { get; set; }
}

