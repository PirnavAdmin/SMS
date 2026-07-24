namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class TransportDriver
{
    [Key]
    public long DriverId { get; set; }

    [Required]
    public string DriverName { get; set; } = string.Empty;

    [Required]
    public string LicenceNumber { get; set; } = string.Empty;

    public DateTime? LicenceExpiry { get; set; }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string LicenseNumber
    {
        get => LicenceNumber;
        set => LicenceNumber = value;
    }

    [Required]
    public string MobileNumber { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string Phone
    {
        get => MobileNumber;
        set => MobileNumber = value;
    }

    public string AlternateMobileNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string BloodGroup { get; set; } = string.Empty;
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactNumber { get; set; } = string.Empty;

    public bool Status { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public long? CreatedBy { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public long? AssignedVehicleId { get; set; }
    public TransportVehicle? AssignedVehicle { get; set; }
}