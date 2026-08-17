using System;
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

        [JsonPropertyName("blockName")]
        public string BlockName => HostelName;

        [JsonPropertyName("hostelCode")]
        public string HostelCode { get; set; } = string.Empty;

        [JsonPropertyName("code")]
        public string Code => HostelCode;

        [JsonPropertyName("blockCode")]
        public string BlockCode => HostelCode;

        [JsonPropertyName("hostelType")]
        public string HostelType { get; set; } = "Boys Hostel";

        [JsonPropertyName("type")]
        public string Type => HostelType;

        [JsonPropertyName("category")]
        public string Category => HostelType;

        [JsonPropertyName("totalFloors")]
        public int TotalFloors { get; set; } = 1;

        [JsonPropertyName("floorsCount")]
        public int FloorsCount => TotalFloors;

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

        [JsonPropertyName("location")]
        public string? Location => Address;

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
        private string _hostelName = string.Empty;
        private string _hostelCode = string.Empty;
        private string _hostelType = "Boys Hostel";
        private string? _address;

        [JsonPropertyName("hostelName")]
        public string HostelName
        {
            get => _hostelName;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string") _hostelName = value; }
        }

        [JsonPropertyName("blockName")]
        public string? BlockName
        {
            get => _hostelName;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string" && string.IsNullOrWhiteSpace(_hostelName)) _hostelName = value; }
        }

        [JsonPropertyName("name")]
        public string? Name
        {
            get => _hostelName;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string" && string.IsNullOrWhiteSpace(_hostelName)) _hostelName = value; }
        }

        [JsonPropertyName("hostelCode")]
        public string HostelCode
        {
            get => _hostelCode;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string") _hostelCode = value; }
        }

        [JsonPropertyName("blockCode")]
        public string? BlockCode
        {
            get => _hostelCode;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string" && string.IsNullOrWhiteSpace(_hostelCode)) _hostelCode = value; }
        }

        [JsonPropertyName("code")]
        public string? Code
        {
            get => _hostelCode;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string" && string.IsNullOrWhiteSpace(_hostelCode)) _hostelCode = value; }
        }

        [JsonPropertyName("hostelType")]
        public string HostelType
        {
            get => _hostelType;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string") _hostelType = value; }
        }

        [JsonPropertyName("category")]
        public string? Category
        {
            get => _hostelType;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string" && string.IsNullOrWhiteSpace(_hostelType)) _hostelType = value; }
        }

        [JsonPropertyName("type")]
        public string? Type
        {
            get => _hostelType;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string" && string.IsNullOrWhiteSpace(_hostelType)) _hostelType = value; }
        }

        [JsonPropertyName("totalFloors")]
        public int TotalFloors { get; set; } = 1;

        [JsonPropertyName("floorsCount")]
        public int? FloorsCount
        {
            get => TotalFloors;
            set { if (value.HasValue && value.Value > 0) TotalFloors = value.Value; }
        }

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
        public string? Address
        {
            get => _address;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string") _address = value; }
        }

        [JsonPropertyName("location")]
        public string? Location
        {
            get => _address;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string" && string.IsNullOrWhiteSpace(_address)) _address = value; }
        }

        [JsonPropertyName("campusAddress")]
        public string? CampusAddress
        {
            get => _address;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string" && string.IsNullOrWhiteSpace(_address)) _address = value; }
        }
    }
}
