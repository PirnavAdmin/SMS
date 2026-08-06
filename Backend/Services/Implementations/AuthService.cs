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
        private readonly IAdminRepository _adminRepository;
        private readonly IConfiguration _config;

        public AuthService(
            IUserRepository userRepository,
            IAdminRepository adminRepository,
            IConfiguration config)
        {
            _userRepository = userRepository;
            _adminRepository = adminRepository;
            _config = config;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
        {
            var role = await _userRepository.GetRoleByIdAsync(dto.RoleId)
                ?? throw new AppException("Invalid Role ID specified.", HttpStatusCode.BadRequest);

            bool isAlreadyExists = (role.RoleName == "Admin")
                ? await _adminRepository.ExistsAsync(dto.MobileNumber, dto.Email)
                : await _userRepository.ExistsAsync(dto.MobileNumber, dto.Email);

            if (isAlreadyExists)
                throw new AppException("User with provided Email or Mobile Number already exists.", HttpStatusCode.Conflict);

            if (role.RoleName == "Admin")
            {
                var admin = new Admin
                {
                    FullName = dto.FullName,
                    Email = dto.Email,
                    MobileNumber = dto.MobileNumber,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    Role = "Admin"
                };

                admin.Roles.Add(role);
                await _adminRepository.AddAsync(admin);
                await _adminRepository.SaveChangesAsync();

                var rolesList = new List<string> { "Admin" };
                var token = GenerateJwtTokenForAdmin(admin, rolesList);

                return new AuthResponseDto(admin.AdminId, admin.FullName, token, rolesList);
            }
            else
            {
                var user = new User
                {
                    FullName = dto.FullName,
                    Email = dto.Email,
                    MobileNumber = dto.MobileNumber,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    Role = role.RoleName
                };

                user.Roles.Add(role);
                await _userRepository.AddAsync(user);
                await _userRepository.SaveChangesAsync();

                var rolesList = GetUserRolesList(user);
                var token = GenerateJwtToken(user, rolesList);

                return new AuthResponseDto(user.UserId, user.FullName, token, rolesList);
            }
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
        {
            var identifier = dto.EmailOrPhone.Trim();

            // Try standard Admin login first
            var admin = await _adminRepository.GetByIdentifierAsync(identifier);
            if (admin != null)
            {
                var passwordMatches = BCrypt.Net.BCrypt.Verify(dto.Password, admin.PasswordHash);
                if (!passwordMatches)
                {
                    throw new AppException(
                        "Invalid email/mobile number or password.",
                        HttpStatusCode.Unauthorized);
                }

                var rolesList = GetAdminRolesList(admin);
                if (rolesList.Count == 0)
                {
                    throw new AppException(
                        "No role is assigned to this admin.",
                        HttpStatusCode.Forbidden);
                }

                var token = GenerateJwtTokenForAdmin(admin, rolesList);

                return new AuthResponseDto(
                    admin.AdminId,
                    admin.FullName,
                    token,
                    rolesList);
            }

            // Fallback to User login (SuperAdmin)
            var user = await _userRepository.GetByIdentifierAsync(identifier);
            if (user == null)
            {
                throw new AppException(
                    "Invalid email/mobile number or password.",
                    HttpStatusCode.Unauthorized);
            }

            var userPasswordMatches = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!userPasswordMatches)
            {
                throw new AppException(
                    "Invalid email/mobile number or password.",
                    HttpStatusCode.Unauthorized);
            }

            var userRolesList = GetUserRolesList(user);
            if (userRolesList.Count == 0)
            {
                throw new AppException(
                    "No role is assigned to this user.",
                    HttpStatusCode.Forbidden);
            }

            var userToken = GenerateJwtToken(user, userRolesList);

            return new AuthResponseDto(
                user.UserId,
                user.FullName,
                userToken,
                userRolesList);
        }

        private static string GetPortalRole(string portal)
        {
            return portal.Trim().ToLowerInvariant() switch
            {
                "admin" => "Admin",
                "employee" => "Teacher",
                "teacher" => "Teacher",
                "student" => "Student",
                "parent" => "Parent",

                _ => throw new AppException(
                    "Invalid login portal.",
                    HttpStatusCode.BadRequest)
            };
        }

        private List<string> GetUserRolesList(User user)
        {
            var rolesList = new List<string>();

            if (user.Roles != null && user.Roles.Any())
            {
                rolesList.AddRange(user.Roles.Select(r => r.RoleName));
            }

            if (!string.IsNullOrEmpty(user.Role))
            {
                rolesList.Add(user.Role);
            }

            return rolesList.Distinct().ToList();
        }

        private List<string> GetAdminRolesList(Admin admin)
        {
            var rolesList = new List<string>();

            if (admin.Roles != null && admin.Roles.Any())
            {
                rolesList.AddRange(admin.Roles.Select(r => r.RoleName));
            }

            if (!string.IsNullOrEmpty(admin.Role))
            {
                rolesList.Add(admin.Role);
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

            if (user.SchoolId.HasValue)
                claims.Add(new Claim("schoolId", user.SchoolId.Value.ToString()));

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

        private string GenerateJwtTokenForAdmin(Admin admin, List<string> roles)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, admin.AdminId.ToString()),
                new Claim(ClaimTypes.Name, admin.FullName),
                new Claim(ClaimTypes.MobilePhone, admin.MobileNumber)
            };

            if (!string.IsNullOrEmpty(admin.Email))
                claims.Add(new Claim(ClaimTypes.Email, admin.Email));

            if (admin.SchoolId.HasValue)
                claims.Add(new Claim("schoolId", admin.SchoolId.Value.ToString()));

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