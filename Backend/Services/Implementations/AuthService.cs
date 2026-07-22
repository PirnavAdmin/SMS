using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SMS.Api.Dtos.Auth;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
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
                UserType = role.RoleName
            };

            user.Roles.Add(role);
            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            var rolesList = GetUserRolesList(user);
            var token = GenerateJwtToken(user, rolesList);

            return new AuthResponseDto(user.UserId, user.FullName, token, rolesList);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
        {
            var user = await _userRepository.GetByIdentifierAsync(dto.EmailOrPhone);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                throw new AppException("Invalid credentials.", HttpStatusCode.Unauthorized);

            var rolesList = GetUserRolesList(user);
            var token = GenerateJwtToken(user, rolesList);

            return new AuthResponseDto(user.UserId, user.FullName, token, rolesList);
        }

        private List<string> GetUserRolesList(User user)
        {
            var rolesList = new List<string>();

            // 1. Check Roles collection
            if (user.Roles != null && user.Roles.Any())
            {
                rolesList.AddRange(user.Roles.Select(r => r.RoleName));
            }

            // 2. Fallback to UserType property
            if (!rolesList.Any() && !string.IsNullOrEmpty(user.UserType))
            {
                rolesList.Add(user.UserType);
            }

            return rolesList.Distinct().ToList();
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
}