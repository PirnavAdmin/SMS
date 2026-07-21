namespace SMS.Api.Services.Implementations;

using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using SMS.Api.Dtos.Auth;
using SMS.Api.Dtos.Otp;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _config;

    public AuthService(IUserRepository userRepository, IConfiguration config)
    {
        _userRepository = userRepository;
        _config = config;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
    {
        if (await _userRepository.ExistsAsync(dto.MobileNumber, dto.Email))
            throw new AppException("User with provided Email or Mobile Number already exists.", HttpStatusCode.Conflict);

        var role = await _userRepository.GetRoleByIdAsync(dto.RoleId) 
            ?? throw new AppException("Invalid Role ID specified.", HttpStatusCode.BadRequest);

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            MobileNumber = dto.MobileNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            UserType = role.RoleName // Sets UserType based on chosen role
        };

        user.Roles.Add(role);
        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        var rolesList = user.Roles.Select(r => r.RoleName).ToList();
        var token = GenerateJwtToken(user, rolesList);

        return new AuthResponseDto(user.UserId, user.FullName, token, rolesList);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
    {
        var user = await _userRepository.GetByIdentifierAsync(dto.Identifier);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new AppException("Invalid credentials.", HttpStatusCode.Unauthorized);

        var rolesList = user.Roles.Select(r => r.RoleName).ToList();
        var token = GenerateJwtToken(user, rolesList);

        return new AuthResponseDto(user.UserId, user.FullName, token, rolesList);
    }

    private string GenerateJwtToken(User user, List<string> roles)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.MobilePhone, user.MobileNumber)
        };

        if (!string.IsNullOrEmpty(user.Email))
            claims.Add(new Claim(ClaimTypes.Email, user.Email));

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

