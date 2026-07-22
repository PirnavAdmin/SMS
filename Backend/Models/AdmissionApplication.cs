using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models
{
    public class AdmissionApplication
    {
        [Key]
        public long ApplicationId { get; set; }

        public string RegistrationNo { get; set; } = string.Empty;
        public string ApplicantFullName { get; set; } = string.Empty;
        public string AppliedClass { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public DateTime Dob { get; set; }
        public string BloodGroup { get; set; } = string.Empty;
        public string? Religion { get; set; }
        public string CasteCategory { get; set; } = string.Empty;
        public string FatherFullName { get; set; } = string.Empty;
        public string? MotherFullName { get; set; }
        public string FatherMobileNo { get; set; } = string.Empty;

        // Address Fields
        public string? HouseNo { get; set; }
        public string? Street { get; set; }
        public string? AreaLocality { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? PinCode { get; set; }

        public int NumberOfSiblings { get; set; } = 0;
        public string? SiblingStudentId { get; set; }
        public string StudentType { get; set; } = "Day Scholar";

        // Transport Info
        public bool TransportRequired { get; set; } = false;
        public string? TransportType { get; set; }
        public string? BusRoute { get; set; }
        public string? PickupPoint { get; set; }
        public string? DropPoint { get; set; }

        // Hostel Info
        public string? HostelBlock { get; set; }
        public string? FloorLevel { get; set; }
        public string? AllocatedBedId { get; set; }

        public long? BranchId { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}