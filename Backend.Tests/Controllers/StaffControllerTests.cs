using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SMS.Api.Controllers.StaffManagement;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces.StaffManagement;
using Xunit;

namespace Backend.Tests.Controllers
{
    public class StaffControllerTests
    {
        private readonly Mock<IStaffService> _staffServiceMock;
        private readonly StaffController _controller;

        public StaffControllerTests()
        {
            _staffServiceMock = new Mock<IStaffService>();
            _controller = new StaffController(_staffServiceMock.Object);
        }

        [Fact]
        public async Task GetAllStaff_ReturnsOkWithList()
        {
            var expectedList = new List<StaffResponseDto>
            {
                new StaffResponseDto { StaffId = 1, FirstName = "John" }
            };

            _staffServiceMock.Setup(s => s.GetAllStaffAsync("John", "Science"))
                .ReturnsAsync(expectedList);

            var result = await _controller.GetAllStaff("John", "Science");

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetStaffById_ReturnsOkWithDto()
        {
            var expectedDto = new StaffResponseDto { StaffId = 1, FirstName = "John" };
            _staffServiceMock.Setup(s => s.GetStaffByIdAsync(1))
                .ReturnsAsync(expectedDto);

            var result = await _controller.GetStaffById(1);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetTeachersDropdown_ReturnsOkWithDropdownList()
        {
            var expectedList = new List<StaffDropdownDto>
            {
                new StaffDropdownDto { StaffId = 1, FullName = "John Doe" }
            };

            _staffServiceMock.Setup(s => s.GetTeachersForDropdownAsync("John"))
                .ReturnsAsync(expectedList);

            var result = await _controller.GetTeachersDropdown("John");

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task CreateStaff_ReturnsOkWithStaffResponseDto()
        {
            var dto = new StaffCreateDto { FirstName = "Jane", LastName = "Doe" };
            var expectedResponse = new StaffResponseDto { StaffId = 2, FirstName = "Jane", LastName = "Doe" };

            _staffServiceMock.Setup(s => s.CreateStaffAsync(dto))
                .ReturnsAsync(expectedResponse);

            var result = await _controller.CreateStaff(dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task UpdateStaff_ReturnsOkWithStaffResponseDto()
        {
            var dto = new StaffCreateDto { FirstName = "Jane", LastName = "Smith" };
            var expectedResponse = new StaffResponseDto { StaffId = 2, FirstName = "Jane", LastName = "Smith" };

            _staffServiceMock.Setup(s => s.UpdateStaffAsync(2, dto))
                .ReturnsAsync(expectedResponse);

            var result = await _controller.UpdateStaff(2, dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task DeleteStaff_ReturnsOk()
        {
            _staffServiceMock.Setup(s => s.DeleteStaffAsync(1))
                .ReturnsAsync(true);

            var result = await _controller.DeleteStaff(1);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }
    }
}
