namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class CommunicationOptionsDto
{
    public List<string> AcademicYears { get; set; } = new List<string> { "2027-28", "2026-27", "2025-26" };
    public List<string> Audiences { get; set; } = new List<string> { "All Audiences", "Individual Meetings", "Group Meetings" };
    public List<string> Modes { get; set; } = new List<string> { "All Modes", "In-Person", "Online", "Hybrid" };
    public List<string> Statuses { get; set; } = new List<string> { "All Statuses", "Scheduled", "Draft", "Completed", "Cancelled" };
}

public class BroadcastNotificationDto
{
    public int Id { get; set; }
    public string CategoryTag { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Audience { get; set; } = "ALL";
}

public class CommunicationMeetingDto
{
    public int MeetingId { get; set; }
    public string Tag { get; set; } = "INDIVIDUAL MEETING";
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Participant { get; set; } = string.Empty;
    public string ParticipantSubtext { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string TimeSlot { get; set; } = string.Empty;
    public string Venue { get; set; } = string.Empty;
    public string Status { get; set; } = "SCHEDULED";
    public string Mode { get; set; } = "In-Person";
}
