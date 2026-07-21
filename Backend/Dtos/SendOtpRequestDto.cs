using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Otp;

public record SendOtpRequestDto(
    [Required] string Identifier,
    [Required] string DeliveryMethod,
    [Required] string Purpose
);