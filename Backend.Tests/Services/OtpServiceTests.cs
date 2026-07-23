using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Moq;
using SMS.Api.Dtos;
using SMS.Api.Dtos.Otp;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Implementations;
using Xunit;

namespace Backend.Tests.Services
{
    public class OtpServiceTests
    {
        private readonly Mock<IOtpRepository> _otpRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly OtpService _service;

        public OtpServiceTests()
        {
            _otpRepoMock = new Mock<IOtpRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _configMock = new Mock<IConfiguration>();

            _service = new OtpService(_otpRepoMock.Object, _userRepoMock.Object, _configMock.Object);
        }

        [Fact]
        public async Task SendOtpAsync_UserNotFound_ThrowsException()
        {
            var dto = new SendOtpRequestDto("unknown@example.com", "SMS");
            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync((User?)null);

            await Assert.ThrowsAsync<Exception>(() => _service.SendOtpAsync(dto));
        }

        [Fact]
        public async Task SendOtpAsync_UserFound_SavesOtpAndReturnsResponse()
        {
            var user = new User { UserId = 1, Email = "user@example.com", MobileNumber = "1234567890" };
            var dto = new SendOtpRequestDto("user@example.com", "SMS");

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync(user);

            var response = await _service.SendOtpAsync(dto);

            Assert.NotNull(response);
            Assert.Equal("SMS", response.DeliveryMethod);
            Assert.Contains("OTP sent successfully", response.Message);
            _otpRepoMock.Verify(r => r.SaveOtpAsync(It.IsAny<OtpVerification>()), Times.Once);
        }

        [Fact]
        public async Task VerifyOtpAsync_UserNotFound_ReturnsFalse()
        {
            var dto = new VerifyOtpRequestDto("unknown@example.com", "123456");
            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync((User?)null);

            bool result = await _service.VerifyOtpAsync(dto);
            Assert.False(result);
        }

        [Fact]
        public async Task VerifyOtpAsync_NoActiveOtp_ReturnsFalse()
        {
            var user = new User { UserId = 2, Email = "user2@example.com", MobileNumber = "999" };
            var dto = new VerifyOtpRequestDto("user2@example.com", "123456");

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync(user);
            _otpRepoMock.Setup(r => r.GetLatestActiveOtpAsync(2, "General"))
                .ReturnsAsync((OtpVerification?)null);

            bool result = await _service.VerifyOtpAsync(dto);
            Assert.False(result);
        }

        [Fact]
        public async Task VerifyOtpAsync_ExpiredOtp_ReturnsFalse()
        {
            var user = new User { UserId = 3, Email = "user3@example.com", MobileNumber = "888" };
            var dto = new VerifyOtpRequestDto("user3@example.com", "123456");
            var expiredOtp = new OtpVerification
            {
                UserId = 3,
                OtpCodeHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                ExpiryTime = DateTime.UtcNow.AddMinutes(-5)
            };

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync(user);
            _otpRepoMock.Setup(r => r.GetLatestActiveOtpAsync(3, "General"))
                .ReturnsAsync(expiredOtp);

            bool result = await _service.VerifyOtpAsync(dto);
            Assert.False(result);
        }

        [Fact]
        public async Task VerifyOtpAsync_ValidOtp_ReturnsTrue()
        {
            var user = new User { UserId = 4, Email = "user4@example.com", MobileNumber = "777" };
            var dto = new VerifyOtpRequestDto("user4@example.com", "654321");
            var activeOtp = new OtpVerification
            {
                UserId = 4,
                OtpCodeHash = BCrypt.Net.BCrypt.HashPassword("654321"),
                ExpiryTime = DateTime.UtcNow.AddMinutes(5)
            };

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync(user);
            _otpRepoMock.Setup(r => r.GetLatestActiveOtpAsync(4, "General"))
                .ReturnsAsync(activeOtp);

            bool result = await _service.VerifyOtpAsync(dto);
            Assert.True(result);
        }

        [Fact]
        public async Task ResetPasswordAsync_UserNotFound_ThrowsException()
        {
            var dto = new ResetPasswordDto { EmailOrPhone = "none@example.com", OldPassword = "old" };
            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync((User?)null);

            await Assert.ThrowsAsync<Exception>(() => _service.ResetPasswordAsync(dto));
        }

        [Fact]
        public async Task ResetPasswordAsync_WithValidOldPassword_UpdatesPassword()
        {
            var user = new User
            {
                UserId = 5,
                Email = "user5@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("oldSecret123")
            };
            var dto = new ResetPasswordDto
            {
                EmailOrPhone = "user5@example.com",
                OldPassword = "oldSecret123",
                NewPassword = "newSecret456"
            };

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync(user);

            bool result = await _service.ResetPasswordAsync(dto);

            Assert.True(result);
            _userRepoMock.Verify(r => r.UpdatePasswordAsync(5, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task ResetPasswordAsync_WithInvalidOldPassword_ThrowsException()
        {
            var user = new User
            {
                UserId = 6,
                Email = "user6@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctOld")
            };
            var dto = new ResetPasswordDto
            {
                EmailOrPhone = "user6@example.com",
                OldPassword = "wrongOld",
                NewPassword = "newSecret456"
            };

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync(user);

            await Assert.ThrowsAsync<Exception>(() => _service.ResetPasswordAsync(dto));
        }

        [Fact]
        public async Task ResetPasswordAsync_WithoutPasswordOrOtp_ThrowsException()
        {
            var user = new User { UserId = 7, Email = "user7@example.com" };
            var dto = new ResetPasswordDto { EmailOrPhone = "user7@example.com", NewPassword = "new" };

            _userRepoMock.Setup(r => r.GetByIdentifierAsync(dto.EmailOrPhone))
                .ReturnsAsync(user);

            var ex = await Assert.ThrowsAsync<Exception>(() => _service.ResetPasswordAsync(dto));
            Assert.Contains("Please provide either your Old Password or an OTP code", ex.Message);
        }
    }
}
