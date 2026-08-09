using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos
{
    public class HostelAttendanceDto
    {
        [JsonPropertyName("attendanceId")]
        public long AttendanceId { get; set; }

        [JsonPropertyName("id")]
        public long Id => AttendanceId;

        [JsonPropertyName("allocationId")]
        public int AllocationId { get; set; }

        [JsonPropertyName("studentId")]
        public int StudentId { get; set; }

        [JsonPropertyName("studentName")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("admissionNo")]
        public string AdmissionNo { get; set; } = string.Empty;

        [JsonPropertyName("admNo")]
        public string AdmNo => AdmissionNo;

        [JsonPropertyName("hostelName")]
        public string HostelName { get; set; } = string.Empty;

        [JsonPropertyName("hostelBlock")]
        public string HostelBlock => HostelName;

        [JsonPropertyName("roomNumber")]
        public string RoomNumber { get; set; } = string.Empty;

        [JsonPropertyName("roomNo")]
        public string RoomNo => RoomNumber;

        [JsonPropertyName("floorLevel")]
        public string FloorLevel { get; set; } = string.Empty;

        [JsonPropertyName("bedNumber")]
        public string BedNumber { get; set; } = string.Empty;

        [JsonPropertyName("bedNo")]
        public string BedNo => BedNumber;

        [JsonPropertyName("date")]
        public DateTime Date { get; set; }

        [JsonPropertyName("curfewStatus")]
        public string CurfewStatus { get; set; } = "Present"; // Present, Absent, Late Night Pass, On Leave

        [JsonPropertyName("remarks")]
        public string? Remarks { get; set; }
    }

    public class SaveHostelAttendanceRollCallDto
    {
        [Required]
        [JsonPropertyName("date")]
        public DateTime Date { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("hostelId")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public int? HostelId { get; set; }

        [JsonPropertyName("selectBlock")]
        public string? SelectBlockAlias
        {
            get => HostelId?.ToString();
            set { if (int.TryParse(value, out int val)) HostelId = val; }
        }

        [JsonPropertyName("floorLevel")]
        public string? FloorLevel { get; set; }

        [JsonPropertyName("selectFloor")]
        public string? SelectFloorAlias
        {
            get => FloorLevel;
            set { if (!string.IsNullOrWhiteSpace(value)) FloorLevel = value; }
        }

        [JsonPropertyName("roomId")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public int? RoomId { get; set; }

        [JsonPropertyName("selectRoom")]
        public string? SelectRoomAlias
        {
            get => RoomId?.ToString();
            set { if (int.TryParse(value, out int val)) RoomId = val; }
        }

        [Required]
        [JsonPropertyName("records")]
        public List<HostelStudentAttendanceRecordDto> Records { get; set; } = new();
    }

    public class HostelStudentAttendanceRecordDto
    {
        [Required]
        [JsonPropertyName("allocationId")]
        public int AllocationId { get; set; }

        [Required]
        [JsonPropertyName("curfewStatus")]
        public string CurfewStatus { get; set; } = "Present"; // Present, Absent, Late Night Pass, On Leave

        [JsonPropertyName("remarks")]
        public string? Remarks { get; set; }
    }
}
