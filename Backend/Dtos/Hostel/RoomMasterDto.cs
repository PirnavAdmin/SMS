using System;
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

        [JsonPropertyName("assignedRoomSharing")]
        public string AssignedRoomSharing => $"{RoomTypeSpecification} (Cap: {BedCapacity})";

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
        public string Hierarchy => $"{HostelName} ➔ {FloorLevel}";

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
        [JsonPropertyName("hostelId")]
        public int HostelId { get; set; }

        [JsonIgnore]
        public string? RawHostelBlockText { get; set; }

        [JsonPropertyName("selectHostelBlock")]
        public string? SelectHostelBlockAlias
        {
            get => HostelId > 0 ? HostelId.ToString() : RawHostelBlockText;
            set
            {
                if (!string.IsNullOrWhiteSpace(value) && value != "string")
                {
                    RawHostelBlockText = value;
                    if (int.TryParse(value, out int val)) HostelId = val;
                }
            }
        }

        [JsonPropertyName("hostelBlockId")]
        public string? HostelBlockIdAlias
        {
            get => HostelId > 0 ? HostelId.ToString() : RawHostelBlockText;
            set
            {
                if (!string.IsNullOrWhiteSpace(value) && value != "string")
                {
                    if (string.IsNullOrWhiteSpace(RawHostelBlockText)) RawHostelBlockText = value;
                    if (int.TryParse(value, out int val)) HostelId = val;
                }
            }
        }

        [JsonPropertyName("floorLevel")]
        public string FloorLevel { get; set; } = "1st Floor";

        [JsonPropertyName("floor")]
        public string? FloorAlias
        {
            get => FloorLevel;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string") FloorLevel = value; }
        }

        [JsonPropertyName("roomNumber")]
        public string RoomNumber { get; set; } = string.Empty;

        [JsonPropertyName("roomTypeId")]
        public int RoomTypeId { get; set; }

        [JsonPropertyName("assignedRoomSharing")]
        public string? AssignedRoomSharingAlias { get; set; }

        [JsonPropertyName("roomSharing")]
        public string? RoomSharingAlias
        {
            get => AssignedRoomSharingAlias;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string" && string.IsNullOrWhiteSpace(AssignedRoomSharingAlias)) AssignedRoomSharingAlias = value; }
        }

        [JsonPropertyName("roomCategory")]
        public string? RoomCategoryAlias
        {
            get => AssignedRoomSharingAlias;
            set { if (!string.IsNullOrWhiteSpace(value) && value != "string" && string.IsNullOrWhiteSpace(AssignedRoomSharingAlias)) AssignedRoomSharingAlias = value; }
        }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";
    }
}
