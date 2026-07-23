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
    public class ClassesControllerTests
    {
        private readonly Mock<ISchoolService> _schoolServiceMock;
        private readonly ClassesController _controller;

        public ClassesControllerTests()
        {
            _schoolServiceMock = new Mock<ISchoolService>();
            _controller = new ClassesController(_schoolServiceMock.Object);
        }

        [Fact]
        public async Task GetClasses_ReturnsOkWithList()
        {
            var expectedList = new List<ClassGradeResponseDto>
            {
                new ClassGradeResponseDto { ClassId = 1, ClassName = "Grade 10" }
            };

            _schoolServiceMock.Setup(s => s.GetAllClassesAsync())
                .ReturnsAsync(expectedList);

            var result = await _controller.GetClasses();

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetClassById_ReturnsOkWithDto()
        {
            var expectedDto = new ClassGradeResponseDto { ClassId = 1, ClassName = "Grade 10" };
            _schoolServiceMock.Setup(s => s.GetClassByIdAsync(1))
                .ReturnsAsync(expectedDto);

            var result = await _controller.GetClassById(1);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task CreateClassGrade_ReturnsOk()
        {
            var dto = new CreateClassGradeDto { ClassName = "Grade 11" };

            _schoolServiceMock.Setup(s => s.CreateClassGradeAsync(dto))
                .ReturnsAsync(true);

            var result = await _controller.CreateClassGrade(dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task UpdateClassGrade_ReturnsOk()
        {
            var dto = new CreateClassGradeDto { ClassName = "Grade 11 Updated" };

            _schoolServiceMock.Setup(s => s.UpdateClassGradeAsync(1, dto))
                .ReturnsAsync(true);

            var result = await _controller.UpdateClassGrade(1, dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task DeleteClassGrade_ReturnsOk()
        {
            _schoolServiceMock.Setup(s => s.DeleteClassGradeAsync(1))
                .ReturnsAsync(true);

            var result = await _controller.DeleteClassGrade(1);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }
    }
}
