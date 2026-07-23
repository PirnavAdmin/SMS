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
    public class SubjectsControllerTests
    {
        private readonly Mock<ISchoolService> _schoolServiceMock;
        private readonly SubjectsController _controller;

        public SubjectsControllerTests()
        {
            _schoolServiceMock = new Mock<ISchoolService>();
            _controller = new SubjectsController(_schoolServiceMock.Object);
        }

        [Fact]
        public async Task GetSubjects_ReturnsOkWithList()
        {
            var expectedList = new List<SubjectDto>
            {
                new SubjectDto { SubjectId = 1, SubjectName = "Math" }
            };

            _schoolServiceMock.Setup(s => s.GetAllSubjectsAsync("Math"))
                .ReturnsAsync(expectedList);

            var result = await _controller.GetSubjects("Math");

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetSubjectById_ReturnsOkWithDto()
        {
            var expectedDto = new SubjectDto { SubjectId = 1, SubjectName = "Math" };
            _schoolServiceMock.Setup(s => s.GetSubjectByIdAsync(1))
                .ReturnsAsync(expectedDto);

            var result = await _controller.GetSubjectById(1);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetSubjectsDropdown_ReturnsOkWithDropdownList()
        {
            var expectedList = new List<SubjectDropdownDto>
            {
                new SubjectDropdownDto { SubjectId = 1, SubjectCode = "MATH101", SubjectName = "Math" }
            };

            _schoolServiceMock.Setup(s => s.GetSubjectsDropdownAsync("Math"))
                .ReturnsAsync(expectedList);

            var result = await _controller.GetSubjectsDropdown("Math");

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task CreateSubject_ReturnsOkWithSubjectDto()
        {
            var dto = new CreateSubjectDto { SubjectCode = "ENG", SubjectName = "English" };
            var expectedResult = new SubjectDto { SubjectId = 2, SubjectCode = "ENG", SubjectName = "English" };

            _schoolServiceMock.Setup(s => s.CreateSubjectAsync(dto))
                .ReturnsAsync(expectedResult);

            var result = await _controller.CreateSubject(dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task UpdateSubject_ReturnsOkWithSubjectDto()
        {
            var dto = new CreateSubjectDto { SubjectCode = "ENG", SubjectName = "Advanced English" };
            var expectedResult = new SubjectDto { SubjectId = 2, SubjectCode = "ENG", SubjectName = "Advanced English" };

            _schoolServiceMock.Setup(s => s.UpdateSubjectAsync(2, dto))
                .ReturnsAsync(expectedResult);

            var result = await _controller.UpdateSubject(2, dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task DeleteSubject_ReturnsOk()
        {
            _schoolServiceMock.Setup(s => s.DeleteSubjectAsync(2))
                .ReturnsAsync(true);

            var result = await _controller.DeleteSubject(2);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }
    }
}
