namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class Meeting
{
    [Key]
    public int MeetingId { get; set; }

    [Required]
    public string MeetingAudience { get; set; } = "Individual Meeting";

    [Required]
    public string ParticipantType { get; set; } = "Parent";

    public string ParticipantName { get; set; } = string.Empty;
    public string? ParticipantPhone { get; set; }
    public string? WardStudentName { get; set; }
    public string? WardAdmissionNo { get; set; }
    public string? WardClass { get; set; }

    [Required]
    public string MeetingTitle { get; set; } = string.Empty;

    public string? Agenda { get; set; }

    public string MeetingMode { get; set; } = "In-Person";

    public string? Building { get; set; } = "Academic Block A";
    public string? Floor { get; set; } = "1st Floor";
    public string? MeetingRoom { get; set; } = "Conference Room 204";
    public int RoomCapacity { get; set; } = 15;

    [Required]
    public DateTime MeetingDate { get; set; }

    public string StartTime { get; set; } = "14:00";
    public string EndTime { get; set; } = "14:30";

    public string MeetingStatus { get; set; } = "Scheduled";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
