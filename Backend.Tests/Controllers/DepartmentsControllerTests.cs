using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SMS.Api.Controllers.AcademicManagement;
using SMS.Api.Dtos;
using SMS.Api.Dtos.AcademicManagement;
using SMS.Api.Services.Interfaces;
using Xunit;

namespace Backend.Tests.Controllers
{
    public class DepartmentsControllerTests
    {
        private readonly Mock<ISchoolService> _schoolServiceMock;
        private readonly DepartmentsController _controller;

        public DepartmentsControllerTests()
        {
            _schoolServiceMock = new Mock<ISchoolService>();
            _controller = new DepartmentsController(_schoolServiceMock.Object);
        }

        [Fact]
        public async Task GetDepartments_ReturnsOkWithList()
        {
            var expectedList = new List<DepartmentDto>
            {
                new DepartmentDto { DepartmentId = 1, DepartmentName = "Science", NumberOfSubjects = 3 }
            };

            _schoolServiceMock.Setup(s => s.GetAllDepartmentsAsync("Science"))
                .ReturnsAsync(expectedList);

            var result = await _controller.GetDepartments("Science");

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetDepartmentById_ReturnsOkWithDto()
        {
            var expectedDto = new DepartmentDto { DepartmentId = 1, DepartmentName = "Science" };
            _schoolServiceMock.Setup(s => s.GetDepartmentByIdAsync("1"))
                .ReturnsAsync(expectedDto);

            var result = await _controller.GetDepartmentById("1");

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetDepartmentsDropdown_ReturnsOkWithList()
        {
            var expectedList = new List<DepartmentDropdownDto>
            {
                new DepartmentDropdownDto { DepartmentId = 1, DepartmentName = "Science", DepartmentCode = "DEPT-SCI" }
            };

            _schoolServiceMock.Setup(s => s.GetActiveDepartmentsDropdownAsync(null))
                .ReturnsAsync(expectedList);

            var result = await _controller.GetDepartmentsDropdown(null);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetSubjectsByDepartment_ReturnsOkWithList()
        {
            var expectedList = new List<SubjectDto>
            {
                new SubjectDto { SubjectId = 1, SubjectName = "Physics", DepartmentId = 1, DepartmentName = "Science" }
            };

            _schoolServiceMock.Setup(s => s.GetSubjectsByDepartmentIdAsync("1"))
                .ReturnsAsync(expectedList);

            var result = await _controller.GetSubjectsByDepartment("1");

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task CreateDepartment_ReturnsOkWithDepartmentDto()
        {
            var dto = new CreateDepartmentDto { DepartmentName = "Science", DepartmentCode = "DEPT-SCI" };
            var expectedResult = new DepartmentDto { DepartmentId = 1, DepartmentName = "Science", DepartmentCode = "DEPT-SCI" };

            _schoolServiceMock.Setup(s => s.CreateDepartmentAsync(dto))
                .ReturnsAsync(expectedResult);

            var result = await _controller.CreateDepartment(dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task UpdateDepartment_ReturnsOkWithDepartmentDto()
        {
            var dto = new CreateDepartmentDto { DepartmentName = "Advanced Science", DepartmentCode = "DEPT-SCI" };
            var expectedResult = new DepartmentDto { DepartmentId = 1, DepartmentName = "Advanced Science", DepartmentCode = "DEPT-SCI" };

            _schoolServiceMock.Setup(s => s.UpdateDepartmentAsync("1", dto))
                .ReturnsAsync(expectedResult);

            var result = await _controller.UpdateDepartment("1", dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task DeleteDepartment_ReturnsOk()
        {
            _schoolServiceMock.Setup(s => s.DeleteDepartmentAsync("1"))
                .ReturnsAsync(true);

            var result = await _controller.DeleteDepartment("1");

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }
    }
}
