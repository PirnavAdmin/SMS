namespace SMS.Api.Dtos;

using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.Json.Serialization;

public class SubmitAdmissionDto
{
    public string? ProfilePhotoUrl { get; set; }

    public string? FirstName { get; set; }
    public string? LastName { get; set; }

    [JsonPropertyName("applicantFullName")]
    public string? ApplicantFullName
    {
        get => $"{FirstName} {LastName}".Trim();
        set
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                var parts = value.Trim().Split(' ');
                FirstName = parts.FirstOrDefault() ?? "";
                LastName = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "";
            }
        }
    }

    public string? DateOfBirth { get; set; }

    [JsonPropertyName("dob")]
    public string? Dob
    {
        get => DateOfBirth;
        set => DateOfBirth = value;
    }

    public string Gender { get; set; } = "Male";

    public int AppliedClassId { get; set; }

    [JsonPropertyName("appliedClass")]
    public string? AppliedClass { get; set; }

    public string BranchName { get; set; } = "Main Campus";

    public string StudentType { get; set; } = "Day Scholar";

    public string? BloodGroup { get; set; }
    public string? Religion { get; set; }
    public string? Caste { get; set; }

    [JsonPropertyName("casteCategory")]
    public string? CasteCategory
    {
        get => Caste;
        set => Caste = value;
    }

    // Parent & Mobile Info
    public string FatherName { get; set; } = string.Empty;

    [JsonPropertyName("fatherFullName")]
    public string? FatherFullName
    {
        get => FatherName;
        set => FatherName = value ?? "";
    }

    public string? MotherName { get; set; }

    [JsonPropertyName("motherFullName")]
    public string? MotherFullName
    {
        get => MotherName;
        set => MotherName = value;
    }

    public string FatherContact { get; set; } = string.Empty;

    [JsonPropertyName("fatherMobileNo")]
    public string? FatherMobileNo
    {
        get => FatherContact;
        set => FatherContact = value ?? "";
    }

    public string? MotherMobileNumber { get; set; }
    public string? AlternateMobileNumber { get; set; }

    [EmailAddress]
    public string? ParentEmail { get; set; }

    // Residential Address
    public string? HouseNo { get; set; }
    public string? Street { get; set; }
    public string? AreaLocality { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? State { get; set; }
    public string? PinCode { get; set; }

    // Sibling Info
    public int NumberOfSiblings { get; set; } = 0;
    public string? ExistingSiblingLookup { get; set; }

    // Transport Facility Allocation
    public bool TransportRequired { get; set; } = false;
    public string? TransportType { get; set; }
    public string? BusRoute { get; set; }
    public string? PickupPoint { get; set; }
    public string? DropPoint { get; set; }

    // Hostel Facility Allocation
    public string? HostelBlock { get; set; }
    public string? FloorLevel { get; set; }
    public string? HostelRoom { get; set; }
    public string? AvailableBed { get; set; }

    [JsonPropertyName("allocatedBedId")]
    public string? AllocatedBedId
    {
        get => AvailableBed;
        set => AvailableBed = value;
    }

    // Financial Benefits
    public string? Scholarship { get; set; } = "None";
    public string? Discount { get; set; } = "None";
}