namespace SMS.Api.Dtos;

using System;
using System.ComponentModel.DataAnnotations;

public class HostelBlockDto
{
    public int HostelId { get; set; }
    public string HostelName { get; set; } = string.Empty;
    public string HostelCode { get; set; } = string.Empty;
    public string HostelType { get; set; } = string.Empty;
    public string? WardenName { get; set; }
    public string? PrimaryMobileNumber { get; set; }
    public string? AlternateMobileNumber { get; set; }
    public string? Email { get; set; }
    public string Status { get; set; } = "Active";
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalRooms { get; set; }
    public int OccupiedBeds { get; set; }
    public int TotalCapacity { get; set; }
}

public class CreateHostelBlockDto
{
    [Required(ErrorMessage = "Hostel Name is required.")]
    public string HostelName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Hostel Code is required.")]
    public string HostelCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Hostel Type is required.")]
    public string HostelType { get; set; } = "Boys Hostel";

    public string? WardenName { get; set; }
    public string? PrimaryMobileNumber { get; set; }
    public string? AlternateMobileNumber { get; set; }
    public string? Email { get; set; }
    public string Status { get; set; } = "Active";
    public string? Address { get; set; }
}
