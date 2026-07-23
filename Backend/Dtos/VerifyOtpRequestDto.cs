using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Otp;

public record VerifyOtpRequestDto(
    [Required] string EmailOrPhone,
    [Required] string OtpCode
);