using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Auth;

public record LoginRequestDto(
    [Required] string Identifier,
    [Required] string Password
);