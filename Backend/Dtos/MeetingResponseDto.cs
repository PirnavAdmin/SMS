namespace SMS.Api.Dtos;

public class MeetingResponseDto
{
    public int MeetingId { get; set; }
    public string MeetingAudience { get; set; } = string.Empty;
    public string ParticipantType { get; set; } = string.Empty;
    public string ParticipantName { get; set; } = string.Empty;
    public string? ParticipantPhone { get; set; }
    public string? WardStudentName { get; set; }
    public string? WardAdmissionNo { get; set; }
    public string? WardClass { get; set; }
    public string MeetingTitle { get; set; } = string.Empty;
    public string? Agenda { get; set; }
    public string MeetingMode { get; set; } = string.Empty;
    public string? Building { get; set; }
    public string? Floor { get; set; }
    public string? MeetingRoom { get; set; }
    public int RoomCapacity { get; set; }
    public string MeetingDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string MeetingStatus { get; set; } = string.Empty;
}
