namespace SMS.Api.Models;

public class OtpVerification
{
    public int OtpId { get; set; }
    public int UserId { get; set; }
    public string OtpCodeHash { get; set; } = string.Empty;
    public string DeliveryMethod { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public DateTime ExpiryTime { get; set; }
    public bool IsUsed { get; set; } = false;
    public int AttemptCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}