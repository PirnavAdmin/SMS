using System;
using System.Collections.Generic;
using System.Net;
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
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IAdminRepository> _adminRepoMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly AppDbContext _dbContext;
        private readonly AuthService _service;

        public AuthServiceTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _adminRepoMock = new Mock<IAdminRepository>();
            _configMock = new Mock<IConfiguration>();

            _configMock.Setup(c => c["Jwt:Key"]).Returns("SuperSecretKeyThatIsAtLeast32BytesLongForSecurity!");
            _configMock.Setup(c => c["Jwt:Issuer"]).Returns("SMS.Api");
            _configMock.Setup(c => c["Jwt:Audience"]).Returns("SMS.Client");

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _dbContext = new AppDbContext(options);

            _service = new AuthService(_userRepoMock.Object, _adminRepoMock.Object, _configMock.Object, _dbContext);
        }

        [Fact]
        public async Task RegisterAsync_UserAlreadyExists_ThrowsConflictAppException()
        {
            var dto = new RegisterRequestDto("Jane Doe", "jane@example.com", "1234567890", "Password123!", 1);

            _userRepoMock.Setup(r => r.GetRoleByIdAsync(dto.RoleId))
                .ReturnsAsync(new Role { RoleId = dto.RoleId, RoleName = "Teacher" });
            _userRepoMock.Setup(r => r.ExistsAsync(dto.MobileNumber, dto.Email))
                .ReturnsAsync(true);

            var ex = await Assert.ThrowsAsync<AppException>(() => _service.RegisterAsync(dto));
            Assert.Equal(HttpStatusCode.Conflict, ex.StatusCode);
            Assert.Equal("User with provided Email or Mobile Number already exists.", ex.Message);
        }

        [Fact]
        public async Task RegisterAsync_InvalidRoleId_ThrowsBadRequestAppException()
        {
            var dto = new RegisterRequestDto("Jane Doe", "jane@example.com", "1234567890", "Password123!", 99);

            _userRepoMock.Setup(r => r.ExistsAsync(dto.MobileNumber, dto.Email))
                .ReturnsAsync(false);
            _userRepoMock.Setup(r => r.GetRoleByIdAsync(99))
                .ReturnsAsync((Role?)null);

            var ex = await Assert.ThrowsAsync<AppException>(() => _service.RegisterAsync(dto));
            Assert.Equal(HttpStatusCode.BadRequest, ex.StatusCode);
            Assert.Equal("Invalid Role ID specified.", ex.Message);
        }

        [Fact]
        public async Task RegisterAsync_ValidData_ReturnsAuthResponseDtoWithJwtToken()
        {
            var dto = new RegisterRequestDto("Jane Doe", "jane@example.com", "1234567890", "Password123!", 1);
            var role = new Role { RoleId = 1, RoleName = "Admin", Description = "Admin Role" };

            _userRepoMock.Setup(r => r.ExistsAsync(dto.MobileNumber, dto.Email))
                .ReturnsAsync(false);
            _userRepoMock.Setup(r => r.GetRoleByIdAsync(1))
                .ReturnsAsync(role);

            _adminRepoMock.Setup(r => r.AddAsync(It.IsAny<Admin>()))
                .Callback<Admin>(a => a.AdminId = 10)
                .Returns(Task.CompletedTask);

            var response = await _service.RegisterAsync(dto);

            Assert.NotNull(response);
            Assert.Equal(10, response.UserId);
            Assert.Equal("Jane Doe", response.FullName);
            Assert.False(string.IsNullOrEmpty(response.Token));
            Assert.Contains("Admin", response.Roles);
        }

        [Fact]
        public async Task LoginAsync_UserNotFound_ThrowsUnauthorizedAppException()
        {
            var dto = new LoginRequestDto("nonexistent@example.com", "password");

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync((User?)null);
            _adminRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync((Admin?)null);

            var ex = await Assert.ThrowsAsync<AppException>(() => _service.LoginAsync(dto));
            Assert.Equal(HttpStatusCode.Unauthorized, ex.StatusCode);
            Assert.Equal("Invalid email/mobile number or password.", ex.Message);
        }

        [Fact]
        public async Task LoginAsync_InvalidPassword_ThrowsUnauthorizedAppException()
        {
            var correctPassword = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword();
            var wrongPassword = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword() + "_wrong";
            var user = new User
            {
                UserId = 1,
                FullName = "Admin User",
                Email = "admin@example.com",
                MobileNumber = "1234567890",
                Role = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(correctPassword)
            };
            user.Roles.Add(new Role { RoleName = "Admin" });
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var dto = new LoginRequestDto("admin@example.com", wrongPassword);

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync(user);

            var ex = await Assert.ThrowsAsync<AppException>(() => _service.LoginAsync(dto));
            Assert.Equal(HttpStatusCode.Unauthorized, ex.StatusCode);
        }

        [Fact]
        public async Task LoginAsync_ValidCredentials_ReturnsAuthResponseDto()
        {
            var password = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword();
            var user = new User
            {
                UserId = 5,
                FullName = "Valid User",
                Email = "valid@example.com",
                MobileNumber = "9998887777",
                Role = "Teacher",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
            };
            user.Roles.Add(new Role { RoleName = "Teacher" });
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var dto = new LoginRequestDto("valid@example.com", password, "Teacher");

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync(user);

            var response = await _service.LoginAsync(dto);

            Assert.NotNull(response);
            Assert.Equal(5, response.UserId);
            Assert.Equal("Valid User", response.FullName);
            Assert.False(string.IsNullOrEmpty(response.Token));
            Assert.Contains("Teacher", response.Roles);
        }
        [Fact]
        public async Task ChangePasswordAsync_WhenAdminAndUserExist_UpdatesBothTablesAndInvalidatesOldPassword()
        {
            var oldPassword = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword();
            var newPassword = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword() + "_new";

            var admin = new Admin
            {
                AdminId = 10,
                FullName = "Dr. Eleanor Vance",
                Email = "admin@pirnavschools.com",
                MobileNumber = "9876543210",
                Role = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPassword)
            };
            _dbContext.Admins.Add(admin);

            var user = new User
            {
                UserId = 779,
                FullName = "Dr. Eleanor Vance",
                Email = "admin@pirnavschools.com",
                MobileNumber = "9876543210",
                Role = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPassword)
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            var dto = new ChangePasswordRequestDto
            {
                EmailOrPhone = "admin@pirnavschools.com",
                OldPassword = oldPassword,
                NewPassword = newPassword,
                ConfirmPassword = newPassword
            };

            var result = await _service.ChangePasswordAsync(
                dto,
                userEmailFromToken: "admin@pirnavschools.com",
                userIdFromToken: "10",
                userNameFromToken: "Dr. Eleanor Vance",
                userRoleFromToken: "Admin"
            );

            Assert.True(result);

            // Re-fetch both from dbContext
            var updatedAdmin = await _dbContext.Admins.FindAsync(10);
            var updatedUser = await _dbContext.Users.FindAsync(779);

            Assert.NotNull(updatedAdmin);
            Assert.NotNull(updatedUser);

            // 1. Old password MUST FAIL on both
            Assert.False(BCrypt.Net.BCrypt.Verify(oldPassword, updatedAdmin.PasswordHash));
            Assert.False(BCrypt.Net.BCrypt.Verify(oldPassword, updatedUser.PasswordHash));

            // 2. New password MUST SUCCEED on both
            Assert.True(BCrypt.Net.BCrypt.Verify(newPassword, updatedAdmin.PasswordHash));
            Assert.True(BCrypt.Net.BCrypt.Verify(newPassword, updatedUser.PasswordHash));
        }

        [Fact]
        public async Task ChangePasswordAsync_WithWrongCurrentPassword_ThrowsBadRequest()
        {
            var validOldPass = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword();
            var wrongOldPass = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword() + "_wrong";
            var newPass = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword() + "_new";
            var admin = new Admin
            {
                AdminId = 20,
                FullName = "Admin Two",
                Email = "admin2@pirnavschools.com",
                MobileNumber = "9876543211",
                Role = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(validOldPass)
            };
            _dbContext.Admins.Add(admin);
            await _dbContext.SaveChangesAsync();

            var dto = new ChangePasswordRequestDto
            {
                EmailOrPhone = "admin2@pirnavschools.com",
                OldPassword = wrongOldPass,
                NewPassword = newPass,
                ConfirmPassword = newPass
            };

            var ex = await Assert.ThrowsAsync<AppException>(() => _service.ChangePasswordAsync(
                dto,
                userEmailFromToken: "admin2@pirnavschools.com",
                userIdFromToken: "20",
                userNameFromToken: "Admin Two",
                userRoleFromToken: "Admin"
            ));

            Assert.Equal(HttpStatusCode.BadRequest, ex.StatusCode);
            Assert.Contains("Incorrect current password", ex.Message);
        }
        [Fact]
        public async Task ParentLoginAsync_AfterPasswordChanged_LoginWithNewPasswordSucceedsAndOldPasswordFails()
        {
            var oldPassword = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword();
            var newPassword = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword() + "_new";

            var parentUserA = new User
            {
                UserId = 881,
                FullName = "Suresh Parent",
                Email = "suresh.parentA@example.com",
                MobileNumber = "9988771122",
                Role = "Parent",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPassword)
            };
            parentUserA.Roles.Add(new Role { RoleName = "Parent" });
            _dbContext.Users.Add(parentUserA);

            // Add a second parent with identical name and old password to ensure no fallback/collision
            var parentUserB = new User
            {
                UserId = 882,
                FullName = "Suresh Parent",
                Email = "suresh.parentB@example.com",
                MobileNumber = "9988771133",
                Role = "Parent",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPassword)
            };
            parentUserB.Roles.Add(new Role { RoleName = "Parent" });
            _dbContext.Users.Add(parentUserB);

            // Add student mapped to parentUserA
            var student = new Student
            {
                StudentId = 991,
                StudentName = "Abhinav Student",
                AdmissionNumber = "ADM-881",
                RollNumber = "ROL-881",
                FatherName = "Suresh Parent",
                FatherMobile = "9988771122",
                Email = "abhinav.student@example.com",
                Status = "Active"
            };
            _dbContext.Students.Add(student);

            var mapping = new ParentStudentMapping
            {
                ParentUserId = 881,
                StudentId = 991,
                RelationshipType = "Father",
                Status = "Active"
            };
            _dbContext.ParentStudentMappings.Add(mapping);
            await _dbContext.SaveChangesAsync();

            // 1. Change password for Parent A
            var changeDto = new ChangePasswordRequestDto
            {
                EmailOrPhone = "suresh.parentA@example.com",
                OldPassword = oldPassword,
                NewPassword = newPassword,
                ConfirmPassword = newPassword
            };

            var changeResult = await _service.ChangePasswordAsync(
                changeDto,
                userEmailFromToken: "suresh.parentA@example.com",
                userIdFromToken: "881",
                userNameFromToken: "Suresh Parent",
                userRoleFromToken: "Parent"
            );
            Assert.True(changeResult);

            // 2. Login with NEW password MUST succeed and return Parent A's identity
            var newLoginDto = new LoginRequestDto("suresh.parentA@example.com", newPassword, "Parent");
            var authResponse = await _service.LoginAsync(newLoginDto);
            Assert.NotNull(authResponse);
            Assert.Equal(881, authResponse.UserId);
            Assert.Equal("suresh.parentA@example.com", authResponse.Email);
            Assert.False(string.IsNullOrEmpty(authResponse.Token));

            // 3. Login with OLD password MUST throw Unauthorized AppException and NEVER match Parent B
            var oldLoginDto = new LoginRequestDto("suresh.parentA@example.com", oldPassword, "Parent");
            var ex = await Assert.ThrowsAsync<AppException>(() => _service.LoginAsync(oldLoginDto));
            Assert.Equal(HttpStatusCode.Unauthorized, ex.StatusCode);
            Assert.Equal("Invalid email/mobile number or password.", ex.Message);
        }

        [Fact]
        public async Task ParentLoginAsync_GenericLoginWithoutPortal_OldPasswordFailsSecurely()
        {
            var oldPassword = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword();
            var newPassword = SMS.Api.Helpers.PasswordHelper.GenerateDynamicPassword() + "_new";

            var parentUser = new User
            {
                UserId = 883,
                FullName = "Ramesh Parent",
                Email = "ramesh.parent@example.com",
                MobileNumber = "9988772244",
                Role = "Parent",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPassword)
            };
            parentUser.Roles.Add(new Role { RoleName = "Parent" });
            _dbContext.Users.Add(parentUser);
            await _dbContext.SaveChangesAsync();

            // Change password
            var changeDto = new ChangePasswordRequestDto
            {
                EmailOrPhone = "ramesh.parent@example.com",
                OldPassword = oldPassword,
                NewPassword = newPassword,
                ConfirmPassword = newPassword
            };

            await _service.ChangePasswordAsync(
                changeDto,
                userEmailFromToken: "ramesh.parent@example.com",
                userIdFromToken: "883",
                userNameFromToken: "Ramesh Parent",
                userRoleFromToken: "Parent"
            );

            // Generic login (portal is null) with old password MUST fail
            var genericOldLogin = new LoginRequestDto("ramesh.parent@example.com", oldPassword, null);
            var ex = await Assert.ThrowsAsync<AppException>(() => _service.LoginAsync(genericOldLogin));
            Assert.Equal(HttpStatusCode.Unauthorized, ex.StatusCode);

            // Generic login with new password MUST succeed
            var genericNewLogin = new LoginRequestDto("ramesh.parent@example.com", newPassword, null);
            var res = await _service.LoginAsync(genericNewLogin);
            Assert.NotNull(res);
            Assert.Equal(883, res.UserId);
        }
    }
}