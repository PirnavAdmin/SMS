namespace SMS.Api.Dtos;

public class MeetingCreateDto
{
    public string MeetingAudience { get; set; } = "Individual Meeting";
    public string ParticipantType { get; set; } = "Parent";
    public string ParticipantName { get; set; } = string.Empty;
    public string? ParticipantPhone { get; set; }
    public string? WardStudentName { get; set; }
    public string? WardAdmissionNo { get; set; }
    public string? WardClass { get; set; }
    public string MeetingTitle { get; set; } = string.Empty;
    public string? Agenda { get; set; }
    public string MeetingMode { get; set; } = "In-Person";
    public string? Building { get; set; }
    public string? Floor { get; set; }
    public string? MeetingRoom { get; set; }
    public int RoomCapacity { get; set; } = 15;
    public string MeetingDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = "10:00";
    public string EndTime { get; set; } = "10:30";
    public string MeetingStatus { get; set; } = "Scheduled";
}
