using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SMS.Api.Controllers;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using Xunit;

namespace Backend.Tests.Controllers
{
    public class StaffControllerTests
    {
        private readonly Mock<ISchoolService> _schoolServiceMock;
        private readonly StaffController _controller;

        public StaffControllerTests()
        {
            _schoolServiceMock = new Mock<ISchoolService>();
            _controller = new StaffController(_schoolServiceMock.Object);
        }

        [Fact]
        public async Task GetAllStaff_ReturnsOkWithList()
        {
            var expectedList = new List<StaffResponseDto>
            {
                new StaffResponseDto { StaffId = 1, FirstName = "John" }
            };

            _schoolServiceMock.Setup(s => s.GetAllStaffAsync("John", "Science"))
                .ReturnsAsync(expectedList);

            var result = await _controller.GetAllStaff("John", "Science");

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetStaffById_ReturnsOkWithDto()
        {
            var expectedDto = new StaffResponseDto { StaffId = 1, FirstName = "John" };
            _schoolServiceMock.Setup(s => s.GetStaffByIdAsync(1))
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

            _schoolServiceMock.Setup(s => s.GetTeachersForDropdownAsync("John"))
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

            _schoolServiceMock.Setup(s => s.CreateStaffAsync(dto))
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

            _schoolServiceMock.Setup(s => s.UpdateStaffAsync(2, dto))
                .ReturnsAsync(expectedResponse);

            var result = await _controller.UpdateStaff(2, dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task DeleteStaff_ReturnsOk()
        {
            _schoolServiceMock.Setup(s => s.DeleteStaffAsync(1))
                .ReturnsAsync(true);

            var result = await _controller.DeleteStaff(1);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }
    }
}
