namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class SchoolEvent
{
    [Key]
    public int EventId { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty; // e.g. "Annual Sports Day & Athletic Meet 2026", "Inter-House Science & Robotics Exhibition"

    [Required]
    public string Category { get; set; } = "Sports Day"; // "Sports Day", "Science Exhibition", "Parent Teacher Meeting", "Cultural Fest"

    public string Venue { get; set; } = "Main Campus Stadium Ground";

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public string Time { get; set; } = "08:30 AM";

    public string Organizer { get; set; } = "Physical Education Dept";

    public string? Description { get; set; }

    public string Status { get; set; } = "Published"; // "Published", "Draft"

    public string ApplicableBranch { get; set; } = "Main Campus";
}
