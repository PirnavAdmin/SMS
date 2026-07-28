namespace SMS.Api.Dtos;

public class HostelReportFilterDto
{
    public string? ReportType { get; set; } // Hostel Student List, Occupancy Report, etc.
    public int? HostelId { get; set; }
    public string? FloorLevel { get; set; }
    public int? RoomId { get; set; }
    public string? AcademicYear { get; set; }
    public string? Status { get; set; }
    public string? Search { get; set; }
}

public class HostelReportItemDto
{
    public string AdmissionNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string HostelName { get; set; } = string.Empty;
    public string BlockCode { get; set; } = string.Empty;
    public string FloorLevel { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public string BedNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
