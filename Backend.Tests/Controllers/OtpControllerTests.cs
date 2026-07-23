using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SMS.Api.Controllers.Auth;
using SMS.Api.Dtos;
using SMS.Api.Dtos.Otp;
using SMS.Api.Services.Interfaces;
using Xunit;

namespace Backend.Tests.Controllers
{
    public class OtpControllerTests
    {
        private readonly Mock<IOtpService> _otpServiceMock;
        private readonly OtpController _controller;

        public OtpControllerTests()
        {
            _otpServiceMock = new Mock<IOtpService>();
            _controller = new OtpController(_otpServiceMock.Object);
        }

        [Fact]
        public async Task SendOtp_ValidDto_ReturnsOkWithResponse()
        {
            var dto = new SendOtpRequestDto("test@example.com", "SMS");
            var sendResponse = new SendOtpResponseDto { Message = "OTP Sent", DeliveryMethod = "SMS" };

            _otpServiceMock.Setup(s => s.SendOtpAsync(dto))
                .ReturnsAsync(sendResponse);

            var actionResult = await _controller.SendOtp(dto);

            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task VerifyOtp_ValidDto_ReturnsOk()
        {
            var dto = new VerifyOtpRequestDto("test@example.com", "123456");

            _otpServiceMock.Setup(s => s.VerifyOtpAsync(dto))
                .ReturnsAsync(true);

            var actionResult = await _controller.VerifyOtp(dto);

            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task ResetPassword_ValidDto_ReturnsOk()
        {
            var dto = new ResetPasswordDto { EmailOrPhone = "test@example.com", OldPassword = "old", NewPassword = "new" };

            _otpServiceMock.Setup(s => s.ResetPasswordAsync(dto))
                .ReturnsAsync(true);

            var actionResult = await _controller.ResetPassword(dto);

            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            Assert.NotNull(okResult.Value);
        }
    }
}
