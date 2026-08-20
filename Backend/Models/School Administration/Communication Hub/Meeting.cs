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
    public string? MeetingRoom { get; set; } = "Conference Room 102";
    public int RoomCapacity { get; set; } = 15;

    public string? OnlineMeetingUrl { get; set; }

    [Required]
    public DateTime MeetingDate { get; set; } = DateTime.UtcNow;

    public string StartTime { get; set; } = "10:00";
    public string EndTime { get; set; } = "10:30";

    public string MeetingStatus { get; set; } = "SCHEDULED";

    public string Priority { get; set; } = "Normal";
    public string AttendancePolicy { get; set; } = "Mandatory";
    public string Recurrence { get; set; } = "None (One-time)";
    public int TotalRecipients { get; set; } = 47;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
