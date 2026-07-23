namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class AdmissionApplication
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string RegistrationNo { get; set; } = string.Empty; // e.g. "REG-8244"

    // Profile Photo
    public string? ProfilePhotoUrl { get; set; }

    // 1. Student Personal Details
    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    public DateTime? DateOfBirth { get; set; }

    public string Gender { get; set; } = "Male";

    public int AppliedClassId { get; set; }
    public ClassGrade AppliedClass { get; set; } = null!;

    [Required]
    public string BranchName { get; set; } = "Main Campus";

    public string? BloodGroup { get; set; }
    public string? Religion { get; set; }
    public string? Caste { get; set; }

    // 2. Parent & Mobile Information
    [Required]
    public string FatherName { get; set; } = string.Empty;

    public string? MotherName { get; set; }

    [Required]
    [Phone]
    public string FatherContact { get; set; } = string.Empty;

    public string? MotherMobileNumber { get; set; }

    public string? AlternateMobileNumber { get; set; }

    [EmailAddress]
    public string? ParentEmail { get; set; }

    // 3. Complete Residential Address
    public string? HouseNo { get; set; }
    public string? Street { get; set; }
    public string? AreaLocality { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? State { get; set; }
    public string? PinCode { get; set; }

    // 4. Sibling Information
    public int NumberOfSiblings { get; set; } = 0;
    public string? ExistingSiblingLookup { get; set; }

    // 5. Student Type & Facility Allocation - Transport
    public bool TransportRequired { get; set; } = false;
    public string? TransportType { get; set; }
    public string? BusRoute { get; set; }
    public string? PickupPoint { get; set; }
    public string? DropPoint { get; set; }

    // 5. Student Type & Facility Allocation - Hostel
    public string? HostelBlock { get; set; }
    public string? FloorLevel { get; set; }
    public string? HostelRoom { get; set; }
    public string? AvailableBed { get; set; }

    // Financial Benefits
    public string? Scholarship { get; set; } = "None";
    public string? Discount { get; set; } = "None";

    [Required]
    public string Status { get; set; } = "Pending"; // "Pending", "Rejected", "Enrolled"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}