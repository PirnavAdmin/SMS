namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class TransportAttendant
{
    [Key]
    public long AttendantId { get; set; }

    [Required]
    public string AttendantName { get; set; } = string.Empty;

    [Required]
    public string MobileNumber { get; set; } = string.Empty;

    public string? EmployeeId { get; set; }
    public string? Gender { get; set; }
    public string? BranchName { get; set; }

    public string? AlternateMobileNumber { get; set; }
    public string? Address { get; set; }
    public string? BloodGroup { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactNumber { get; set; }

    public long? AssignedVehicleId { get; set; }
    public TransportVehicle? AssignedVehicle { get; set; }

    public bool Status { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public long? CreatedBy { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
