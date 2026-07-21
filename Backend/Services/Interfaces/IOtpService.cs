namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos.Otp;

public interface IOtpService
{
    Task<SendOtpResponseDto> SendOtpAsync(SendOtpRequestDto dto);
    Task<bool> VerifyOtpAsync(VerifyOtpRequestDto dto);
    Task<bool> ResetPasswordAsync(ResetPasswordDto dto);
}