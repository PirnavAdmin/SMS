using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Dtos.AcademicManagement;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Implementations;
using Xunit;

namespace Backend.Tests.Services
{
    public class SchoolServiceTests
    {
        private readonly Mock<ISchoolRepository> _repoMock;
        private readonly SMS.Api.Data.AppDbContext _context;
        private readonly SchoolService _service;

        public SchoolServiceTests()
        {
            _repoMock = new Mock<ISchoolRepository>();
            var options = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<SMS.Api.Data.AppDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;
            _context = new SMS.Api.Data.AppDbContext(options);
            _service = new SchoolService(_repoMock.Object, _context);
        }

        // --- LEAVE APPLICATION TESTS ---

        [Fact]
        public async Task SubmitLeaveApplicationAsync_ValidRequest_CreatesApplication()
        {
            var staff = new Staff { StaffId = 10, EmployeeId = "EMP010", FirstName = "John", LastName = "Doe", Designation = "Teacher" };
            var leaveType = new LeaveTypeConfig { LeaveTypeId = 1, Name = "Casual Leave", Code = "CL" };

            _repoMock.Setup(r => r.GetStaffByIdAsync(10)).ReturnsAsync(staff);
            _repoMock.Setup(r => r.GetLeaveTypeByIdAsync(1)).ReturnsAsync(leaveType);

            var dto = new LeaveApplicationCreateDto
            {
                StaffId = 10,
                LeaveTypeId = 1,
                FromDate = "2026-07-28",
                ToDate = "2026-07-29",
                IsHalfDay = false,
                Reason = "Family function"
            };

            var result = await _service.SubmitLeaveApplicationAsync(dto);

            Assert.Equal(10, result.StaffId);
            Assert.Equal("EMP010", result.EmployeeId);
            Assert.Equal("Casual Leave", result.LeaveTypeName);
            Assert.Equal("Pending", result.Status);
            Assert.Equal(2, result.RequestedDays);
        }

        // --- SUBJECT TESTS ---
        [Fact]
        public async Task CreateSubjectAsync_CourseCodeEmpty_UsesSubjectCode()
        {
            var dto = new CreateSubjectDto { SubjectCode = "PHY101", SubjectName = "Physics", CourseCode = "", DepartmentId = 1 };
            var activeDept = new Department { DepartmentId = 1, DepartmentName = "Science", Status = "Active" };

            _repoMock.Setup(r => r.GetDepartmentByIdAsync(1)).ReturnsAsync(activeDept);

            Subject capturedSubject = null!;
            _repoMock.Setup(r => r.AddSubjectAsync(It.IsAny<Subject>()))
                .Callback<Subject>(s => capturedSubject = s)
                .Returns(Task.CompletedTask);

            var result = await _service.CreateSubjectAsync(dto);

            Assert.NotNull(capturedSubject);
            Assert.Equal("PHY101", capturedSubject.CourseCode);
            Assert.Equal("PHY101", result.CourseCode);
            Assert.Equal(1, result.DepartmentId);
        }

        [Fact]
        public async Task DeleteSubjectAsync_NotFound_ThrowsNotFoundException()
        {
            _repoMock.Setup(r => r.GetSubjectByIdAsync(99)).ReturnsAsync((Subject?)null);

            await Assert.ThrowsAsync<NotFoundException>(() => _service.DeleteSubjectAsync(99));
        }

