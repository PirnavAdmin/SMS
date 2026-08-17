using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

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

        [JsonPropertyName("student")]
        public string Student => StudentName;

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

        [JsonPropertyName("roomAndBedNo")]
        public string RoomAndBedNo => (!string.IsNullOrWhiteSpace(RoomNumber) || !string.IsNullOrWhiteSpace(BedNumber))
            ? $"Room #{RoomNumber} ({BedNumber})"
            : "Room #N/A";

        [JsonPropertyName("roomAndBed")]
        public string RoomAndBed => RoomAndBedNo;

        [JsonPropertyName("date")]
        public DateTime Date { get; set; }

        [JsonPropertyName("attendanceDate")]
        public string AttendanceDateString => Date.ToString("yyyy-MM-dd");

        [JsonPropertyName("sessionType")]
        public string SessionType { get; set; } = "Morning"; // Morning or Night

        [JsonPropertyName("curfewStatus")]
        public string CurfewStatus { get; set; } = "Present"; // Present, Absent, Half Day, Leave

        [JsonPropertyName("attendanceStatus")]
        public string AttendanceStatus => CurfewStatus;

        [JsonPropertyName("status")]
        public string Status => CurfewStatus;

        [JsonPropertyName("inTime")]
        public string InTime { get; set; } = "07:00 AM";

        [JsonPropertyName("outTime")]
        public string OutTime { get; set; } = "08:30 AM";

        [JsonPropertyName("remarks")]
        public string? Remarks { get; set; }
    }

    public class SaveHostelAttendanceRollCallDto
    {
        [JsonPropertyName("date")]
        public DateTime Date { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("attendanceDate")]
        public DateTime? AttendanceDateAlias
        {
            get => Date;
            set { if (value.HasValue) Date = value.Value; }
        }

        [JsonPropertyName("sessionType")]
        public string SessionType { get; set; } = "Morning";

        [JsonPropertyName("session")]
        public string? SessionAlias
        {
            get => SessionType;
            set { if (!string.IsNullOrWhiteSpace(value)) SessionType = value; }
        }

        [JsonPropertyName("hostelId")]
        public int? HostelId { get; set; }

        [JsonPropertyName("hostelBlock")]
        public string? HostelBlockAlias { get; set; }

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
        public int? RoomId { get; set; }

        [JsonPropertyName("selectRoom")]
        public string? SelectRoomAlias
        {
            get => RoomId?.ToString();
            set { if (int.TryParse(value, out int val)) RoomId = val; }
        }

        [JsonPropertyName("records")]
        public List<HostelStudentAttendanceRecordDto> Records { get; set; } = new();

        [JsonPropertyName("logs")]
        public List<HostelStudentAttendanceRecordDto>? LogsAlias
        {
            get => Records;
            set { if (value != null) Records = value; }
        }

        [JsonPropertyName("items")]
        public List<HostelStudentAttendanceRecordDto>? ItemsAlias
        {
            get => Records;
            set { if (value != null) Records = value; }
        }
    }

    public class HostelStudentAttendanceRecordDto
    {
        [JsonPropertyName("allocationId")]
        public int AllocationId { get; set; }

        [JsonPropertyName("studentId")]
        public int? StudentId { get; set; }

        [JsonPropertyName("curfewStatus")]
        public string CurfewStatus { get; set; } = "Present"; // Present, Absent, Half Day, Leave

        [JsonPropertyName("attendanceStatus")]
        public string? AttendanceStatusAlias
        {
            get => CurfewStatus;
            set { if (!string.IsNullOrWhiteSpace(value)) CurfewStatus = value; }
        }

        [JsonPropertyName("status")]
        public string? StatusAlias
        {
            get => CurfewStatus;
            set { if (!string.IsNullOrWhiteSpace(value)) CurfewStatus = value; }
        }

        [JsonPropertyName("inTime")]
        public string? InTime { get; set; }

        [JsonPropertyName("outTime")]
        public string? OutTime { get; set; }

        [JsonPropertyName("remarks")]
        public string? Remarks { get; set; }
    }
}
