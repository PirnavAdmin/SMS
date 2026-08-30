using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Implementations.StaffManagement;
using Xunit;

namespace Backend.Tests.Services
{
    public class StaffServiceTests
    {
        private readonly Mock<ISchoolRepository> _repoMock;
        private readonly Mock<SMS.Api.Services.Interfaces.IEmailNotificationService> _emailMock;
        private readonly SMS.Api.Data.AppDbContext _context;
        private readonly StaffService _service;

        public StaffServiceTests()
        {
            _repoMock = new Mock<ISchoolRepository>();
            _emailMock = new Mock<SMS.Api.Services.Interfaces.IEmailNotificationService>();
            var options = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<SMS.Api.Data.AppDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;
            _context = new SMS.Api.Data.AppDbContext(options);
            _service = new StaffService(_repoMock.Object, _context, _emailMock.Object);
        }

        [Fact]
        public async Task GetAllStaffAsync_ReturnsMappedResponseDtos()
        {
            var staffList = new List<Staff>
            {
                new Staff
                {
                    StaffId = 1,
                    EmployeeId = "EMP101",
                    FirstName = "John",
                    LastName = "Doe",
                    Email = "john@school.com",
                    Phone = "1234567890",
                    Designation = "Teacher",
                    Department = "Science",
                    MonthlySalary = 50000,
                    IsActive = true
                }
            };

            _repoMock.Setup(r => r.GetAllStaffAsync(null, null)).ReturnsAsync(staffList);

            var result = await _service.GetAllStaffAsync(null, null);

            Assert.Single(result);
            Assert.Equal("EMP101", result[0].EmployeeId);
            Assert.Equal("John", result[0].FirstName);
        }

        [Fact]
        public async Task GetNextEmployeeIdAsync_NoExistingStaff_ReturnsEMP001()
        {
            _repoMock.Setup(r => r.GetAllEmployeeIdsAsync()).ReturnsAsync(new List<string>());

            var nextId = await _service.GetNextEmployeeIdAsync();

            Assert.Equal("EMP001", nextId);
        }

        [Fact]
        public async Task GetNextEmployeeIdAsync_ExistingEMP006_ReturnsEMP007()
        {
            var existingIds = new List<string> { "EMP001", "EMP002", "EMP003", "EMP004", "EMP005", "EMP006" };
            _repoMock.Setup(r => r.GetAllEmployeeIdsAsync()).ReturnsAsync(existingIds);

            var nextId = await _service.GetNextEmployeeIdAsync();

            Assert.Equal("EMP007", nextId);
        }

        [Fact]
        public async Task CreateStaffAsync_AutoGeneratesSequentialEmployeeId()
        {
            var existingIds = new List<string> { "EMP001", "EMP006" };
            _repoMock.Setup(r => r.GetAllEmployeeIdsAsync()).ReturnsAsync(existingIds);

            var dto = new StaffCreateDto
            {
                FirstName = "Test",
                LastName = "Employee",
                Email = "test.emp@school.com",
                Designation = "Teacher",
                Department = "Mathematics",
                MonthlySalary = 50000
            };

            var result = await _service.CreateStaffAsync(dto);

            Assert.Equal("EMP007", result.EmployeeId);
            _repoMock.Verify(r => r.AddStaffAsync(It.Is<Staff>(s => s.EmployeeId == "EMP007")), Times.Once);
        }
    }
}
