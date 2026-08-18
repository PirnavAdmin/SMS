using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos
{
    public class BedAllocationDto
    {
        [JsonPropertyName("allocationId")]
        public int AllocationId { get; set; }

        [JsonPropertyName("id")]
        public int Id => AllocationId;

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

        [JsonPropertyName("registrationNo")]
        public string RegistrationNo => AdmissionNo;

        [JsonPropertyName("className")]
        public string ClassName { get; set; } = string.Empty;

        [JsonPropertyName("hostelId")]
        public int HostelId { get; set; }

        [JsonPropertyName("hostelName")]
        public string HostelName { get; set; } = string.Empty;

        [JsonPropertyName("hostelFacility")]
        public string HostelFacility => !string.IsNullOrWhiteSpace(HostelName) ? HostelName : "N/A";

        [JsonPropertyName("roomId")]
        public int RoomId { get; set; }

        [JsonPropertyName("roomNumber")]
        public string RoomNumber { get; set; } = string.Empty;

        [JsonPropertyName("floorLevel")]
        public string FloorLevel { get; set; } = string.Empty;

        [JsonPropertyName("bedNumber")]
        public string BedNumber { get; set; } = string.Empty;

        [JsonPropertyName("roomAndBed")]
        public string RoomAndBed => (RoomId > 0 || !string.IsNullOrWhiteSpace(RoomNumber))
            ? $"Room #{RoomNumber} ({BedNumber})"
            : "Room #N/A (N/A)";

        [JsonPropertyName("joiningDate")]
        public DateTime JoiningDate { get; set; }

        [JsonPropertyName("joiningDateString")]
        public string JoiningDateString => JoiningDate.ToString("yyyy-MM-ddTHH:mm:ss.ffffff");

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("curfewStatus")]
        public string CurfewStatus { get; set; } = "Present";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateBedAllocationDto
    {
        [JsonPropertyName("studentId")]
        public int StudentId { get; set; }

        [JsonPropertyName("selectStudent")]
        public string? SelectStudentAlias
        {
            get => StudentId > 0 ? StudentId.ToString() : AdmissionNo;
            set
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (int.TryParse(value, out int parsedId)) StudentId = parsedId;
                    else AdmissionNo = value;
                }
            }
        }

        [JsonPropertyName("selectHostellerStudent")]
        public string? SelectHostellerStudentAlias
        {
            get => StudentId > 0 ? StudentId.ToString() : AdmissionNo;
            set
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (int.TryParse(value, out int parsedId)) StudentId = parsedId;
                    else AdmissionNo = value;
                }
            }
        }

        [JsonPropertyName("studentName")]
        public string? StudentName { get; set; }

        [JsonPropertyName("admissionNo")]
        public string? AdmissionNo { get; set; }

        [JsonPropertyName("admNo")]
        public string? AdmNoAlias
        {
            get => AdmissionNo;
            set { if (!string.IsNullOrWhiteSpace(value)) AdmissionNo = value; }
        }

        [JsonPropertyName("hostelId")]
        public int HostelId { get; set; }

        [JsonPropertyName("selectHostelBlock")]
        public string? SelectHostelBlockAlias
        {
            get => HostelId.ToString();
            set { if (int.TryParse(value, out int val)) HostelId = val; }
        }

        [JsonPropertyName("selectHostelFacility")]
        public string? SelectHostelFacilityAlias
        {
            get => HostelId.ToString();
            set { if (int.TryParse(value, out int val)) HostelId = val; }
        }

        [JsonPropertyName("hostelName")]
        public string? HostelName { get; set; }

        [JsonPropertyName("roomId")]
        public int RoomId { get; set; }

        [JsonPropertyName("selectRoom")]
        public string? SelectRoomAlias
        {
            get => RoomId.ToString();
            set { if (int.TryParse(value, out int val)) RoomId = val; }
        }

        [JsonPropertyName("roomNumber")]
        public string? RoomNumber { get; set; }

        [JsonPropertyName("bedNumber")]
        public string? BedNumber { get; set; }

        [JsonPropertyName("selectBedNumber")]
        public string? SelectBedNumberAlias
        {
            get => BedNumber;
            set { if (!string.IsNullOrWhiteSpace(value)) BedNumber = value; }
        }

        [JsonPropertyName("allocatedBedId")]
        public string? AllocatedBedId
        {
            get => BedNumber;
            set => BedNumber = value;
        }

        [JsonPropertyName("joiningDate")]
        public DateTime JoiningDate { get; set; } = DateTime.UtcNow;
    }
}
