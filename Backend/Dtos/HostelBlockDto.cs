using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class HostelBlockDto
    {
        [JsonPropertyName("hostelId")]
        public int HostelId { get; set; }

        [JsonPropertyName("id")]
        public int Id => HostelId;

        [JsonPropertyName("hostelName")]
        public string HostelName { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name => HostelName;

        [JsonPropertyName("hostelCode")]
        public string HostelCode { get; set; } = string.Empty;

        [JsonPropertyName("code")]
        public string Code => HostelCode;

        [JsonPropertyName("hostelType")]
        public string HostelType { get; set; } = "Boys Hostel";

        [JsonPropertyName("type")]
        public string Type => HostelType;

        [JsonPropertyName("wardenName")]
        public string? WardenName { get; set; }

        [JsonPropertyName("warden")]
        public string? Warden => WardenName;

        [JsonPropertyName("primaryMobileNumber")]
        public string? PrimaryMobileNumber { get; set; }

        [JsonPropertyName("alternateMobileNumber")]
        public string? AlternateMobileNumber { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("address")]
        public string? Address { get; set; }

        [JsonPropertyName("campusAddress")]
        public string? CampusAddress => Address;

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("totalRooms")]
        public int TotalRooms { get; set; }

        [JsonPropertyName("roomsCount")]
        public int RoomsCount => TotalRooms;

        [JsonPropertyName("occupiedBeds")]
        public int OccupiedBeds { get; set; }

        [JsonPropertyName("totalCapacity")]
        public int TotalCapacity { get; set; }
    }

    public class CreateHostelBlockDto
    {
        [Required(ErrorMessage = "Hostel Name is required.")]
        [JsonPropertyName("hostelName")]
        public string HostelName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Hostel Code is required.")]
        [JsonPropertyName("hostelCode")]
        public string HostelCode { get; set; } = string.Empty;

        [JsonPropertyName("hostelType")]
        public string HostelType { get; set; } = "Boys Hostel";

        [JsonPropertyName("wardenName")]
        public string? WardenName { get; set; }

        [JsonPropertyName("primaryMobileNumber")]
        public string? PrimaryMobileNumber { get; set; }

        [JsonPropertyName("alternateMobileNumber")]
        public string? AlternateMobileNumber { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("address")]
        public string? Address { get; set; }

        [JsonPropertyName("campusAddress")]
        public string? CampusAddress
        {
            get => Address;
            set => Address = value;
        }
    }
}
