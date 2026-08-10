using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos
{
    public class RoomMasterDto
    {
        [JsonPropertyName("roomId")]
        public int RoomId { get; set; }

        [JsonPropertyName("id")]
        public int Id => RoomId;

        [JsonPropertyName("hostelId")]
        public int HostelId { get; set; }

        [JsonPropertyName("hostelName")]
        public string HostelName { get; set; } = string.Empty;

        [JsonPropertyName("hostelCode")]
        public string HostelCode { get; set; } = string.Empty;

        [JsonPropertyName("roomTypeId")]
        public int RoomTypeId { get; set; }

        [JsonPropertyName("roomTypeSpecification")]
        public string RoomTypeSpecification { get; set; } = string.Empty;

        [JsonPropertyName("roomCategory")]
        public string RoomCategory => RoomTypeSpecification;

        [JsonPropertyName("roomTypeName")]
        public string RoomTypeName => RoomTypeSpecification;

        [JsonPropertyName("bedCapacity")]
        public int BedCapacity { get; set; }

        [JsonPropertyName("capacity")]
        public int Capacity => BedCapacity;

        [JsonPropertyName("capacityString")]
        public string CapacityString => $"{OccupiedBeds} / {BedCapacity} Beds Occupied";

        [JsonPropertyName("vacantString")]
        public string VacantString => $"{VacantBeds} Beds Vacant";

        [JsonPropertyName("floorLevel")]
        public string FloorLevel { get; set; } = string.Empty;

        [JsonPropertyName("floor")]
        public string Floor => FloorLevel;

        [JsonPropertyName("hierarchy")]
        public string Hierarchy => $"{HostelName} – {FloorLevel}";

        [JsonPropertyName("roomNumber")]
        public string RoomNumber { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("occupiedBeds")]
        public int OccupiedBeds { get; set; }

        [JsonPropertyName("vacantBeds")]
        public int VacantBeds { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateRoomMasterDto
    {
        [Required(ErrorMessage = "Hostel Block is required.")]
        [JsonPropertyName("hostelId")]
        public int HostelId { get; set; }

        [JsonPropertyName("selectHostelBlock")]
        public string? SelectHostelBlockAlias
        {
            get => HostelId.ToString();
            set { if (int.TryParse(value, out int val)) HostelId = val; }
        }

        [Required(ErrorMessage = "Floor Level is required.")]
        [JsonPropertyName("floorLevel")]
        public string FloorLevel { get; set; } = "1st Floor";

        [JsonPropertyName("floor")]
        public string? FloorAlias
        {
            get => FloorLevel;
            set { if (!string.IsNullOrWhiteSpace(value)) FloorLevel = value; }
        }

        [Required(ErrorMessage = "Room Number is required.")]
        [JsonPropertyName("roomNumber")]
        public string RoomNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Room Type is required.")]
        [JsonPropertyName("roomTypeId")]
        public int RoomTypeId { get; set; }

        [JsonPropertyName("roomCategory")]
        public string? RoomCategoryAlias
        {
            get => RoomTypeId.ToString();
            set { if (int.TryParse(value, out int val)) RoomTypeId = val; }
        }

        [Required(ErrorMessage = "Status is required.")]
        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";
    }
}
