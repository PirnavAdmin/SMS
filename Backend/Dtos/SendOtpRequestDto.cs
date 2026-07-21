using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Otp;

public record SendOtpRequestDto(
    [Required] string EmailOrPhone,
    [Required] string DeliveryMethod,
    [Required] string Purpose
);