using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class MeetingResponseDto
    {
        [JsonPropertyName("meetingId")]
        public int MeetingId { get; set; }

        [JsonPropertyName("id")]
        public int Id => MeetingId;

        [JsonPropertyName("meetingAudience")]
        public string MeetingAudience { get; set; } = "Individual Meeting";

        [JsonPropertyName("audience")]
        public string Audience => MeetingAudience;

        [JsonPropertyName("audienceType")]
        public string AudienceType => MeetingAudience;

        [JsonPropertyName("participantType")]
        public string ParticipantType { get; set; } = "Parent";

        [JsonPropertyName("participantName")]
        public string ParticipantName { get; set; } = string.Empty;

        [JsonPropertyName("participantPhone")]
        public string? ParticipantPhone { get; set; }

        [JsonPropertyName("wardStudentName")]
        public string? WardStudentName { get; set; }

        [JsonPropertyName("wardAdmissionNo")]
        public string? WardAdmissionNo { get; set; }

        [JsonPropertyName("wardClass")]
        public string? WardClass { get; set; }

        [JsonPropertyName("participantDetails")]
        public string ParticipantDetails => !string.IsNullOrWhiteSpace(WardStudentName)
            ? $"{ParticipantName} (Parent of {WardStudentName} - {WardClass} • {WardAdmissionNo})"
            : ParticipantName;

        [JsonPropertyName("meetingTitle")]
        public string MeetingTitle { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title => MeetingTitle;

        [JsonPropertyName("agenda")]
        public string? Agenda { get; set; }

        [JsonPropertyName("description")]
        public string? Description => Agenda;

        [JsonPropertyName("meetingMode")]
        public string MeetingMode { get; set; } = "In-Person";

        [JsonPropertyName("mode")]
        public string Mode => MeetingMode;

        [JsonPropertyName("building")]
        public string? Building { get; set; } = "Academic Block A";

        [JsonPropertyName("floor")]
        public string? Floor { get; set; } = "1st Floor";

        [JsonPropertyName("meetingRoom")]
        public string? MeetingRoom { get; set; } = "Conference Room 204";

        [JsonPropertyName("venue")]
        public string Venue => !string.IsNullOrWhiteSpace(MeetingRoom) ? MeetingRoom : $"{Building}, {Floor}";

        [JsonPropertyName("roomCapacity")]
        public int RoomCapacity { get; set; } = 15;

        [JsonPropertyName("meetingDate")]
        public string MeetingDate { get; set; } = string.Empty;

        [JsonPropertyName("date")]
        public string Date => MeetingDate;

        [JsonPropertyName("startTime")]
        public string StartTime { get; set; } = "14:00";

        [JsonPropertyName("endTime")]
        public string EndTime { get; set; } = "14:30";

        [JsonPropertyName("timeRange")]
        public string TimeRange => $"{StartTime} - {EndTime}";

        [JsonPropertyName("meetingStatus")]
        public string MeetingStatus { get; set; } = "SCHEDULED";

        [JsonPropertyName("status")]
        public string Status => MeetingStatus;
    }

    public class ParticipantLookupDto
    {
        [JsonPropertyName("participantId")]
        public int ParticipantId { get; set; }

        [JsonPropertyName("participantName")]
        public string ParticipantName { get; set; } = string.Empty;

        [JsonPropertyName("participantType")]
        public string ParticipantType { get; set; } = "Parent";

        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        [JsonPropertyName("studentName")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("admissionNo")]
        public string AdmissionNo { get; set; } = string.Empty;

        [JsonPropertyName("className")]
        public string ClassName { get; set; } = string.Empty;

        [JsonPropertyName("displayText")]
        public string DisplayText => $"Parent: {ParticipantName} ({Phone}) - Ward: {StudentName} ({AdmissionNo} • {ClassName})";
    }

    public class PaginatedMeetingResultDto
    {
        [JsonPropertyName("totalCount")]
        public int TotalCount { get; set; }

        [JsonPropertyName("totalEntries")]
        public int TotalEntries => TotalCount;

        [JsonPropertyName("page")]
        public int Page { get; set; } = 1;

        [JsonPropertyName("pageSize")]
        public int PageSize { get; set; } = 10;

        [JsonPropertyName("totalPages")]
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / (PageSize > 0 ? PageSize : 10));

        [JsonPropertyName("data")]
        public List<MeetingResponseDto> Data { get; set; } = new List<MeetingResponseDto>();
    }
}
