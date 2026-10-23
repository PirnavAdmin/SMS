namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class TransportAttendant
{
    [Key]
    public long AttendantId { get; set; }

    [MaxLength(255)]
    public string? AttendantName { get; set; }

    [MaxLength(100)]
    public string? MobileNumber { get; set; }

    [MaxLength(100)]
    public string? EmployeeId { get; set; }

    [MaxLength(50)]
    public string? Gender { get; set; }

    [MaxLength(255)]
    public string? BranchName { get; set; }

    [MaxLength(100)]
    public string? AlternateMobileNumber { get; set; }

    public string? Address { get; set; }

    [MaxLength(20)]
    public string? BloodGroup { get; set; }

    [MaxLength(255)]
    public string? EmergencyContactName { get; set; }

    [MaxLength(100)]
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
