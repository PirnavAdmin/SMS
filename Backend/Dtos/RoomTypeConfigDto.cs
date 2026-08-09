using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class RoomTypeConfigDto
    {
        [JsonPropertyName("roomTypeId")]
        public int RoomTypeId { get; set; }

        [JsonPropertyName("id")]
        public int Id => RoomTypeId;

        [JsonPropertyName("roomTypeSpecification")]
        public string RoomTypeSpecification { get; set; } = string.Empty;

        [JsonPropertyName("specification")]
        public string Specification => RoomTypeSpecification;

        [JsonPropertyName("roomTypeName")]
        public string RoomTypeName => RoomTypeSpecification;

        [JsonPropertyName("bedCapacity")]
        public int BedCapacity { get; set; }

        [JsonPropertyName("capacity")]
        public int Capacity => BedCapacity;

        [JsonPropertyName("acType")]
        public string AcType { get; set; } = "AC";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateRoomTypeConfigDto
    {
        [Required(ErrorMessage = "Room Type Specification is required.")]
        [JsonPropertyName("roomTypeSpecification")]
        public string RoomTypeSpecification { get; set; } = string.Empty;

        [JsonPropertyName("specification")]
        public string? SpecificationAlias
        {
            get => RoomTypeSpecification;
            set { if (!string.IsNullOrWhiteSpace(value)) RoomTypeSpecification = value; }
        }

        [JsonPropertyName("roomTypeName")]
        public string? RoomTypeNameAlias
        {
            get => RoomTypeSpecification;
            set { if (!string.IsNullOrWhiteSpace(value)) RoomTypeSpecification = value; }
        }

        [Required(ErrorMessage = "Bed Capacity is required.")]
        [Range(1, 20, ErrorMessage = "Bed Capacity must be between 1 and 20.")]
        [JsonPropertyName("bedCapacity")]
        public int BedCapacity { get; set; } = 1;

        [JsonPropertyName("capacity")]
        public int? CapacityAlias
        {
            get => BedCapacity;
            set { if (value.HasValue) BedCapacity = value.Value; }
        }

        [Required(ErrorMessage = "AC Type is required.")]
        [JsonPropertyName("acType")]
        public string AcType { get; set; } = "AC";

        [Required(ErrorMessage = "Status is required.")]
        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }
}
