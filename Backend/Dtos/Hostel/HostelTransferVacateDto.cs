using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class HostelTransferVacateDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("requestId")]
        public int RequestId => Id;

        [JsonPropertyName("studentId")]
        public int StudentId { get; set; }

        [JsonPropertyName("studentName")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("student")]
        public string Student => StudentName;

        [JsonPropertyName("admissionNo")]
        public string? AdmissionNo { get; set; }

        [JsonPropertyName("admNo")]
        public string? AdmNo => AdmissionNo;

        [JsonPropertyName("actionType")]
        public string ActionType { get; set; } = "Room Transfer";

        [JsonPropertyName("currentRoom")]
        public string? CurrentRoom { get; set; }

        [JsonPropertyName("destinationHostelId")]
        public int? DestinationHostelId { get; set; }

        [JsonPropertyName("destinationHostelName")]
        public string? DestinationHostelName { get; set; }

        [JsonPropertyName("destinationRoomId")]
        public int? DestinationRoomId { get; set; }

        [JsonPropertyName("destinationRoomNumber")]
        public string? DestinationRoomNumber { get; set; }

        [JsonPropertyName("destinationBedNumber")]
        public string? DestinationBedNumber { get; set; }

        [JsonPropertyName("targetRoomOrFeeAdjustment")]
        public string TargetRoomOrFeeAdjustment => ActionType.Equals("Bed Vacate", StringComparison.OrdinalIgnoreCase)
            ? "Checkout & Switch to Day Scholar"
            : (!string.IsNullOrWhiteSpace(DestinationHostelName) || !string.IsNullOrWhiteSpace(DestinationRoomNumber))
                ? $"{DestinationHostelName ?? "Block"} - Room #{DestinationRoomNumber ?? "N/A"} ({DestinationBedNumber ?? "Bed #1"})"
                : "Checkout & Switch to Day Scholar";

        [JsonPropertyName("reason")]
        public string? Reason { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Approved";

        [JsonPropertyName("date")]
        public DateTime Date => CreatedAt;

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateHostelTransferVacateDto
    {
        [JsonPropertyName("studentId")]
        public int StudentId { get; set; }

        [JsonPropertyName("selectResidentStudent")]
        public string? SelectResidentStudentAlias
        {
            get => StudentId.ToString();
            set
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (int.TryParse(value, out int parsed)) StudentId = parsed;
                    else StudentName = value;
                }
            }
        }

        [JsonPropertyName("studentName")]
        public string? StudentName { get; set; }

        [JsonPropertyName("actionType")]
        public string ActionType { get; set; } = "Room Transfer (Change Room/Block)";

        [JsonPropertyName("destinationHostelId")]
        public int? DestinationHostelId { get; set; }

        [JsonPropertyName("destinationHostelBlock")]
        public string? DestinationHostelBlockAlias
        {
            get => DestinationHostelId?.ToString();
            set
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (int.TryParse(value, out int parsed)) DestinationHostelId = parsed;
                    else DestinationHostelName = value;
                }
            }
        }

        [JsonPropertyName("destinationHostelName")]
        public string? DestinationHostelName { get; set; }

        [JsonPropertyName("destinationRoomId")]
        public int? DestinationRoomId { get; set; }

        [JsonPropertyName("destinationRoom")]
        public string? DestinationRoomAlias
        {
            get => DestinationRoomId?.ToString();
            set
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (int.TryParse(value, out int parsed)) DestinationRoomId = parsed;
                    else DestinationRoomNumber = value;
                }
            }
        }

        [JsonPropertyName("destinationRoomNumber")]
        public string? DestinationRoomNumber { get; set; }

        [JsonPropertyName("destinationBedNumber")]
        public string? DestinationBedNumber { get; set; }

        [JsonPropertyName("reason")]
        public string? Reason { get; set; }
    }
}
