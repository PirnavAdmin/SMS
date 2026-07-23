using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Moq;
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
        private readonly Mock<IConfiguration> _configMock;
        private readonly AuthService _service;

        public AuthServiceTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _configMock = new Mock<IConfiguration>();

            _configMock.Setup(c => c["Jwt:Key"]).Returns("SuperSecretKeyThatIsAtLeast32BytesLongForSecurity!");
            _configMock.Setup(c => c["Jwt:Issuer"]).Returns("SMS.Api");
            _configMock.Setup(c => c["Jwt:Audience"]).Returns("SMS.Client");

            _service = new AuthService(_userRepoMock.Object, _configMock.Object);
        }

        [Fact]
        public async Task RegisterAsync_UserAlreadyExists_ThrowsConflictAppException()
        {
            var dto = new RegisterRequestDto("Jane Doe", "jane@example.com", "1234567890", "Password123!", 1);

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

            _userRepoMock.Setup(r => r.AddAsync(It.IsAny<User>()))
                .Callback<User>(u => u.UserId = 10)
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

            var ex = await Assert.ThrowsAsync<AppException>(() => _service.LoginAsync(dto));
            Assert.Equal(HttpStatusCode.Unauthorized, ex.StatusCode);
            Assert.Equal("Invalid credentials.", ex.Message);
        }

        [Fact]
        public async Task LoginAsync_InvalidPassword_ThrowsUnauthorizedAppException()
        {
            var user = new User
            {
                UserId = 1,
                FullName = "Admin User",
                Email = "admin@example.com",
                MobileNumber = "1234567890",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctPassword")
            };
            user.Roles.Add(new Role { RoleName = "Admin" });

            var dto = new LoginRequestDto("admin@example.com", "wrongPassword");

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync(user);

            var ex = await Assert.ThrowsAsync<AppException>(() => _service.LoginAsync(dto));
            Assert.Equal(HttpStatusCode.Unauthorized, ex.StatusCode);
        }

        [Fact]
        public async Task LoginAsync_ValidCredentials_ReturnsAuthResponseDto()
        {
            var password = "secretPassword123";
            var user = new User
            {
                UserId = 5,
                FullName = "Valid User",
                Email = "valid@example.com",
                MobileNumber = "9998887777",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
            };
            user.Roles.Add(new Role { RoleName = "Teacher" });

            var dto = new LoginRequestDto("valid@example.com", password);

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync(user);

            var response = await _service.LoginAsync(dto);

            Assert.NotNull(response);
            Assert.Equal(5, response.UserId);
            Assert.Equal("Valid User", response.FullName);
            Assert.False(string.IsNullOrEmpty(response.Token));
            Assert.Contains("Teacher", response.Roles);
        }
    }
}
