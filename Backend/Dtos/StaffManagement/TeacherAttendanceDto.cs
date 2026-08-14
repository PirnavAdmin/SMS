namespace SMS.Api.Dtos.StaffManagement;

using System.ComponentModel.DataAnnotations;

public class TeacherAttendanceDto
{
    public int AttendanceId { get; set; }
    public int StaffId { get; set; }
    public DateTime Date { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? InTime { get; set; }
    public string? OutTime { get; set; }
    public string? Remarks { get; set; }
}

public class TeacherAttendanceFilterDto
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Status { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class TeacherAttendancePagedResultDto
{
    public List<TeacherAttendanceDto> Items { get; set; } = new();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalRecords { get; set; }

    public int TotalPages =>
        PageSize <= 0
            ? 0
            : (int)Math.Ceiling(TotalRecords / (double)PageSize);
}

public class TeacherCheckInDto
{
    [MaxLength(500)]
    public string? Remarks { get; set; }
}

public class TeacherCheckOutDto
{
    [MaxLength(500)]
    public string? Remarks { get; set; }
}

public class CreateAttendanceCorrectionDto
{
    [Required]
    public DateTime AttendanceDate { get; set; }

    [MaxLength(20)]
    public string? RequestedInTime { get; set; }

    [MaxLength(20)]
    public string? RequestedOutTime { get; set; }

    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;
}

public class AttendanceCorrectionDto
{
    public int CorrectionId { get; set; }
    public int StaffId { get; set; }
    public DateTime AttendanceDate { get; set; }
    public string? CurrentInTime { get; set; }
    public string? CurrentOutTime { get; set; }
    public string? RequestedInTime { get; set; }
    public string? RequestedOutTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string? ApprovedRemarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
