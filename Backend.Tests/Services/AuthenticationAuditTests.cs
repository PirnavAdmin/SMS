using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using SMS.Api.Data;
using SMS.Api.Dtos.Auth;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Implementations;
using Xunit;

namespace Backend.Tests.Services
{
    public class AuthenticationAuditTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IAdminRepository> _adminRepoMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly AppDbContext _dbContext;
        private readonly AuthService _authService;

        public AuthenticationAuditTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _adminRepoMock = new Mock<IAdminRepository>();
            _configMock = new Mock<IConfiguration>();

            _configMock.Setup(c => c["Jwt:Key"]).Returns("SUPER_SECRET_JWT_KEY_FOR_TESTING_1234567890!");
            _configMock.Setup(c => c["Jwt:Issuer"]).Returns("SMS.Api");
            _configMock.Setup(c => c["Jwt:Audience"]).Returns("SMS.Client");

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _dbContext = new AppDbContext(options);

            _authService = new AuthService(_userRepoMock.Object, _adminRepoMock.Object, _configMock.Object, _dbContext);
        }

        // =========================================================================
        // Test A: Initial Login
        // =========================================================================
        [Fact]
        public async Task TestA_InitialLogin_ValidCredentials_ReturnsSuccessfulAuthWithClaims()
        {
            var password = "InitialPass@2026";
            var user = new User
            {
                UserId = 101,
                FullName = "Initial User",
                Email = "initial.user@school.test",
                MobileNumber = "9876500001",
                Role = "Teacher",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
            };
            user.Roles.Add(new Role { RoleName = "Teacher" });
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var loginDto = new LoginRequestDto("initial.user@school.test", password, "Teacher");
            var response = await _authService.LoginAsync(loginDto);

            Assert.NotNull(response);
            Assert.Equal(101, response.UserId);
            Assert.Equal("Initial User", response.FullName);
            Assert.Contains("Teacher", response.Roles);
            Assert.False(string.IsNullOrWhiteSpace(response.Token));

            // Validate JWT claims
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(response.Token);
            var idClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "sub")?.Value;
            var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            Assert.Equal("101", idClaim);
            Assert.Equal("Teacher", roleClaim);
        }

        // =========================================================================
        // Test B: Password Change
        // =========================================================================
        [Fact]
        public async Task TestB_PasswordChange_HashesNewPasswordAndUpdatesDatabase()
        {
            var oldPass = "CurrentPass@123";
            var newPass = "BrandNewPass@456";

            var user = new User
            {
                UserId = 102,
                FullName = "Teacher B",
                Email = "teacher.b@school.test",
                MobileNumber = "9876500002",
                Role = "Teacher",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPass)
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var changeDto = new ChangePasswordRequestDto
            {
                EmailOrPhone = user.Email,
                OldPassword = oldPass,
                NewPassword = newPass,
                ConfirmPassword = newPass
            };

            var success = await _authService.ChangePasswordAsync(
                changeDto,
                userEmailFromToken: user.Email,
                userIdFromToken: "102",
                userNameFromToken: user.FullName,
                userRoleFromToken: "Teacher"
            );

            Assert.True(success);

            var dbUser = await _dbContext.Users.FindAsync(102);
            Assert.NotNull(dbUser);
            // Verify new password is a valid BCrypt hash and NOT stored in plaintext
            Assert.StartsWith("$2", dbUser.PasswordHash);
            Assert.NotEqual(newPass, dbUser.PasswordHash);
            Assert.True(BCrypt.Net.BCrypt.Verify(newPass, dbUser.PasswordHash));
            Assert.False(BCrypt.Net.BCrypt.Verify(oldPass, dbUser.PasswordHash));
        }

        // =========================================================================
        // Test C: New Password Login
        // =========================================================================
        [Fact]
        public async Task TestC_NewPasswordLogin_SucceedsAfterChange()
        {
            var oldPass = "PasswordA@123";
            var newPass = "PasswordB@456";

            var user = new User
            {
                UserId = 103,
                FullName = "Student C",
                Email = "student.c@school.test",
                MobileNumber = "9876500003",
                Role = "Student",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPass)
            };
            user.Roles.Add(new Role { RoleName = "Student" });
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            // Execute password change
            await _authService.ChangePasswordAsync(
                new ChangePasswordRequestDto { EmailOrPhone = user.Email, OldPassword = oldPass, NewPassword = newPass, ConfirmPassword = newPass },
                userEmailFromToken: user.Email,
                userIdFromToken: "103",
                userNameFromToken: user.FullName,
                userRoleFromToken: "Student"
            );

            // Attempt login with new password
            var loginDto = new LoginRequestDto("student.c@school.test", newPass, "Student");
            var res = await _authService.LoginAsync(loginDto);

            Assert.NotNull(res);
            Assert.Equal(103, res.UserId);
        }

        // =========================================================================
        // Test D: Old Password Login Fails
        // =========================================================================
        [Fact]
        public async Task TestD_OldPasswordLogin_FailsWithUnauthorizedAfterChange()
        {
            var oldPass = "PasswordOld@123";
            var newPass = "PasswordNew@456";

            var user = new User
            {
                UserId = 104,
                FullName = "Parent D",
                Email = "parent.d@school.test",
                MobileNumber = "9876500004",
                Role = "Parent",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPass)
            };
            user.Roles.Add(new Role { RoleName = "Parent" });
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            // Execute password change
            await _authService.ChangePasswordAsync(
                new ChangePasswordRequestDto { EmailOrPhone = user.Email, OldPassword = oldPass, NewPassword = newPass, ConfirmPassword = newPass },
                userEmailFromToken: user.Email,
                userIdFromToken: "104",
                userNameFromToken: user.FullName,
                userRoleFromToken: "Parent"
            );

            // Attempt login with old password
            var oldLoginDto = new LoginRequestDto("parent.d@school.test", oldPass, "Parent");
            var ex = await Assert.ThrowsAsync<AppException>(() => _authService.LoginAsync(oldLoginDto));

            Assert.Equal(HttpStatusCode.Unauthorized, ex.StatusCode);
        }

        // =========================================================================
        // Test E: Persistence Across Simulated Restart
        // =========================================================================
        [Fact]
        public async Task TestE_Persistence_NewPasswordRemainsValidAndIsNeverOverwrittenByStartupSync()
        {
            var oldPass = "InitialPass@123";
            var newPass = "ChangedPass@789";
            var studentId = "2026AD0099";

            var studentUser = new User
            {
                UserId = 105,
                FullName = "Student E",
                Email = $"{studentId.ToLowerInvariant()}@school.internal",
                MobileNumber = studentId,
                Role = "Student",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPass)
            };
            studentUser.Roles.Add(new Role { RoleName = "Student" });
            _dbContext.Users.Add(studentUser);
            await _dbContext.SaveChangesAsync();

            // 1. Student changes password
            await _authService.ChangePasswordAsync(
                new ChangePasswordRequestDto { EmailOrPhone = studentUser.Email, OldPassword = oldPass, NewPassword = newPass, ConfirmPassword = newPass },
                userEmailFromToken: studentUser.Email,
                userIdFromToken: "105",
                userNameFromToken: studentUser.FullName,
                userRoleFromToken: "Student"
            );

            // 2. Simulate Backend Startup Sync (Program.cs line 2916)
            // Startup sync checks: if (string.IsNullOrWhiteSpace(existingU.PasswordHash)) { ... }
            var existingU = await _dbContext.Users.FindAsync(105);
            Assert.NotNull(existingU);
            if (string.IsNullOrWhiteSpace(existingU.PasswordHash))
            {
                existingU.PasswordHash = BCrypt.Net.BCrypt.HashPassword(studentId);
            }
            await _dbContext.SaveChangesAsync();

            // 3. New password must still succeed
            var loginWithNew = await _authService.LoginAsync(new LoginRequestDto(studentUser.Email, newPass, "Student"));
            Assert.NotNull(loginWithNew);

            // 4. Old password and default roll number must both fail
            await Assert.ThrowsAsync<AppException>(() => _authService.LoginAsync(new LoginRequestDto(studentUser.Email, oldPass, "Student")));
            await Assert.ThrowsAsync<AppException>(() => _authService.LoginAsync(new LoginRequestDto(studentUser.Email, studentId, "Student")));
        }

        // =========================================================================
        // Test F: Invalid Current Password
        // =========================================================================
        [Fact]
        public async Task TestF_InvalidCurrentPassword_RejectsChangeAndPreservesCurrentPassword()
        {
            var currentPass = "ValidPass@123";
            var wrongCurrent = "IncorrectPass@999";
            var attemptedNew = "NewPassAttempt@456";

            var user = new User
            {
                UserId = 106,
                FullName = "Staff F",
                Email = "staff.f@school.test",
                MobileNumber = "9876500006",
                Role = "Teacher",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(currentPass)
            };
            user.Roles.Add(new Role { RoleName = "Teacher" });
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var changeDto = new ChangePasswordRequestDto
            {
                EmailOrPhone = user.Email,
                OldPassword = wrongCurrent,
                NewPassword = attemptedNew,
                ConfirmPassword = attemptedNew
            };

            var ex = await Assert.ThrowsAsync<AppException>(() => _authService.ChangePasswordAsync(
                changeDto,
                userEmailFromToken: user.Email,
                userIdFromToken: "106",
                userNameFromToken: user.FullName,
                userRoleFromToken: "Teacher"
            ));

            Assert.Equal(HttpStatusCode.BadRequest, ex.StatusCode);
            Assert.Contains("Incorrect current password", ex.Message);

            // Verify original password is intact in DB and still logs in
            var loginCheck = await _authService.LoginAsync(new LoginRequestDto(user.Email, currentPass, "Teacher"));
            Assert.NotNull(loginCheck);

            // Verify attempted new password fails
            await Assert.ThrowsAsync<AppException>(() => _authService.LoginAsync(new LoginRequestDto(user.Email, attemptedNew, "Teacher")));
        }

        // =========================================================================
        // Test G: Cross-Role Validation
        // =========================================================================
        [Theory]
        [InlineData("Admin", "admin.role@school.test", "Admin@2026!")]
        [InlineData("Teacher", "teacher.role@school.test", "Teacher@2026!")]
        [InlineData("Hostel Warden", "warden.role@school.test", "Warden@2026!")]
        [InlineData("Driver", "driver.role@school.test", "Driver@2026!")]
        [InlineData("Accountant", "accountant.role@school.test", "Accountant@2026!")]
        [InlineData("Librarian", "librarian.role@school.test", "Librarian@2026!")]
        public async Task TestG_CrossRoleValidation_FullPasswordLifecycleWorksAcrossRoles(string role, string email, string oldPass)
        {
            var newPass = oldPass + "_updated";
            var user = new User
            {
                FullName = $"{role} User",
                Email = email,
                MobileNumber = $"98765{new Random().Next(10000, 99999)}",
                Role = role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPass)
            };
            user.Roles.Add(new Role { RoleName = role });
            _dbContext.Users.Add(user);

            Admin? adminEntity = null;
            if (role == "Admin")
            {
                adminEntity = new Admin
                {
                    FullName = user.FullName,
                    Email = user.Email,
                    MobileNumber = user.MobileNumber,
                    Role = "Admin",
                    PasswordHash = user.PasswordHash
                };
                adminEntity.Roles.Add(new Role { RoleName = "Admin" });
                _dbContext.Admins.Add(adminEntity);
                _adminRepoMock.Setup(r => r.GetByIdentifierAsync(email)).ReturnsAsync(adminEntity);
            }
            await _dbContext.SaveChangesAsync();

            var tokenUserId = role == "Admin" ? adminEntity!.AdminId.ToString() : user.UserId.ToString();

            // 1. Initial Login with old password succeeds
            var initialLogin = await _authService.LoginAsync(new LoginRequestDto(email, oldPass, role));
            Assert.NotNull(initialLogin);

            // 2. Change password
            var changeSuccess = await _authService.ChangePasswordAsync(
                new ChangePasswordRequestDto { EmailOrPhone = email, OldPassword = oldPass, NewPassword = newPass, ConfirmPassword = newPass },
                userEmailFromToken: email,
                userIdFromToken: tokenUserId,
                userNameFromToken: user.FullName,
                userRoleFromToken: role
            );
            Assert.True(changeSuccess);

            // 3. Login with new password succeeds
            var newLogin = await _authService.LoginAsync(new LoginRequestDto(email, newPass, role));
            Assert.NotNull(newLogin);

            // 4. Login with old password fails
            await Assert.ThrowsAsync<AppException>(() => _authService.LoginAsync(new LoginRequestDto(email, oldPass, role)));
        }

        // =========================================================================
        // Test H: Account Isolation
        // =========================================================================
        [Fact]
        public async Task TestH_AccountIsolation_ChangingUserAPasswordDoesNotAffectUserBEvenWithSharedPhone()
        {
            var sharedPhone = "9876543999";
            var userAPass = "AlicePass@123";
            var userBPass = "BobPass@123";
            var userANewPass = "AliceNewPass@456";

            // Sibling A
            var userA = new User
            {
                UserId = 201,
                FullName = "Alice Sibling",
                Email = "alice@family.test",
                MobileNumber = sharedPhone,
                Role = "Student",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(userAPass)
            };
            userA.Roles.Add(new Role { RoleName = "Student" });
            _dbContext.Users.Add(userA);

            // Sibling B (sharing father's mobile number)
            var userB = new User
            {
                UserId = 202,
                FullName = "Bob Sibling",
                Email = "bob@family.test",
                MobileNumber = sharedPhone,
                Role = "Student",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(userBPass)
            };
            userB.Roles.Add(new Role { RoleName = "Student" });
            _dbContext.Users.Add(userB);
            await _dbContext.SaveChangesAsync();

            // User A changes their password
            var changeResult = await _authService.ChangePasswordAsync(
                new ChangePasswordRequestDto { EmailOrPhone = userA.Email, OldPassword = userAPass, NewPassword = userANewPass, ConfirmPassword = userANewPass },
                userEmailFromToken: userA.Email,
                userIdFromToken: "201",
                userNameFromToken: userA.FullName,
                userRoleFromToken: "Student"
            );
            Assert.True(changeResult);

            // Verify User A has new password in DB
            var dbUserA = await _dbContext.Users.FindAsync(201);
            Assert.NotNull(dbUserA);
            Assert.True(BCrypt.Net.BCrypt.Verify(userANewPass, dbUserA.PasswordHash));

            // Verify User B's password in DB was NOT MODIFIED!
            var dbUserB = await _dbContext.Users.FindAsync(202);
            Assert.NotNull(dbUserB);
            Assert.True(BCrypt.Net.BCrypt.Verify(userBPass, dbUserB.PasswordHash));
            Assert.False(BCrypt.Net.BCrypt.Verify(userANewPass, dbUserB.PasswordHash));

            // Verify User B can still log in with their original password
            var userBLogin = await _authService.LoginAsync(new LoginRequestDto(userB.Email, userBPass, "Student"));
            Assert.NotNull(userBLogin);
            Assert.Equal(202, userBLogin.UserId);
        }

        // =========================================================================
        // Test I: Hardcoded Authentication Audit
        // =========================================================================
        [Fact]
        public async Task TestI_HardcodedDataAudit_NoPlaintextMatchOrDefaultIdBypassAllowed()
        {
            var correctPass = "ComplexSecret@2026!";
            var staffEmpId = "EMP1099";

            var staffUser = new User
            {
                UserId = 301,
                FullName = "Audited Staff",
                Email = "audited.staff@school.test",
                MobileNumber = staffEmpId,
                Role = "Teacher",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(correctPass)
            };
            staffUser.Roles.Add(new Role { RoleName = "Teacher" });
            _dbContext.Users.Add(staffUser);

            var staffEntity = new Staff
            {
                StaffId = 301,
                EmployeeId = staffEmpId,
                FirstName = "Audited",
                LastName = "Staff",
                Email = "audited.staff@school.test",
                Phone = staffEmpId,
                Designation = "Teacher",
                EmployeeCategory = "Teaching Staff"
            };
            _dbContext.Staff.Add(staffEntity);
            await _dbContext.SaveChangesAsync();

            // 1. Attempting login using staff EmployeeId as password MUST FAIL once user has password hash
            await Assert.ThrowsAsync<AppException>(() => _authService.LoginAsync(new LoginRequestDto("audited.staff@school.test", staffEmpId, "Teacher")));

            // 2. Attempting login with raw hash string MUST FAIL (no plaintext match `hash == plainPassword`)
            await Assert.ThrowsAsync<AppException>(() => _authService.LoginAsync(new LoginRequestDto("audited.staff@school.test", staffUser.PasswordHash, "Teacher")));

            // 3. Attempting login with lowercase variance on @-containing password MUST FAIL
            await Assert.ThrowsAsync<AppException>(() => _authService.LoginAsync(new LoginRequestDto("audited.staff@school.test", correctPass.ToLowerInvariant(), "Teacher")));

            // 4. Correct password must still work
            var validLogin = await _authService.LoginAsync(new LoginRequestDto("audited.staff@school.test", correctPass, "Teacher"));
            Assert.NotNull(validLogin);
        }
    }
}
