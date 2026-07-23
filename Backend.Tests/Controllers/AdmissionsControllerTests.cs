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
    public class AdmissionsControllerTests
    {
        private readonly Mock<ISchoolService> _schoolServiceMock;
        private readonly AdmissionsController _controller;

        public AdmissionsControllerTests()
        {
            _schoolServiceMock = new Mock<ISchoolService>();
            _controller = new AdmissionsController(_schoolServiceMock.Object);
        }

        [Fact]
        public async Task GetApplications_ReturnsOkWithList()
        {
            var expectedList = new List<AdmissionApplicationResponseDto>
            {
                new AdmissionApplicationResponseDto { Id = 1, FirstName = "Alice", LastName = "Smith" }
            };

            _schoolServiceMock.Setup(s => s.GetAllApplicationsAsync("Alice", "Main", 1, "Pending"))
                .ReturnsAsync(expectedList);

            var result = await _controller.GetApplications("Alice", "Main", 1, "Pending");

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetApplicationById_ReturnsOkWithDto()
        {
            var expectedDto = new AdmissionApplicationResponseDto { Id = 1, FirstName = "Alice", LastName = "Smith" };

            _schoolServiceMock.Setup(s => s.GetApplicationByIdAsync(1))
                .ReturnsAsync(expectedDto);

            var result = await _controller.GetApplicationById(1);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task SubmitApplication_ReturnsOkWithDto()
        {
            var dto = new SubmitAdmissionDto { FirstName = "Bob", LastName = "Jones", BranchName = "Main", MotherName = "Sarah" };
            var expectedDto = new AdmissionApplicationResponseDto { Id = 2, FirstName = "Bob", LastName = "Jones", MotherName = "Sarah" };

            _schoolServiceMock.Setup(s => s.SubmitApplicationAsync(dto))
                .ReturnsAsync(expectedDto);

            var result = await _controller.SubmitApplication(dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task UpdateApplication_ReturnsOkWithDto()
        {
            var dto = new SubmitAdmissionDto { FirstName = "Bob", LastName = "Jones Updated", BranchName = "Main" };
            var expectedDto = new AdmissionApplicationResponseDto { Id = 2, FirstName = "Bob", LastName = "Jones Updated" };

            _schoolServiceMock.Setup(s => s.UpdateApplicationAsync(2, dto))
                .ReturnsAsync(expectedDto);

            var result = await _controller.UpdateApplication(2, dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task DeleteApplication_ReturnsOk()
        {
            _schoolServiceMock.Setup(s => s.DeleteApplicationAsync(2))
                .ReturnsAsync(true);

            var result = await _controller.DeleteApplication(2);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task RejectApplication_ReturnsOk()
        {
            _schoolServiceMock.Setup(s => s.RejectApplicationAsync(5))
                .ReturnsAsync(true);

            var result = await _controller.RejectApplication(5);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task EnrollStudent_ReturnsOk()
        {
            _schoolServiceMock.Setup(s => s.EnrollStudentAsync(10))
                .ReturnsAsync(true);

            var result = await _controller.EnrollStudent(10);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }
    }
}
