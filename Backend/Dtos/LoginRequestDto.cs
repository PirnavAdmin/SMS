using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Auth;

public record LoginRequestDto(
    [Required] string EmailOrPhone,
    [Required] string Password
);