using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Auth;

public record RegisterRequestDto(
    [Required] string FullName,
    string? Email,
    [Required] string MobileNumber,
    [Required] string Password,
    [Required] int RoleId
);