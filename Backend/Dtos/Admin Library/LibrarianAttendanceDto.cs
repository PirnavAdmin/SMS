using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class LibrarianAttendanceDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("attendanceId")]
        public int AttendanceId { get; set; }

        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;

        [JsonPropertyName("staffId")]
        public string StaffId { get; set; } = string.Empty;

        [JsonPropertyName("employeeCode")]
        public string EmployeeCode
        {
            get => StaffId;
            set { if (!string.IsNullOrWhiteSpace(value)) StaffId = value; }
        }

        [JsonPropertyName("staffName")]
        public string StaffName { get; set; } = string.Empty;

        [JsonPropertyName("role")]
        public string Role { get; set; } = "Librarian";

        [JsonPropertyName("shift")]
        public string Shift { get; set; } = "Morning Shift (08:30 - 17:00)";

        [JsonPropertyName("shiftDetails")]
        public string ShiftDetails
        {
            get => Shift;
            set { if (!string.IsNullOrWhiteSpace(value)) Shift = value; }
        }

        [JsonPropertyName("checkInTime")]
        public string CheckInTime { get; set; } = string.Empty;

        [JsonPropertyName("checkOutTime")]
        public string CheckOutTime { get; set; } = string.Empty;

        [JsonPropertyName("workingHours")]
        public string WorkingHours { get; set; } = string.Empty;

        [JsonPropertyName("totalHours")]
        public double TotalHours { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Present";

        [JsonPropertyName("remarks")]
        public string DutyRemarks { get; set; } = string.Empty;

        [JsonPropertyName("dutyRemarks")]
        public string DutyRemarksAlias
        {
            get => DutyRemarks;
            set { if (!string.IsNullOrWhiteSpace(value)) DutyRemarks = value; }
        }
    }

    public class CreateLibrarianAttendanceDto
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;

        [JsonPropertyName("staffName")]
        public string StaffName { get; set; } = string.Empty;

        [JsonPropertyName("staffId")]
        public string StaffId { get; set; } = string.Empty;

        [JsonPropertyName("employeeCode")]
        public string EmployeeCode
        {
            get => StaffId;
            set { if (!string.IsNullOrWhiteSpace(value)) StaffId = value; }
        }

        [JsonPropertyName("role")]
        public string? Role { get; set; }

        [JsonPropertyName("shift")]
        public string Shift { get; set; } = "Morning Shift (08:30 - 17:00)";

        [JsonPropertyName("shiftDetails")]
        public string ShiftDetails
        {
            get => Shift;
            set { if (!string.IsNullOrWhiteSpace(value)) Shift = value; }
        }

        [JsonPropertyName("checkInTime")]
        public string? CheckInTime { get; set; }

        [JsonPropertyName("checkOutTime")]
        public string? CheckOutTime { get; set; }

        [JsonPropertyName("workingHours")]
        public string? WorkingHours { get; set; }

        [JsonPropertyName("totalHours")]
        public double TotalHours { get; set; } = 8.5;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Present";

        [JsonPropertyName("remarks")]
        public string? Remarks { get; set; }

        [JsonPropertyName("dutyRemarks")]
        public string? DutyRemarks
        {
            get => Remarks;
            set { if (!string.IsNullOrWhiteSpace(value)) Remarks = value; }
        }
    }
}
