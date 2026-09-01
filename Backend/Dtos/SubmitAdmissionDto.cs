using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos;

public class SubmitAdmissionDto
{
    [JsonPropertyName("avatar")]
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

    [JsonPropertyName("gender")]
    public string Gender { get; set; } = "Male";

    [JsonPropertyName("appliedClassId")]
    public int AppliedClassId { get; set; }

    [JsonPropertyName("appliedClass")]
    public string? AppliedClass { get; set; }

    [JsonPropertyName("branch")]
    public string BranchName { get; set; } = "Main Campus";

    [JsonPropertyName("studentType")]
    public string StudentType { get; set; } = "Non-Residential";

    [JsonPropertyName("bloodGroup")]
    public string? BloodGroup { get; set; }

    [JsonPropertyName("religion")]
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

    [JsonPropertyName("phone")]
    public string? Phone
    {
        get => FatherContact;
        set { if (!string.IsNullOrWhiteSpace(value)) FatherContact = value; }
    }

    [JsonPropertyName("motherMobileNumber")]
    public string? MotherMobileNumber { get; set; }

    [JsonPropertyName("motherPhone")]
    public string? MotherPhone
    {
        get => MotherMobileNumber;
        set { if (!string.IsNullOrWhiteSpace(value)) MotherMobileNumber = value; }
    }

    [JsonPropertyName("alternateMobileNumber")]
    public string? AlternateMobileNumber { get; set; }

    [JsonPropertyName("alternatePhone")]
    public string? AlternatePhone
    {
        get => AlternateMobileNumber;
        set { if (!string.IsNullOrWhiteSpace(value)) AlternateMobileNumber = value; }
    }

    private string? _parentEmail;

    [JsonPropertyName("email")]
    public string? Email
    {
        get => _parentEmail;
        set => _parentEmail = value;
    }

    public string? ParentEmail
    {
        get => _parentEmail;
        set => _parentEmail = value;
    }

    // Residential Address
    [JsonPropertyName("houseNo")]
    public string? HouseNo { get; set; }

    [JsonPropertyName("street")]
    public string? Street { get; set; }

    [JsonPropertyName("areaLocality")]
    public string? AreaLocality { get; set; }

    [JsonPropertyName("city")]
    public string? City { get; set; }

    [JsonPropertyName("district")]
    public string? District { get; set; }

    [JsonPropertyName("state")]
    public string? State { get; set; }

    [JsonPropertyName("pinCode")]
    public string? PinCode { get; set; }

    // Sibling Info
    [JsonPropertyName("numberOfSiblings")]
    public int NumberOfSiblings { get; set; } = 0;

    [JsonPropertyName("existingSiblingLookup")]
    public string? ExistingSiblingLookup { get; set; }

    [JsonPropertyName("siblingStudentId")]
    public string? SiblingStudentId { get; set; }

    // Transport Facility Allocation
    [JsonPropertyName("transportRequired")]
    public bool TransportRequired { get; set; } = false;

    [JsonPropertyName("transportType")]
    public string? TransportType { get; set; }

    [JsonPropertyName("busRoute")]
    public string? BusRoute { get; set; }

    [JsonPropertyName("pickupPoint")]
    public string? PickupPoint { get; set; }

    [JsonPropertyName("dropPoint")]
    public string? DropPoint { get; set; }

    // Hostel Facility Allocation
    [JsonPropertyName("hostelBlock")]
    public string? HostelBlock { get; set; }

    [JsonPropertyName("floorLevel")]
    public string? FloorLevel { get; set; }

    [JsonPropertyName("hostelRoom")]
    public string? HostelRoom { get; set; }

    [JsonPropertyName("availableBed")]
    public string? AvailableBed { get; set; }

    [JsonPropertyName("allocatedBedId")]
    public string? AllocatedBedId
    {
        get => AvailableBed;
        set => AvailableBed = value;
    }

    // Financial Benefits
    [JsonPropertyName("scholarship")]
    public string? Scholarship { get; set; } = "None";

    [JsonPropertyName("discount")]
    public string? Discount { get; set; } = "None";
}