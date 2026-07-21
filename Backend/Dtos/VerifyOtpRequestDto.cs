using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Otp;

public record VerifyOtpRequestDto(
    [Required] int UserId,
    [Required] string OtpCode,
    [Required] string Purpose
);