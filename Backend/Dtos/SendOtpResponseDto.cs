namespace SMS.Api.Dtos.Otp;

public class SendOtpResponseDto
{
	public string Message { get; set; } = string.Empty;
	public string DeliveryMethod { get; set; } = string.Empty;
	public string? TestOtpCode { get; set; }
}