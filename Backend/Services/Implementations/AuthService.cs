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
using SMS.Api.Data;
using Microsoft.EntityFrameworkCore;
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
        private readonly AppDbContext _dbContext;

        public AuthService(
            IUserRepository userRepository,
            IAdminRepository adminRepository,
            IConfiguration config,
            AppDbContext dbContext)
        {
            _userRepository = userRepository;
            _adminRepository = adminRepository;
            _config = config;
            _dbContext = dbContext;
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

                return new AuthResponseDto(admin.AdminId, admin.FullName, token, rolesList, admin.Email, admin.MobileNumber, admin.Avatar, "Main Campus");
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

                return new AuthResponseDto(user.UserId, user.FullName, token, rolesList, user.Email, user.MobileNumber, user.Avatar, "Main Campus");
            }
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.EmailOrPhone) || string.IsNullOrWhiteSpace(dto.Password))
            {
                throw new AppException("Email/Mobile Number and Password are required.", HttpStatusCode.BadRequest);
            }

            var identifier = dto.EmailOrPhone.Trim();

            // 1. Try standard Admin login first
            var admin = await _adminRepository.GetByIdentifierAsync(identifier);
            if (admin != null)
            {
                bool passwordMatches = false;
                try
                {
                    if (!string.IsNullOrEmpty(admin.PasswordHash))
                    {
                        passwordMatches = BCrypt.Net.BCrypt.Verify(dto.Password, admin.PasswordHash);
                    }
                }
                catch
                {
                    passwordMatches = false;
                }

                if (!passwordMatches)
                {
                    throw new AppException(
                        "Invalid email/mobile number or password.",
                        HttpStatusCode.Unauthorized);
                }

                var rolesList = GetAdminRolesList(admin);
                if (rolesList.Count == 0)
                {
                    rolesList = new List<string> { "Admin" };
                }

                var token = GenerateJwtTokenForAdmin(admin, rolesList);

                string? avatar = admin.Avatar;
                string fullName = admin.FullName;
                string? email = admin.Email;
                string? phone = admin.MobileNumber;
                string branch = "Main Campus";

                try
                {
                    var schoolSettings = await _dbContext.SchoolSettings.FirstOrDefaultAsync();
                    if (schoolSettings != null && !string.IsNullOrWhiteSpace(schoolSettings.UserProfileJson))
                    {
                        var prof = System.Text.Json.JsonSerializer.Deserialize<Dtos.UserProfileDto>(schoolSettings.UserProfileJson);
                        if (prof != null && (prof.Email == admin.Email || prof.Phone == admin.MobileNumber || prof.Id == admin.AdminId.ToString()))
                        {
                            if (!string.IsNullOrWhiteSpace(prof.Avatar)) avatar = prof.Avatar;
                            if (string.IsNullOrWhiteSpace(fullName) && !string.IsNullOrWhiteSpace(prof.Name)) fullName = prof.Name;
                            if (string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(prof.Email)) email = prof.Email;
                            if (string.IsNullOrWhiteSpace(phone) && !string.IsNullOrWhiteSpace(prof.Phone)) phone = prof.Phone;
                            if (!string.IsNullOrWhiteSpace(prof.Branch)) branch = prof.Branch;
                        }
                    }
                }
                catch { }

                return new AuthResponseDto(
                    admin.AdminId,
                    fullName,
                    token,
                    rolesList,
                    email,
                    phone,
                    avatar,
                    branch);
            }

            // 2. Try User login
            var user = await _userRepository.GetByIdentifierAsync(identifier);
            if (user != null)
            {
                bool userPasswordMatches = false;
                try
                {
                    if (!string.IsNullOrEmpty(user.PasswordHash))
                    {
                        userPasswordMatches = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
                    }
                }
                catch
                {
                    userPasswordMatches = false;
                }

                if (!userPasswordMatches)
                {
                    throw new AppException(
                        "Invalid email/mobile number or password.",
                        HttpStatusCode.Unauthorized);
                }

                var userRolesList = GetUserRolesList(user);
                if (userRolesList.Count == 0)
                {
                    userRolesList = new List<string> { !string.IsNullOrEmpty(user.Role) ? user.Role : "Student" };
                }

                var userToken = GenerateJwtToken(user, userRolesList);

                string? avatar = user.Avatar;
                string fullName = user.FullName;
                string? email = user.Email;
                string? phone = user.MobileNumber;
                string branch = "Main Campus";

                try
                {
                    var schoolSettings = await _dbContext.SchoolSettings.FirstOrDefaultAsync();
                    if (schoolSettings != null && !string.IsNullOrWhiteSpace(schoolSettings.UserProfileJson))
                    {
                        var prof = System.Text.Json.JsonSerializer.Deserialize<Dtos.UserProfileDto>(schoolSettings.UserProfileJson);
                        if (prof != null && (prof.Email == user.Email || prof.Phone == user.MobileNumber))
                        {
                            if (!string.IsNullOrWhiteSpace(prof.Avatar)) avatar = prof.Avatar;
                            if (string.IsNullOrWhiteSpace(fullName) && !string.IsNullOrWhiteSpace(prof.Name)) fullName = prof.Name;
                            if (string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(prof.Email)) email = prof.Email;
                            if (string.IsNullOrWhiteSpace(phone) && !string.IsNullOrWhiteSpace(prof.Phone)) phone = prof.Phone;
                            if (!string.IsNullOrWhiteSpace(prof.Branch)) branch = prof.Branch;
                        }
                    }
                }
                catch { }

                return new AuthResponseDto(
                    user.UserId,
                    fullName,
                    userToken,
                    userRolesList,
                    email,
                    phone,
                    avatar,
                    branch);
            }

            // 3. Try Hostel Warden lookup if not found in Users/Admin
            var lowerIdentifier = identifier.ToLower();
            var warden = await _dbContext.HostelWardens
                .Include(w => w.Staff)
                .FirstOrDefaultAsync(w => (w.EmailAddress != null && w.EmailAddress.ToLower() == lowerIdentifier)
                                       || w.MobileNumber == identifier
                                       || (w.Staff != null && ((w.Staff.Email != null && w.Staff.Email.ToLower() == lowerIdentifier) || w.Staff.Phone == identifier)));
            if (warden != null)
            {
                var wardenRoles = new List<string> { "Hostel Warden" };
                var dummyUser = new User
                {
                    UserId = warden.WardenId,
                    FullName = !string.IsNullOrWhiteSpace(warden.WardenName) ? warden.WardenName : (warden.Staff != null ? $"{warden.Staff.FirstName} {warden.Staff.LastName}".Trim() : "Hostel Warden"),
                    Email = warden.EmailAddress ?? warden.Staff?.Email ?? "Warden@pirnav.com",
                    MobileNumber = warden.MobileNumber ?? warden.Staff?.Phone ?? "9581768444",
                    Role = "Hostel Warden"
                };

                var wardenToken = GenerateJwtToken(dummyUser, wardenRoles);
                return new AuthResponseDto(
                    dummyUser.UserId,
                    dummyUser.FullName,
                    wardenToken,
                    wardenRoles,
                    dummyUser.Email,
                    dummyUser.MobileNumber,
                    null,
                    "Main Campus");
            }

            // 4. User does not exist
            throw new AppException(
                "Invalid email/mobile number or password.",
                HttpStatusCode.Unauthorized);
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
                "warden" => "Hostel Warden",
                "hostel warden" => "Hostel Warden",
                "hostelwarden" => "Hostel Warden",

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
                rolesList.AddRange(user.Roles.Select(r => SMS.Api.Helpers.RoleHelper.NormalizeRoleName(r.RoleName)));
            }

            if (!string.IsNullOrEmpty(user.Role))
            {
                rolesList.Add(SMS.Api.Helpers.RoleHelper.NormalizeRoleName(user.Role));
            }

            return rolesList.Distinct().ToList();
        }

        private List<string> GetAdminRolesList(Admin admin)
        {
            var rolesList = new List<string>();

            if (admin.Roles != null && admin.Roles.Any())
            {
                rolesList.AddRange(admin.Roles.Select(r => SMS.Api.Helpers.RoleHelper.NormalizeRoleName(r.RoleName)));
            }

            if (!string.IsNullOrEmpty(admin.Role))
            {
                rolesList.Add(SMS.Api.Helpers.RoleHelper.NormalizeRoleName(admin.Role));
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

            var keyStr = _config["Jwt:Key"] ?? "SUPER_SECRET_JWT_KEY_1234567890_ANTIGRAVITY_SMS";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"] ?? "SMS.Api",
                audience: _config["Jwt:Audience"] ?? "SMS.Client",
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

            var keyStr = _config["Jwt:Key"] ?? "SUPER_SECRET_JWT_KEY_1234567890_ANTIGRAVITY_SMS";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"] ?? "SMS.Api",
                audience: _config["Jwt:Audience"] ?? "SMS.Client",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}