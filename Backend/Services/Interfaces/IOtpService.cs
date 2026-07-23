namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos.Otp;
using SMS.Api.Dtos;

public interface IOtpService
{
    Task<SendOtpResponseDto> SendOtpAsync(SendOtpRequestDto dto);
    Task<bool> VerifyOtpAsync(VerifyOtpRequestDto dto);
    Task<bool> ResetPasswordAsync(ResetPasswordDto dto);
}