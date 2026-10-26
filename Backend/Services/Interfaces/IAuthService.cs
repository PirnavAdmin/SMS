namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos.Auth;
using System.Threading.Tasks;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);
    Task<bool> ChangePasswordAsync(ChangePasswordRequestDto dto, string? userEmailFromToken = null, string? userIdFromToken = null, string? userNameFromToken = null);
}