        [Fact]
        public async Task DeleteSubjectAsync_Found_RemovesSubjectAndReturnsTrue()
        {
            var subject = new Subject { SubjectId = 3, SubjectCode = "BIO101", SubjectName = "Biology" };
            _repoMock.Setup(r => r.GetSubjectByIdAsync(3)).ReturnsAsync(subject);

            bool result = await _service.DeleteSubjectAsync(3);

            Assert.True(result);
            _repoMock.Verify(r => r.RemoveSubject(subject), Times.Once);
            _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        // --- ACADEMIC CLASSES TESTS ---
        [Fact]
        public async Task CreateClassGradeAsync_WithSubjectsAndSections_CreatesClass()
        {
            var dto = new CreateClassGradeDto
            {
                ClassName = "Grade 9",
                SubjectIds = new List<int> { 1, 2 },
                Sections = new List<SectionAssignmentDto>
                {
                    new SectionAssignmentDto { SectionName = "A", ClassTeacherEmpId = 10 }
                }
            };

            ClassGrade capturedClass = null!;
            _repoMock.Setup(r => r.AddClassGradeAsync(It.IsAny<ClassGrade>()))
                .Callback<ClassGrade>(c => capturedClass = c)
                .Returns(Task.CompletedTask);

            bool result = await _service.CreateClassGradeAsync(dto);

            Assert.True(result);
            Assert.NotNull(capturedClass);
            Assert.Equal("Grade 9", capturedClass.ClassName);
            Assert.Equal(2, capturedClass.SubjectMappings.Count);
            Assert.Single(capturedClass.Sections);
        }

        // --- ADMISSIONS TESTS WITH EXTENDED FIELDS ---
        [Fact]
        public async Task SubmitApplicationAsync_WithExtendedFields_MapsAllFieldsAndSaves()
        {
            var dto = new SubmitAdmissionDto
            {
                FirstName = "Alex",
                LastName = "Smith",
                AppliedClassId = 1,
                Gender = "Male",
                FatherName = "John Smith",
                MotherName = "Mary Smith",
                FatherContact = "9876543210",
                Religion = "General",
                City = "New York",
                TransportRequired = true,
                TransportType = "AC Bus",
                HostelBlock = "Block A"
            };

            AdmissionApplication capturedApp = null!;
            _repoMock.Setup(r => r.AddApplicationAsync(It.IsAny<AdmissionApplication>()))
                .Callback<AdmissionApplication>(a => capturedApp = a)
                .Returns(Task.CompletedTask);

            var result = await _service.SubmitApplicationAsync(dto);

            Assert.NotNull(capturedApp);
            Assert.Equal("Alex", capturedApp.FirstName);
            Assert.Equal("Smith", capturedApp.LastName);
            Assert.Equal("Mary Smith", capturedApp.MotherName);
            Assert.Equal("New York", capturedApp.City);
            Assert.True(capturedApp.TransportRequired);
            Assert.Equal("AC Bus", capturedApp.TransportType);

            Assert.Equal("Mary Smith", result.MotherName);
            Assert.Equal("New York", result.City);
            Assert.True(result.TransportRequired);
        }

        [Fact]
        public async Task EnrollStudentAsync_NotFound_ThrowsNotFoundException()
        {
            _repoMock.Setup(r => r.GetApplicationByIdAsync(99)).ReturnsAsync((AdmissionApplication?)null);

            await Assert.ThrowsAsync<NotFoundException>(() => _service.EnrollStudentAsync(99));
        }

        [Fact]
        public async Task EnrollStudentAsync_AlreadyEnrolled_ThrowsBadRequestException()
        {
            var app = new AdmissionApplication { Id = 1, Status = "Enrolled" };
            _repoMock.Setup(r => r.GetApplicationByIdAsync(1)).ReturnsAsync(app);

            await Assert.ThrowsAsync<BadRequestException>(() => _service.EnrollStudentAsync(1));
        }

        [Fact]
        public async Task EnrollStudentAsync_PendingApp_UpdatesStatusToEnrolled()
        {
            var app = new AdmissionApplication { Id = 1, Status = "Pending" };
            _repoMock.Setup(r => r.GetApplicationByIdAsync(1)).ReturnsAsync(app);

            bool result = await _service.EnrollStudentAsync(1);

            Assert.True(result);
            Assert.Equal("Enrolled", app.Status);
            _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task RejectApplicationAsync_PendingApp_UpdatesStatusToRejected()
        {
            var app = new AdmissionApplication { Id = 2, Status = "Pending" };
            _repoMock.Setup(r => r.GetApplicationByIdAsync(2)).ReturnsAsync(app);

            bool result = await _service.RejectApplicationAsync(2);

            Assert.True(result);
            Assert.Equal("Rejected", app.Status);
            _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }
    }
}
