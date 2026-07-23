namespace SMS.Api.Dtos;

using System.Text.Json.Serialization;

public class AdmissionApplicationResponseDto
{
    public int Id { get; set; }

    [JsonPropertyName("applicationId")]
    public int ApplicationId => Id;

    public string RegistrationNo { get; set; } = string.Empty;

    [JsonPropertyName("registrationNumber")]
    public string RegistrationNumber => RegistrationNo;

    public string? ProfilePhotoUrl { get; set; }

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    public string StudentName => $"{FirstName} {LastName}".Trim();

    [JsonPropertyName("applicantFullName")]
    public string ApplicantFullName => StudentName;

    public string? DateOfBirth { get; set; }

    [JsonPropertyName("dob")]
    public string? Dob => DateOfBirth;

    public string Gender { get; set; } = string.Empty;

    public string AppliedClassGrade { get; set; } = string.Empty;

    [JsonPropertyName("appliedClass")]
    public string AppliedClass => AppliedClassGrade;

    public string BranchName { get; set; } = string.Empty;
    public string? BloodGroup { get; set; }
    public string? Religion { get; set; }
    public string? Caste { get; set; }

    [JsonPropertyName("casteCategory")]
    public string? CasteCategory => Caste;

    // Parent Info
    public string FatherName { get; set; } = string.Empty;

    [JsonPropertyName("fatherFullName")]
    public string FatherFullName => FatherName;

    public string? MotherName { get; set; }

    [JsonPropertyName("motherFullName")]
    public string? MotherFullName => MotherName;

    public string FatherContact { get; set; } = string.Empty;

    [JsonPropertyName("fatherMobileNo")]
    public string FatherMobileNo => FatherContact;

    public string? MotherMobileNumber { get; set; }
    public string? AlternateMobileNumber { get; set; }
    public string? ParentEmail { get; set; }

    // Address
    public string? HouseNo { get; set; }
    public string? Street { get; set; }
    public string? AreaLocality { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? State { get; set; }
    public string? PinCode { get; set; }

    // Sibling Info
    public int NumberOfSiblings { get; set; }
    public string? ExistingSiblingLookup { get; set; }

    // Student Type
    public string StudentType { get; set; } = "Day Scholar";

    // Facility Allocation - Transport
    public bool TransportRequired { get; set; }
    public string? TransportType { get; set; }
    public string? BusRoute { get; set; }
    public string? PickupPoint { get; set; }
    public string? DropPoint { get; set; }

    // Facility Allocation - Hostel
    public string? HostelBlock { get; set; }
    public string? FloorLevel { get; set; }
    public string? HostelRoom { get; set; }
    public string? AvailableBed { get; set; }

    [JsonPropertyName("allocatedBedId")]
    public string? AllocatedBedId => AvailableBed;

    // Financial Benefits
    public string? Scholarship { get; set; }
    public string? Discount { get; set; }

    public string Status { get; set; } = string.Empty;
}