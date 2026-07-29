namespace SMS.Api.Dtos;

public class SchoolEventDto
{
    public int EventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "Sports Day";
    public string Venue { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public string Time { get; set; } = "08:30 AM";
    public string Organizer { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Published";
    public string ApplicableBranch { get; set; } = "Main Campus";
}
