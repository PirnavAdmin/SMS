namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class HolidayCalendar
{
    [Key]
    public int HolidayId { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty; // e.g. "diwali"

    public string Type { get; set; } = "State"; // "State", "School", "National"

    [Required]
    public DateTime FromDate { get; set; }

    [Required]
    public DateTime ToDate { get; set; }

    public string ApplicableBranch { get; set; } = "Main Campus";

    public string? Description { get; set; }
}
