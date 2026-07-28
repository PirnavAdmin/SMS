namespace SMS.Api.Dtos;

using System;
using System.ComponentModel.DataAnnotations;

public class HostelWardenDto
{
    public int WardenId { get; set; }
    public int HostelId { get; set; }
    public string HostelName { get; set; } = string.Empty;
    public int? StaffId { get; set; }
    public string? EmployeeId { get; set; }
    public string WardenName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? AlternateMobile { get; set; }
    public string? EmailAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SaveHostelWardenDto
{
    [Required(ErrorMessage = "Assigned Hostel Block is required.")]
    public int HostelId { get; set; }

    public int? StaffId { get; set; }

    public string? EmployeeId { get; set; }

    public string? WardenName { get; set; }

    public string? MobileNumber { get; set; }

    public string? AlternateMobile { get; set; }

    public string? EmailAddress { get; set; }
}

public class StaffWardenCandidateDto
{
    public int StaffId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}
