using System;
using System.Collections.Generic;
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

        [JsonPropertyName("roomCategory")]
        public string RoomCategory => RoomTypeSpecification;

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

        [JsonPropertyName("roomCategory")]
        public string? RoomCategoryAlias
        {
            get => RoomTypeSpecification;
            set { if (!string.IsNullOrWhiteSpace(value)) RoomTypeSpecification = value; }
        }

        [JsonPropertyName("bedCapacity")]
        public int BedCapacity { get; set; } = 1;

        [JsonPropertyName("capacity")]
        public int? CapacityAlias
        {
            get => BedCapacity;
            set { if (value.HasValue && value.Value > 0) BedCapacity = value.Value; }
        }

        [JsonPropertyName("acType")]
        public string AcType { get; set; } = "AC";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }

    public class BatchRoomSharingItemDto
    {
        [JsonPropertyName("floorLevel")]
        public string FloorLevel { get; set; } = "1st Floor";

        [JsonPropertyName("categoryName")]
        public string CategoryName { get; set; } = "Double Sharing (AC)";

        [JsonPropertyName("roomCategory")]
        public string? RoomCategoryAlias
        {
            get => CategoryName;
            set { if (!string.IsNullOrWhiteSpace(value)) CategoryName = value; }
        }

        [JsonPropertyName("bedCapacity")]
        public int BedCapacity { get; set; } = 2;

        [JsonPropertyName("acType")]
        public string AcType { get; set; } = "AC";

        [JsonPropertyName("roomsCount")]
        public int RoomsCount { get; set; } = 1;
    }

    public class CreateBatchRoomSharingConfigDto
    {
        [JsonPropertyName("hostelId")]
        public int HostelId { get; set; }

        [JsonPropertyName("floorLevel")]
        public string? FloorLevel { get; set; } = "All Floors";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("layoutNote")]
        public string? LayoutNote
        {
            get => Description;
            set { if (!string.IsNullOrWhiteSpace(value)) Description = value; }
        }

        [JsonPropertyName("items")]
        public List<BatchRoomSharingItemDto> Items { get; set; } = new();
    }
}
