using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SMS.Api.Controllers.Auth;
using SMS.Api.Dtos.Auth;
using SMS.Api.Services.Interfaces;
using Xunit;

namespace Backend.Tests.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _authServiceMock;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _authServiceMock = new Mock<IAuthService>();
            _controller = new AuthController(_authServiceMock.Object);
        }

        [Fact]
        public async Task Register_ValidDto_ReturnsOkWithAuthResponseDto()
        {
            var dto = new RegisterRequestDto("John Doe", "john@example.com", "1234567890", "password", 1);
            var expectedResponse = new AuthResponseDto(1, "John Doe", "jwtToken", new List<string> { "Admin" });

            _authServiceMock.Setup(s => s.RegisterAsync(dto))
                .ReturnsAsync(expectedResponse);

            var actionResult = await _controller.Register(dto);

            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            Assert.Equal(expectedResponse, okResult.Value);
        }

        [Fact]
        public async Task Login_ValidDto_ReturnsOkWithAuthResponseDto()
        {
            var dto = new LoginRequestDto("john@example.com", "password");
            var expectedResponse = new AuthResponseDto(1, "John Doe", "jwtToken", new List<string> { "Admin" });

            _authServiceMock.Setup(s => s.LoginAsync(dto))
                .ReturnsAsync(expectedResponse);

            var actionResult = await _controller.Login(dto);

            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            Assert.Equal(expectedResponse, okResult.Value);
        }
    }
}
