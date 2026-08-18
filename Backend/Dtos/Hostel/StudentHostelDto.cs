namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class StudentHostelResponseDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentType { get; set; } = "Non-Residential";
    public bool IsHosteller { get; set; } = false;
    public bool IsAssigned { get; set; } = false;
    public string Message { get; set; } = string.Empty;
    public string? HostelName { get; set; }
    public string? HostelType { get; set; }
    public string? RoomNo { get; set; }
    public string? BedNo { get; set; }
    public string? WardenName { get; set; }
    public string? WardenMobile { get; set; }
    public string? WardenAlternateMobile { get; set; }
}

public class HostelDropdownOptionsDto
{
    public List<string> AcademicYears { get; set; } = new List<string> { "2027-28", "2026-27", "2025-26" };
}
