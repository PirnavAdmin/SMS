namespace SMS.Api.Dtos;

public class CircularDto
{
    public int CircularId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "SPORTS - ALL";
    public string Content { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = "ALL";
    public string CreatedDate { get; set; } = string.Empty;
    public bool SmsSent { get; set; } = true;
    public bool EmailSent { get; set; } = true;
    public bool PushDelivered { get; set; } = true;
}
