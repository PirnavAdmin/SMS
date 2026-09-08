namespace SMS.Api.Dtos.Auth;

public record AuthResponseDto(
    int UserId,
    string FullName,
    string Token,
    List<string> Roles,
    string? Email = null,
    string? MobileNumber = null,
    string? Avatar = null,
    string? Branch = null
);