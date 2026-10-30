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

                return new AuthResponseDto(admin.AdminId, admin.FullName, token, rolesList, admin.Email, admin.MobileNumber, admin.Avatar, string.Empty);
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

                return new AuthResponseDto(user.UserId, user.FullName, token, rolesList, user.Email, user.MobileNumber, user.Avatar, string.Empty);
            }
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.EmailOrPhone) || string.IsNullOrWhiteSpace(dto.Password))
            {
                throw new AppException("Email/Mobile Number and Password are required.", HttpStatusCode.BadRequest);
            }

            var identifier = dto.EmailOrPhone.Trim();
            var lower = identifier.ToLowerInvariant();
            var digitsOnly = new string(identifier.Where(char.IsDigit).ToArray());

            bool VerifyPassword(string? hash, string plainPassword)
            {
                if (string.IsNullOrEmpty(hash)) return false;
                try
                {
                    if (hash.StartsWith("$2"))
                    {
                        if (BCrypt.Net.BCrypt.Verify(plainPassword, hash))
                            return true;
                        if (plainPassword.Contains("@") && BCrypt.Net.BCrypt.Verify(plainPassword.ToLowerInvariant(), hash))
                            return true;
                    }
                }
                catch { }

                if (hash == plainPassword) return true;
                return false;
            }

            var portal = (dto.Portal ?? "").Trim();

            async Task<AuthResponseDto?> TryAdminAsync()
            {
                var admin = await _adminRepository.GetByIdentifierAsync(identifier);
                if (admin != null)
                {
                    bool passwordMatches = VerifyPassword(admin.PasswordHash, dto.Password);
                    if (passwordMatches)
                    {
                        var rolesList = GetAdminRolesList(admin);
                        if (rolesList.Count == 0) rolesList = new List<string> { "Admin" };
                        var token = GenerateJwtTokenForAdmin(admin, rolesList);
                        return new AuthResponseDto(
                            admin.AdminId,
                            admin.FullName,
                            token,
                            rolesList,
                            admin.Email,
                            admin.MobileNumber,
                            admin.Avatar,
                            string.Empty);
                    }
                    else if (string.Equals(portal, "Admin", StringComparison.OrdinalIgnoreCase))
                    {
                        throw new AppException("Invalid email/mobile number or password.", HttpStatusCode.Unauthorized);
                    }
                }
                return null;
            }

            async Task<AuthResponseDto?> TryStudentAsync()
            {
                var student = await _dbContext.Students
                    .AsNoTracking()
                    .Include(s => s.Branch)
                    .FirstOrDefaultAsync(s => 
                        s.AdmissionNumber.ToLower() == lower ||
                        s.RollNumber.ToLower() == lower ||
                        (s.Email != null && s.Email.ToLower() == lower) ||
                        s.MobileNumber == identifier ||
                        (!string.Equals(portal, "Parent", StringComparison.OrdinalIgnoreCase) && s.FatherMobile == identifier) ||
                        (digitsOnly.Length >= 10 && (
                            (s.MobileNumber != null && s.MobileNumber.EndsWith(digitsOnly)) ||
                            (!string.Equals(portal, "Parent", StringComparison.OrdinalIgnoreCase) && s.FatherMobile != null && s.FatherMobile.EndsWith(digitsOnly))
                        ))
                    );

                if (student != null)
                {
                    var linkedUser = await _dbContext.Users
                        .Include(u => u.Roles)
                        .FirstOrDefaultAsync(u => 
                            (u.Role == "Student" || (u.Role != "Parent" && u.Role != "Admin" && u.Role != "Teacher" && u.Role != "Driver")) &&
                            ((u.Email != null && (
                                (!string.IsNullOrEmpty(student.Email) && u.Email.ToLower() == student.Email.ToLower()) ||
                                (!string.IsNullOrEmpty(student.RollNumber) && (u.Email.ToLower() == student.RollNumber.ToLower() || u.Email.ToLower().StartsWith(student.RollNumber.ToLower() + "@"))) ||
                                (!string.IsNullOrEmpty(student.AdmissionNumber) && (u.Email.ToLower() == student.AdmissionNumber.ToLower() || u.Email.ToLower().StartsWith(student.AdmissionNumber.ToLower() + "@")))
                            )) ||
                             (u.MobileNumber != null && (
                                (!string.IsNullOrEmpty(student.RollNumber) && u.MobileNumber == student.RollNumber) ||
                                (!string.IsNullOrEmpty(student.AdmissionNumber) && u.MobileNumber == student.AdmissionNumber) ||
                                (student.MobileNumber != null && u.MobileNumber == student.MobileNumber) ||
                                (student.FatherMobile != null && u.MobileNumber == student.FatherMobile) ||
                                (digitsOnly.Length >= 10 && u.MobileNumber.EndsWith(digitsOnly))
                            )) ||
                             (u.FullName.ToLower() == student.StudentName.ToLower()))
                        );

                    bool passValid = false;
                    if (linkedUser != null && !string.IsNullOrEmpty(linkedUser.PasswordHash))
                    {
                        passValid = VerifyPassword(linkedUser.PasswordHash, dto.Password);
                    }

                    if (!passValid && (!string.IsNullOrEmpty(student.RollNumber) && string.Equals(dto.Password.Trim(), student.RollNumber.Trim(), StringComparison.OrdinalIgnoreCase) ||
                                       !string.IsNullOrEmpty(student.AdmissionNumber) && string.Equals(dto.Password.Trim(), student.AdmissionNumber.Trim(), StringComparison.OrdinalIgnoreCase)))
                    {
                        passValid = true;
                        if (linkedUser != null)
                        {
                            linkedUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password.Trim());
                            try { await _dbContext.SaveChangesAsync(); } catch { }
                        }
                    }

                    if (passValid)
                    {
                        if (linkedUser == null)
                        {
                            var sRole = await _dbContext.Roles.FirstOrDefaultAsync(r => r.RoleName == "Student");
                            linkedUser = new User
                            {
                                FullName = student.StudentName,
                                Email = student.Email ?? $"{student.RollNumber.ToLowerInvariant()}@school.internal",
                                MobileNumber = student.MobileNumber ?? student.RollNumber,
                                PasswordHash = BCrypt.Net.BCrypt.HashPassword(student.RollNumber),
                                Role = "Student",
                                IsEmailVerified = true,
                                IsMobileVerified = true,
                                CreatedAt = DateTime.UtcNow
                            };
                            if (sRole != null) linkedUser.Roles.Add(sRole);
                            await _dbContext.Users.AddAsync(linkedUser);
                            try { await _dbContext.SaveChangesAsync(); } catch { }
                        }

                        var studentUser = new User
                        {
                            UserId = linkedUser.UserId,
                            FullName = student.StudentName,
                            Email = linkedUser.Email ?? student.Email,
                            MobileNumber = linkedUser.MobileNumber ?? student.MobileNumber ?? student.FatherMobile ?? "",
                            Role = "Student"
                        };
                        var studentRoles = new List<string> { "Student" };
                        var sToken = GenerateJwtToken(studentUser, studentRoles);

                        return new AuthResponseDto(
                            student.StudentId,
                            student.StudentName,
                            sToken,
                            studentRoles,
                            linkedUser.Email ?? student.Email,
                            linkedUser.MobileNumber ?? student.MobileNumber ?? student.FatherMobile,
                            linkedUser.Avatar,
                            student.Branch?.BranchName ?? string.Empty);
                    }
                }
                return null;
            }

            async Task<AuthResponseDto?> TryDriverAsync()
            {
                var driver = await _dbContext.TransportDrivers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => 
                        (!string.IsNullOrEmpty(d.EmployeeId) && d.EmployeeId.ToLower() == lower) ||
                        (!string.IsNullOrEmpty(d.LicenceNumber) && d.LicenceNumber.ToLower() == lower) ||
                        (!string.IsNullOrEmpty(d.Email) && d.Email.ToLower() == lower) ||
                        d.MobileNumber == identifier ||
                        (digitsOnly.Length >= 10 && d.MobileNumber != null && d.MobileNumber.EndsWith(digitsOnly))
                    );

                if (driver != null)
                {
                    var linkedUser = await _dbContext.Users
                        .FirstOrDefaultAsync(u => 
                            (u.Email != null && driver.Email != null && u.Email.ToLower() == driver.Email.ToLower()) ||
                            (u.MobileNumber != null && driver.MobileNumber != null && (u.MobileNumber == driver.MobileNumber || (digitsOnly.Length >= 10 && u.MobileNumber.EndsWith(digitsOnly)))) ||
                            (u.Role == "Driver" && u.FullName.ToLower() == (driver.DriverName ?? "").ToLower())
                        );

                    bool passValid = linkedUser != null && !string.IsNullOrEmpty(linkedUser.PasswordHash) && VerifyPassword(linkedUser.PasswordHash, dto.Password);

                    if (passValid && linkedUser != null)
                    {
                        var driverName = !string.IsNullOrWhiteSpace(driver.DriverName) ? driver.DriverName : linkedUser.FullName;
                        if (linkedUser.FullName != driverName)
                        {
                            linkedUser.FullName = driverName;
                            try { await _dbContext.SaveChangesAsync(); } catch { }
                        }

                        var driverUser = new User
                        {
                            UserId = linkedUser.UserId,
                            FullName = driverName,
                            Email = linkedUser.Email ?? driver.Email,
                            MobileNumber = linkedUser.MobileNumber ?? driver.MobileNumber ?? "",
                            Role = "Driver"
                        };
                        var driverRoles = new List<string> { "Driver" };
                        var dToken = GenerateJwtToken(driverUser, driverRoles);

                        return new AuthResponseDto(
                            driverUser.UserId,
                            driverName,
                            dToken,
                            driverRoles,
                            linkedUser.Email ?? driver.Email,
                            linkedUser.MobileNumber ?? driver.MobileNumber,
                            linkedUser.Avatar,
                            string.Empty);
                    }
                }
                return null;
            }

            async Task<AuthResponseDto?> TryStaffAsync(string? targetRole = null)
            {
                var staffQuery = _dbContext.Staff.AsNoTracking().Where(s => 
                    (!string.IsNullOrEmpty(s.EmployeeId) && s.EmployeeId.ToLower() == lower) ||
                    (!string.IsNullOrEmpty(s.Email) && s.Email.ToLower() == lower) ||
                    s.Phone == identifier ||
                    (digitsOnly.Length >= 10 && s.Phone != null && s.Phone.EndsWith(digitsOnly))
                );

                if (!string.IsNullOrEmpty(targetRole))
                {
                    var trLower = targetRole.ToLower();
                    staffQuery = staffQuery.Where(s => 
                        (s.Designation != null && s.Designation.ToLower().Contains(trLower)) ||
                        (s.EmployeeCategory != null && s.EmployeeCategory.ToLower().Contains(trLower)) ||
                        (s.SystemRole != null && s.SystemRole.ToLower().Contains(trLower))
                    );
                }

                var staffMember = await staffQuery.FirstOrDefaultAsync();
                if (staffMember != null)
                {
                    var linkedUser = await _dbContext.Users
                        .FirstOrDefaultAsync(u => 
                            (u.Email != null && staffMember.Email != null && u.Email.ToLower() == staffMember.Email.ToLower()) ||
                            (u.MobileNumber != null && staffMember.Phone != null && (u.MobileNumber == staffMember.Phone || (digitsOnly.Length >= 10 && u.MobileNumber.EndsWith(digitsOnly)))) ||
                            (!string.IsNullOrEmpty(staffMember.EmployeeId) && (u.MobileNumber == staffMember.EmployeeId || (u.Email != null && u.Email.ToLower() == staffMember.EmployeeId.ToLower()))) ||
                            u.FullName.ToLower() == $"{staffMember.FirstName} {staffMember.LastName}".Trim().ToLower()
                        );

                    bool passValid = false;
                    if (linkedUser != null && !string.IsNullOrEmpty(linkedUser.PasswordHash))
                    {
                        passValid = VerifyPassword(linkedUser.PasswordHash, dto.Password);
                    }

                    // Direct match for default staff password (id = id and password = id)
                    if (!passValid && !string.IsNullOrEmpty(staffMember.EmployeeId) && string.Equals(dto.Password.Trim(), staffMember.EmployeeId.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        passValid = true;
                        if (linkedUser != null)
                        {
                            linkedUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password.Trim());
                            try { await _dbContext.SaveChangesAsync(); } catch { }
                        }
                    }

                    if (passValid)
                    {
                        string staffFullName = $"{staffMember.FirstName} {staffMember.LastName}".Trim();
                        if (string.IsNullOrWhiteSpace(staffFullName) && linkedUser != null) staffFullName = linkedUser.FullName;

                        string resolvedRole = "Staff";
                        var designation = (staffMember.Designation ?? "").ToLower();
                        var sysRole = (staffMember.SystemRole ?? "").ToLower();
                        if (designation.Contains("teacher") || sysRole.Contains("teacher") || staffMember.EmployeeCategory == "Teacher" || staffMember.EmployeeCategory == "Teaching Staff")
                            resolvedRole = "Teacher";
                        else if (designation.Contains("librarian") || sysRole.Contains("librarian"))
                            resolvedRole = "Librarian";
                        else if (designation.Contains("accountant") || sysRole.Contains("accountant"))
                            resolvedRole = "Accountant";
                        else if (designation.Contains("warden") || sysRole.Contains("warden"))
                            resolvedRole = "Hostel Warden";
                        else if (designation.Contains("driver") || sysRole.Contains("driver"))
                            resolvedRole = "Driver";
                        else if (!string.IsNullOrEmpty(targetRole))
                            resolvedRole = targetRole;
                        else if (linkedUser != null && !string.IsNullOrEmpty(linkedUser.Role))
                            resolvedRole = linkedUser.Role;

                        if (linkedUser == null)
                        {
                            var sRole = await _dbContext.Roles.FirstOrDefaultAsync(r => r.RoleName == resolvedRole);
                            var safeEmpId = !string.IsNullOrWhiteSpace(staffMember.EmployeeId) ? staffMember.EmployeeId : $"STF{staffMember.StaffId}";
                            linkedUser = new User
                            {
                                FullName = staffFullName,
                                Email = staffMember.Email ?? $"{safeEmpId.ToLowerInvariant()}@school.internal",
                                MobileNumber = !string.IsNullOrWhiteSpace(staffMember.Phone) ? staffMember.Phone : safeEmpId,
                                PasswordHash = BCrypt.Net.BCrypt.HashPassword(safeEmpId),
                                Role = resolvedRole,
                                IsEmailVerified = true,
                                IsMobileVerified = true,
                                CreatedAt = DateTime.UtcNow
                            };
                            if (sRole != null) linkedUser.Roles.Add(sRole);
                            await _dbContext.Users.AddAsync(linkedUser);
                            try { await _dbContext.SaveChangesAsync(); } catch { }
                        }
                        else if (linkedUser.FullName != staffFullName)
                        {
                            linkedUser.FullName = staffFullName;
                            try { await _dbContext.SaveChangesAsync(); } catch { }
                        }

                        var staffUser = new User
                        {
                            UserId = linkedUser.UserId,
                            FullName = staffFullName,
                            Email = linkedUser.Email ?? staffMember.Email,
                            MobileNumber = linkedUser.MobileNumber ?? staffMember.Phone ?? "",
                            Role = resolvedRole
                        };
                        var staffRoles = new List<string> { resolvedRole };
                        var stToken = GenerateJwtToken(staffUser, staffRoles, staffMember.StaffId, staffMember.EmployeeId);

                        return new AuthResponseDto(
                            staffUser.UserId,
                            staffFullName,
                            stToken,
                            staffRoles,
                            linkedUser.Email ?? staffMember.Email,
                            linkedUser.MobileNumber ?? staffMember.Phone,
                            staffMember.ProfilePhoto ?? linkedUser.Avatar,
                            staffMember.BranchName ?? "Main Campus",
                            staffMember.EmployeeId,
                            staffMember.StaffId);
                    }
                }
                return null;
            }

            async Task<AuthResponseDto?> TryWardenAsync()
            {
                var warden = await _dbContext.HostelWardens
                    .Include(w => w.Staff)
                    .FirstOrDefaultAsync(w => (w.EmailAddress != null && w.EmailAddress.ToLower() == lower)
                                           || w.MobileNumber == identifier
                                           || (digitsOnly.Length >= 10 && w.MobileNumber != null && w.MobileNumber.EndsWith(digitsOnly))
                                           || (w.Staff != null && ((w.Staff.Email != null && w.Staff.Email.ToLower() == lower) || w.Staff.Phone == identifier || (digitsOnly.Length >= 10 && w.Staff.Phone != null && w.Staff.Phone.EndsWith(digitsOnly)))));
                if (warden != null)
                {
                    var linkedUser = await _dbContext.Users
                        .FirstOrDefaultAsync(u => 
                            (u.Email != null && warden.EmailAddress != null && u.Email.ToLower() == warden.EmailAddress.ToLower()) ||
                            (u.MobileNumber != null && warden.MobileNumber != null && (u.MobileNumber == warden.MobileNumber || (digitsOnly.Length >= 10 && u.MobileNumber.EndsWith(digitsOnly)))) ||
                            (u.Role == "Hostel Warden" && u.FullName.ToLower() == (warden.WardenName ?? "").ToLower())
                        );

                    bool passValid = linkedUser != null && !string.IsNullOrEmpty(linkedUser.PasswordHash) && VerifyPassword(linkedUser.PasswordHash, dto.Password);

                    if (passValid && linkedUser != null)
                    {
                        var wardenRoles = new List<string> { "Hostel Warden" };
                        string wardenName = !string.IsNullOrWhiteSpace(warden.WardenName) 
                            ? warden.WardenName 
                            : (warden.Staff != null ? $"{warden.Staff.FirstName} {warden.Staff.LastName}".Trim() : linkedUser.FullName);

                        var wardenToken = GenerateJwtToken(linkedUser, wardenRoles);
                        return new AuthResponseDto(
                            linkedUser.UserId,
                            wardenName,
                            wardenToken,
                            wardenRoles,
                            linkedUser.Email ?? warden.EmailAddress,
                            linkedUser.MobileNumber ?? warden.MobileNumber,
                            linkedUser.Avatar,
                            string.Empty);
                    }
                }
                return null;
            }

            async Task<AuthResponseDto?> TryParentAsync()
            {
                // 1. Look for user in users table with role Parent
                var parentUser = await _dbContext.Users
                    .FirstOrDefaultAsync(u => (u.Role == "Parent" || u.Role == "Parent / Guardian") && (
                        (u.Email != null && u.Email.ToLower() == lower) ||
                        u.MobileNumber == identifier ||
                        (digitsOnly.Length >= 10 && u.MobileNumber != null && u.MobileNumber.EndsWith(digitsOnly))
                    ));

                if (parentUser != null)
                {
                    bool passValid = !string.IsNullOrEmpty(parentUser.PasswordHash) && VerifyPassword(parentUser.PasswordHash, dto.Password);
                    if (passValid)
                    {
                        var parentRoles = new List<string> { "Parent" };
                        var pToken = GenerateJwtToken(parentUser, parentRoles);
                        return new AuthResponseDto(
                            parentUser.UserId,
                            parentUser.FullName,
                            pToken,
                            parentRoles,
                            parentUser.Email,
                            parentUser.MobileNumber,
                            parentUser.Avatar,
                            string.Empty
                        );
                    }
                }

                // 2. Look for student with father_mobile or mother_mobile or parent email
                var studentWithParent = await _dbContext.Students
                    .AsNoTracking()
                    .Include(s => s.Branch)
                    .FirstOrDefaultAsync(s => 
                        s.FatherMobile == identifier || 
                        s.MotherMobile == identifier ||
                        (s.Email != null && s.Email.ToLower() == lower) ||
                        (digitsOnly.Length >= 10 && (
                            (s.FatherMobile != null && s.FatherMobile.EndsWith(digitsOnly)) || 
                            (s.MotherMobile != null && s.MotherMobile.EndsWith(digitsOnly))
                        ))
                    );

                if (studentWithParent != null)
                {
                    var linkedUser = await _dbContext.Users
                        .FirstOrDefaultAsync(u =>
                            (u.Email != null && studentWithParent.Email != null && u.Email.ToLower() == studentWithParent.Email.ToLower()) ||
                            (u.MobileNumber != null && (u.MobileNumber == studentWithParent.FatherMobile || u.MobileNumber == studentWithParent.MotherMobile || (digitsOnly.Length >= 10 && u.MobileNumber.EndsWith(digitsOnly)))) ||
                            (studentWithParent.FatherName != null && u.FullName.ToLower() == studentWithParent.FatherName.ToLower()) ||
                            (studentWithParent.MotherName != null && u.FullName.ToLower() == studentWithParent.MotherName.ToLower())
                        );

                    if (linkedUser != null && !string.IsNullOrEmpty(linkedUser.PasswordHash) && VerifyPassword(linkedUser.PasswordHash, dto.Password))
                    {
                        string parentName = !string.IsNullOrWhiteSpace(studentWithParent.FatherName) 
                            ? studentWithParent.FatherName 
                            : (!string.IsNullOrWhiteSpace(studentWithParent.MotherName) ? studentWithParent.MotherName : linkedUser.FullName);

                        var parentRoles = new List<string> { "Parent" };
                        var pToken = GenerateJwtToken(linkedUser, parentRoles);
                        return new AuthResponseDto(
                            linkedUser.UserId,
                            parentName,
                            pToken,
                            parentRoles,
                            linkedUser.Email ?? studentWithParent.Email,
                            linkedUser.MobileNumber ?? studentWithParent.FatherMobile ?? studentWithParent.MotherMobile,
                            linkedUser.Avatar,
                            studentWithParent.Branch?.BranchName ?? string.Empty
                        );
                    }
                }

                return null;
            }

            async Task<AuthResponseDto?> TryUserAsync(string? targetRole = null)
            {
                var userQuery = _dbContext.Users.AsQueryable();
                if (!string.IsNullOrEmpty(targetRole))
                {
                    userQuery = userQuery.Where(u => u.Role == targetRole);
                }

                var user = await userQuery.FirstOrDefaultAsync(u => 
                    (u.Email != null && u.Email.ToLower() == lower) ||
                    u.MobileNumber == identifier ||
                    (digitsOnly.Length >= 10 && u.MobileNumber != null && u.MobileNumber.EndsWith(digitsOnly))
                );

                if (user == null && (string.IsNullOrEmpty(targetRole) || targetRole == "Student"))
                {
                    var matchedStudent = await _dbContext.Students.AsNoTracking()
                        .FirstOrDefaultAsync(s => s.RollNumber.ToLower() == lower || s.AdmissionNumber.ToLower() == lower);
                    if (matchedStudent != null)
                    {
                        user = await userQuery.FirstOrDefaultAsync(u =>
                            u.Role == "Student" && (
                                u.FullName.ToLower() == matchedStudent.StudentName.ToLower() ||
                                (!string.IsNullOrEmpty(matchedStudent.Email) && u.Email != null && u.Email.ToLower() == matchedStudent.Email.ToLower()) ||
                                (!string.IsNullOrEmpty(matchedStudent.MobileNumber) && u.MobileNumber == matchedStudent.MobileNumber) ||
                                (u.MobileNumber == matchedStudent.RollNumber) ||
                                (u.Email != null && (u.Email.ToLower() == matchedStudent.RollNumber.ToLower() || u.Email.ToLower().StartsWith(matchedStudent.RollNumber.ToLower() + "@")))
                            )
                        );
                    }
                }

                if (user != null)
                {
                    bool userPasswordMatches = !string.IsNullOrEmpty(user.PasswordHash) && VerifyPassword(user.PasswordHash, dto.Password);
                    if (userPasswordMatches)
                    {
                        var userRolesList = GetUserRolesList(user);
                        if (userRolesList.Count == 0)
                        {
                            userRolesList = new List<string> { !string.IsNullOrEmpty(user.Role) ? user.Role : "Student" };
                        }

                        string fullName = user.FullName;
                        int userId = user.UserId;

                        var primaryRole = userRolesList.FirstOrDefault() ?? user.Role ?? "";
                        if (primaryRole.Equals("Student", StringComparison.OrdinalIgnoreCase))
                        {
                            var matchedStudent = await _dbContext.Students.FirstOrDefaultAsync(s => 
                                (s.Email != null && user.Email != null && s.Email.ToLower() == user.Email.ToLower()) ||
                                (!string.IsNullOrEmpty(s.RollNumber) && (user.MobileNumber == s.RollNumber || (user.Email != null && user.Email.ToLower().StartsWith(s.RollNumber.ToLower() + "@")))) ||
                                (s.MobileNumber != null && user.MobileNumber != null && (s.MobileNumber == user.MobileNumber || (digitsOnly.Length >= 10 && s.MobileNumber.EndsWith(digitsOnly)))) ||
                                s.StudentName.ToLower() == user.FullName.ToLower());
                            if (matchedStudent != null)
                            {
                                fullName = matchedStudent.StudentName;
                                userId = matchedStudent.StudentId;
                            }
                        }
                        else if (primaryRole.Equals("Driver", StringComparison.OrdinalIgnoreCase))
                        {
                            var matchedDriver = await _dbContext.TransportDrivers.FirstOrDefaultAsync(d => 
                                (d.Email != null && user.Email != null && d.Email.ToLower() == user.Email.ToLower()) ||
                                (d.MobileNumber != null && user.MobileNumber != null && (d.MobileNumber == user.MobileNumber || (digitsOnly.Length >= 10 && d.MobileNumber.EndsWith(digitsOnly)))) ||
                                (d.DriverName != null && user.FullName != null && d.DriverName.ToLower() == user.FullName.ToLower()));
                            if (matchedDriver != null && !string.IsNullOrWhiteSpace(matchedDriver.DriverName))
                            {
                                fullName = matchedDriver.DriverName;
                            }
                        }
                        else if (primaryRole.Equals("Teacher", StringComparison.OrdinalIgnoreCase) || primaryRole.Equals("Staff", StringComparison.OrdinalIgnoreCase) || primaryRole.Equals("Accountant", StringComparison.OrdinalIgnoreCase) || primaryRole.Equals("Librarian", StringComparison.OrdinalIgnoreCase))
                        {
                            var matchedStaff = await _dbContext.Staff.FirstOrDefaultAsync(s => 
                                (s.Email != null && user.Email != null && s.Email.ToLower() == user.Email.ToLower()) ||
                                (s.Phone != null && user.MobileNumber != null && (s.Phone == user.MobileNumber || (digitsOnly.Length >= 10 && s.Phone.EndsWith(digitsOnly)))));
                            if (matchedStaff != null)
                            {
                                string sName = $"{matchedStaff.FirstName} {matchedStaff.LastName}".Trim();
                                if (!string.IsNullOrWhiteSpace(sName)) fullName = sName;
                            }
                        }

                        var userToken = GenerateJwtToken(user, userRolesList);

                        return new AuthResponseDto(
                            userId,
                            fullName,
                            userToken,
                            userRolesList,
                            user.Email,
                            user.MobileNumber,
                            user.Avatar,
                            string.Empty);
                    }
                }
                return null;
            }

            AuthResponseDto? result = null;

            if (string.Equals(portal, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                result = await TryAdminAsync();
            }
            else if (string.Equals(portal, "Parent", StringComparison.OrdinalIgnoreCase))
            {
                result = await TryParentAsync() ?? await TryUserAsync("Parent");
            }
            else if (string.Equals(portal, "Driver", StringComparison.OrdinalIgnoreCase))
            {
                result = await TryDriverAsync() ?? await TryUserAsync("Driver") ?? await TryStaffAsync("Driver");
            }
            else if (string.Equals(portal, "Student", StringComparison.OrdinalIgnoreCase))
            {
                result = await TryStudentAsync() ?? await TryUserAsync("Student");
            }
            else if (string.Equals(portal, "Teacher", StringComparison.OrdinalIgnoreCase))
            {
                result = await TryStaffAsync("Teacher") ?? await TryUserAsync("Teacher");
            }
            else if (string.Equals(portal, "Librarian", StringComparison.OrdinalIgnoreCase))
            {
                result = await TryStaffAsync("Librarian") ?? await TryUserAsync("Librarian");
            }
            else if (string.Equals(portal, "Accountant", StringComparison.OrdinalIgnoreCase))
            {
                result = await TryStaffAsync("Accountant") ?? await TryUserAsync("Accountant");
            }
            else if (string.Equals(portal, "Hostel Warden", StringComparison.OrdinalIgnoreCase) || string.Equals(portal, "Warden", StringComparison.OrdinalIgnoreCase))
            {
                result = await TryWardenAsync() ?? await TryStaffAsync("Hostel Warden") ?? await TryUserAsync("Hostel Warden");
            }

            // Fallback for generic login or if portal-specific lookup didn't match
            if (result == null)
            {
                result = await TryAdminAsync()
                      ?? await TryParentAsync()
                      ?? await TryStudentAsync()
                      ?? await TryDriverAsync()
                      ?? await TryStaffAsync()
                      ?? await TryWardenAsync()
                      ?? await TryUserAsync();
            }

            if (result != null)
            {
                return result;
            }

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

        private string GenerateJwtToken(User user, List<string> roles, int? staffId = null, string? employeeId = null)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.MobilePhone, user.MobileNumber ?? "")
            };

            if (!string.IsNullOrEmpty(user.Email))
                claims.Add(new Claim(ClaimTypes.Email, user.Email));

            if (user.SchoolId.HasValue)
                claims.Add(new Claim("schoolId", user.SchoolId.Value.ToString()));

            if (staffId.HasValue && staffId.Value > 0)
            {
                claims.Add(new Claim("StaffId", staffId.Value.ToString()));
                claims.Add(new Claim("staff_id", staffId.Value.ToString()));
            }

            if (!string.IsNullOrEmpty(employeeId))
            {
                claims.Add(new Claim("EmployeeId", employeeId));
            }

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

        public async Task<bool> ChangePasswordAsync(ChangePasswordRequestDto dto, string? userEmailFromToken = null, string? userIdFromToken = null, string? userNameFromToken = null, string? userRoleFromToken = null)
        {
            if (dto == null)
                throw new AppException("Invalid request payload.", HttpStatusCode.BadRequest);

            if (string.IsNullOrWhiteSpace(dto.OldPassword))
                throw new AppException("Current password is required.", HttpStatusCode.BadRequest);

            if (string.IsNullOrWhiteSpace(dto.NewPassword))
                throw new AppException("New password is required.", HttpStatusCode.BadRequest);

            if (dto.NewPassword.Length < 6)
                throw new AppException("New password must be at least 6 characters long.", HttpStatusCode.BadRequest);

            if (dto.NewPassword != dto.ConfirmPassword)
                throw new AppException("New password and confirmation password do not match.", HttpStatusCode.BadRequest);

            if (dto.NewPassword == dto.OldPassword)
                throw new AppException("New password cannot be the same as the old password.", HttpStatusCode.BadRequest);

            bool VerifyPass(string? hash, string plainPassword)
            {
                if (string.IsNullOrEmpty(hash)) return false;
                try
                {
                    if (hash.StartsWith("$2"))
                    {
                        if (BCrypt.Net.BCrypt.Verify(plainPassword, hash))
                            return true;
                        if (plainPassword.Contains("@") && BCrypt.Net.BCrypt.Verify(plainPassword.ToLowerInvariant(), hash))
                            return true;
                    }
                }
                catch { }

                return hash == plainPassword;
            }

            // Gather candidate identifiers from explicit input or JWT claims
            var candidates = new List<string>();
            if (!string.IsNullOrWhiteSpace(dto.EmailOrPhone)) candidates.Add(dto.EmailOrPhone.Trim());
            if (!string.IsNullOrWhiteSpace(userEmailFromToken)) candidates.Add(userEmailFromToken.Trim());
            if (!string.IsNullOrWhiteSpace(userNameFromToken)) candidates.Add(userNameFromToken.Trim());

            Admin? admin = null;
            User? user = null;

            // 1. If we have a user/admin ID claim from the JWT token, check it first based on role
            if (int.TryParse(userIdFromToken, out int parsedId) && parsedId > 0)
            {
                bool isAdminRole = !string.IsNullOrEmpty(userRoleFromToken) &&
                    (userRoleFromToken.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                     userRoleFromToken.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase));

                if (isAdminRole)
                {
                    admin = await _dbContext.Admins.FirstOrDefaultAsync(a => a.AdminId == parsedId);
                    if (admin == null)
                    {
                        user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == parsedId);
                    }
                }
                else if (!string.IsNullOrEmpty(userRoleFromToken))
                {
                    user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == parsedId);
                    if (user == null)
                    {
                        admin = await _dbContext.Admins.FirstOrDefaultAsync(a => a.AdminId == parsedId);
                    }
                }
                else
                {
                    admin = await _dbContext.Admins.FirstOrDefaultAsync(a => a.AdminId == parsedId);
                    if (admin == null)
                    {
                        user = await _dbContext.Users.FirstOrDefaultAsync(u => u.UserId == parsedId);
                    }
                }
            }

            // 2. If not found by ID, look up by candidate identifiers (email, mobile, fullname)
            if (admin == null && user == null)
            {
                foreach (var candidate in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
                {
                    var lower = candidate.ToLowerInvariant();

                    admin = await _dbContext.Admins.FirstOrDefaultAsync(a =>
                        (a.Email != null && a.Email.ToLower() == lower) ||
                        a.MobileNumber == candidate ||
                        (a.FullName != null && a.FullName.ToLower() == lower));

                    if (admin != null) break;

                    user = await _dbContext.Users.FirstOrDefaultAsync(u =>
                        (u.Email != null && u.Email.ToLower() == lower) ||
                        u.MobileNumber == candidate ||
                        (u.FullName != null && u.FullName.ToLower() == lower));

                    if (user != null) break;

                    // Also check Staff
                    var staff = await _dbContext.Staff.AsNoTracking().FirstOrDefaultAsync(s =>
                        (s.Email != null && s.Email.ToLower() == lower) ||
                        s.Phone == candidate ||
                        (s.EmployeeId != null && s.EmployeeId.ToLower() == lower));

                    if (staff != null)
                    {
                        user = await _dbContext.Users.FirstOrDefaultAsync(u =>
                            (u.Email != null && staff.Email != null && u.Email.ToLower() == staff.Email.ToLower()) ||
                            (u.MobileNumber != null && staff.Phone != null && u.MobileNumber == staff.Phone) ||
                            (u.FullName != null && u.FullName.ToLower() == $"{staff.FirstName} {staff.LastName}".Trim().ToLower()));
                        if (user != null) break;
                    }

                    // Also check Student
                    var student = await _dbContext.Students.AsNoTracking().FirstOrDefaultAsync(s =>
                        (s.Email != null && s.Email.ToLower() == lower) ||
                        s.MobileNumber == candidate ||
                        (s.AdmissionNumber != null && s.AdmissionNumber.ToLower() == lower) ||
                        (s.RollNumber != null && s.RollNumber.ToLower() == lower));

                    if (student != null)
                    {
                        user = await _dbContext.Users.FirstOrDefaultAsync(u =>
                            (u.Email != null && student.Email != null && u.Email.ToLower() == student.Email.ToLower()) ||
                            (u.MobileNumber != null && student.MobileNumber != null && u.MobileNumber == student.MobileNumber));
                        if (user != null) break;
                    }
                }
            }

            if (admin == null && user == null)
            {
                throw new AppException("User account not found. Please log in again.", HttpStatusCode.NotFound);
            }

            // Verify current password against matched account
            bool oldPasswordValid = false;
            if (admin != null && VerifyPass(admin.PasswordHash, dto.OldPassword))
            {
                oldPasswordValid = true;
            }
            else if (user != null && VerifyPass(user.PasswordHash, dto.OldPassword))
            {
                oldPasswordValid = true;
            }

            if (!oldPasswordValid)
            {
                throw new AppException("Incorrect current password. Please try again.", HttpStatusCode.BadRequest);
            }

            // Hash new password and update all matching accounts across both admins and users tables
            var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            var emailsToSync = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var phonesToSync = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (!string.IsNullOrWhiteSpace(admin?.Email)) emailsToSync.Add(admin.Email.Trim());
            if (!string.IsNullOrWhiteSpace(user?.Email)) emailsToSync.Add(user.Email.Trim());
            if (!string.IsNullOrWhiteSpace(userEmailFromToken)) emailsToSync.Add(userEmailFromToken.Trim());
            if (!string.IsNullOrWhiteSpace(dto.EmailOrPhone) && dto.EmailOrPhone.Contains('@')) emailsToSync.Add(dto.EmailOrPhone.Trim());

            if (!string.IsNullOrWhiteSpace(admin?.MobileNumber)) phonesToSync.Add(admin.MobileNumber.Trim());
            if (!string.IsNullOrWhiteSpace(user?.MobileNumber)) phonesToSync.Add(user.MobileNumber.Trim());
            if (!string.IsNullOrWhiteSpace(dto.EmailOrPhone) && !dto.EmailOrPhone.Contains('@')) phonesToSync.Add(dto.EmailOrPhone.Trim());

            var matchedAdmins = await _dbContext.Admins.Where(a =>
                (admin != null && a.AdminId == admin.AdminId) ||
                (a.Email != null && emailsToSync.Contains(a.Email)) ||
                phonesToSync.Contains(a.MobileNumber)
            ).ToListAsync();

            foreach (var a in matchedAdmins)
            {
                a.PasswordHash = newPasswordHash;
            }

            var matchedUsers = await _dbContext.Users.Where(u =>
                (user != null && u.UserId == user.UserId) ||
                (u.Email != null && emailsToSync.Contains(u.Email)) ||
                phonesToSync.Contains(u.MobileNumber)
            ).ToListAsync();

            foreach (var u in matchedUsers)
            {
                u.PasswordHash = newPasswordHash;
            }

            await _dbContext.SaveChangesAsync();

            return true;
        }
    }
}
