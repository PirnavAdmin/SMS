using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class MeetingCreateDto
    {
        [JsonPropertyName("meetingAudience")]
        public string MeetingAudience { get; set; } = "Individual Meeting";

        [JsonPropertyName("audience")]
        public string? AudienceAlias
        {
            get => MeetingAudience;
            set { if (!string.IsNullOrWhiteSpace(value)) MeetingAudience = value; }
        }

        [JsonPropertyName("audienceType")]
        public string? AudienceTypeAlias
        {
            get => MeetingAudience;
            set { if (!string.IsNullOrWhiteSpace(value)) MeetingAudience = value; }
        }

        [JsonPropertyName("participantType")]
        public string ParticipantType { get; set; } = "Parent";

        [JsonPropertyName("participantName")]
        public string ParticipantName { get; set; } = "Robert Wright";

        [JsonPropertyName("participantPhone")]
        public string? ParticipantPhone { get; set; } = "9876543210";

        [JsonPropertyName("wardStudentName")]
        public string? WardStudentName { get; set; } = "Alexander Wright";

        [JsonPropertyName("studentName")]
        public string? StudentNameAlias
        {
            get => WardStudentName;
            set { if (!string.IsNullOrWhiteSpace(value)) WardStudentName = value; }
        }

        [JsonPropertyName("wardAdmissionNo")]
        public string? WardAdmissionNo { get; set; } = "ADM2024-001";

        [JsonPropertyName("admissionNo")]
        public string? AdmissionNoAlias
        {
            get => WardAdmissionNo;
            set { if (!string.IsNullOrWhiteSpace(value)) WardAdmissionNo = value; }
        }

        [JsonPropertyName("wardClass")]
        public string? WardClass { get; set; } = "Class 10-A";

        [JsonPropertyName("className")]
        public string? ClassNameAlias
        {
            get => WardClass;
            set { if (!string.IsNullOrWhiteSpace(value)) WardClass = value; }
        }

        [Required(ErrorMessage = "Meeting Title is required.")]
        [JsonPropertyName("meetingTitle")]
        public string MeetingTitle { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string? TitleAlias
        {
            get => MeetingTitle;
            set { if (!string.IsNullOrWhiteSpace(value)) MeetingTitle = value; }
        }

        [JsonPropertyName("agenda")]
        public string? Agenda { get; set; }

        [JsonPropertyName("description")]
        public string? DescriptionAlias
        {
            get => Agenda;
            set { if (!string.IsNullOrWhiteSpace(value)) Agenda = value; }
        }

        [JsonPropertyName("meetingMode")]
        public string MeetingMode { get; set; } = "In-Person";

        [JsonPropertyName("mode")]
        public string? ModeAlias
        {
            get => MeetingMode;
            set { if (!string.IsNullOrWhiteSpace(value)) MeetingMode = value; }
        }

        [JsonPropertyName("building")]
        public string? Building { get; set; } = "Academic Block A";

        [JsonPropertyName("floor")]
        public string? Floor { get; set; } = "1st Floor";

        [JsonPropertyName("meetingRoom")]
        public string? MeetingRoom { get; set; } = "Conference Room 102";

        [JsonPropertyName("venue")]
        public string? VenueAlias
        {
            get => MeetingRoom;
            set { if (!string.IsNullOrWhiteSpace(value)) MeetingRoom = value; }
        }

        [JsonPropertyName("roomCapacity")]
        public int RoomCapacity { get; set; } = 15;

        [JsonPropertyName("meetingDate")]
        public string MeetingDate { get; set; } = "2026-08-09";

        [JsonPropertyName("date")]
        public string? DateAlias
        {
            get => MeetingDate;
            set { if (!string.IsNullOrWhiteSpace(value)) MeetingDate = value; }
        }

        [JsonPropertyName("startTime")]
        public string StartTime { get; set; } = "10:00";

        [JsonPropertyName("endTime")]
        public string EndTime { get; set; } = "10:30";

        [JsonPropertyName("meetingStatus")]
        public string MeetingStatus { get; set; } = "SCHEDULED";

        [JsonPropertyName("status")]
        public string? StatusAlias
        {
            get => MeetingStatus;
            set { if (!string.IsNullOrWhiteSpace(value)) MeetingStatus = value; }
        }
    }
}
