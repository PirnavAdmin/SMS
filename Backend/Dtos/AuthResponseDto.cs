namespace SMS.Api.Dtos.Auth;

public record AuthResponseDto(
    int UserId,
    string FullName,
    string Token,
    List<string> Roles
);