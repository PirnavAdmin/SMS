namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class TransportDriver
{
    [Key]
    public long DriverId { get; set; }

    [MaxLength(255)]
    public string? DriverName { get; set; }

    [MaxLength(100)]
    public string? EmployeeId { get; set; }

    [MaxLength(100)]
    public string? LicenceNumber { get; set; }

    public DateTime? LicenceExpiry { get; set; }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string? LicenseNumber
    {
        get => LicenceNumber;
        set => LicenceNumber = value;
    }

    [MaxLength(100)]
    public string? MobileNumber { get; set; }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string? Phone
    {
        get => MobileNumber;
        set => MobileNumber = value;
    }

    [MaxLength(100)]
    public string? AlternateMobileNumber { get; set; }
    [MaxLength(150)]
    public string? Email { get; set; }
    public string? Address { get; set; }
    [MaxLength(20)]
    public string? BloodGroup { get; set; }
    [MaxLength(255)]
    public string? EmergencyContactName { get; set; }
    [MaxLength(100)]
    public string? EmergencyContactNumber { get; set; }

    public bool Status { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public long? CreatedBy { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public long? AssignedVehicleId { get; set; }
    public TransportVehicle? AssignedVehicle { get; set; }
}
