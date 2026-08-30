namespace SMS.Api.Dtos;

public class StaffDocumentDto
{
    public int StaffDocumentId { get; set; }
    public int StaffId { get; set; }
    
    private string _documentType = string.Empty;
    public string DocumentType 
    { 
        get => _documentType; 
        set => _documentType = value; 
    }
    public string? DocType { set { if (string.IsNullOrWhiteSpace(_documentType) && !string.IsNullOrWhiteSpace(value)) _documentType = value; } }
    public string? Type { set { if (string.IsNullOrWhiteSpace(_documentType) && !string.IsNullOrWhiteSpace(value)) _documentType = value; } }
    public string? DocumentTitle { get; set; }
    public string? Title { set { if (string.IsNullOrWhiteSpace(DocumentTitle) && !string.IsNullOrWhiteSpace(value)) DocumentTitle = value; } }
    public string? Name { set { if (string.IsNullOrWhiteSpace(DocumentTitle) && !string.IsNullOrWhiteSpace(value)) DocumentTitle = value; } }

    public string? FileUrl { get; set; }
    public bool IsRequired { get; set; } = true;
    public string Status { get; set; } = "Attached";
    
    private string? _uploadedAt;
    public string? UploadedAt 
    { 
        get => _uploadedAt; 
        set => _uploadedAt = value; 
    }
    public string? UploadedDate { set { if (string.IsNullOrWhiteSpace(_uploadedAt) && !string.IsNullOrWhiteSpace(value)) _uploadedAt = value; } }
    public string? UploadDate { set { if (string.IsNullOrWhiteSpace(_uploadedAt) && !string.IsNullOrWhiteSpace(value)) _uploadedAt = value; } }
}

