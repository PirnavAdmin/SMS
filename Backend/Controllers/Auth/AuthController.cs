namespace SMS.Api.Controllers.Auth;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Auth;
using SMS.Api.Services.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]  
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        return Ok(result);
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto dto)
    {
        var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var nameClaim = User.FindFirst(ClaimTypes.Name)?.Value;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        await _authService.ChangePasswordAsync(dto, emailClaim, idClaim, nameClaim, roleClaim);
        return Ok(new { message = "Password updated successfully." });
    }
}
