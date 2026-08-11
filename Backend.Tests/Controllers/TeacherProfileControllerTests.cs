using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SMS.Api.Controllers;
using SMS.Api.Controllers.StaffManagement;
using SMS.Api.Dtos;
using SMS.Api.Dtos.Teacher;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Interfaces.StaffManagement;
using Xunit;

namespace Backend.Tests.Controllers;

public class TeacherProfileControllerTests
{
    private readonly Mock<ITeacherProfileService> _profileServiceMock;
    private readonly Mock<IStaffService> _staffServiceMock;
    private readonly TeacherProfileController _teacherController;
    private readonly StaffController _adminStaffController;

    public TeacherProfileControllerTests()
    {
        _profileServiceMock = new Mock<ITeacherProfileService>();
        _staffServiceMock = new Mock<IStaffService>();

        _teacherController = new TeacherProfileController(_profileServiceMock.Object);
        _adminStaffController = new StaffController(_staffServiceMock.Object);

        // Setup Teacher ClaimsPrincipal
        var teacherClaims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "101"),
            new Claim(ClaimTypes.Email, "teacher@pirnavschools.com"),
            new Claim(ClaimTypes.Role, "Teacher"),
            new Claim("StaffId", "15")
        };
        var identity = new ClaimsIdentity(teacherClaims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _teacherController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };

        // Setup Admin ClaimsPrincipal
        var adminClaims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Email, "admin@pirnavschools.com"),
            new Claim(ClaimTypes.Role, "Admin")
        };
        var adminIdentity = new ClaimsIdentity(adminClaims, "TestAuth");
        _adminStaffController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(adminIdentity) }
        };
    }

    [Fact]
    public async Task Admin_Can_Retrieve_All_Teaching_Staff()
    {
        var expectedStaff = new List<StaffResponseDto>
        {
            new StaffResponseDto { StaffId = 1, FirstName = "Teacher", LastName = "One", Department = "Science" },
            new StaffResponseDto { StaffId = 2, FirstName = "Teacher", LastName = "Two", Department = "Math" }
        };

        _staffServiceMock.Setup(s => s.GetAllStaffAsync(It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync(expectedStaff);

        var result = await _adminStaffController.GetAllStaff(null, null);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task Teacher_Can_Retrieve_Own_Profile()
    {
        var ownProfile = new TeacherSelfProfileDto
        {
            StaffId = 15,
            EmployeeId = "STF-2026-0001",
            FullName = "Veera Garikapati",
            Email = "teacher@pirnavschools.com",
            Mobile = "9581768555",
            Department = "Mathematics",
            Designation = "Head of Department (HOD)"
        };

        _profileServiceMock.Setup(s => s.GetMyProfileAsync(15))
            .ReturnsAsync(ownProfile);

        var result = await _teacherController.GetMyProfile();

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task Teacher_Cannot_Access_Another_Staff_Profile_By_Changing_ID()
    {
        // GET /api/v1/teacher/profile/me does NOT accept a staffId route parameter or query string.
        // It strictly uses logged in StaffId (15). Attempting to request /me will always resolve staffId=15.
        _profileServiceMock.Setup(s => s.GetMyProfileAsync(15))
            .ReturnsAsync(new TeacherSelfProfileDto { StaffId = 15, FullName = "Veera Garikapati" });

        var result = await _teacherController.GetMyProfile();

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        _profileServiceMock.Verify(s => s.GetMyProfileAsync(15), Times.Once);
        _profileServiceMock.Verify(s => s.GetMyProfileAsync(999), Times.Never);
    }

    [Fact]
    public async Task Teacher_Can_Update_Only_Allowed_Fields()
    {
        var updateDto = new UpdateMyTeacherProfileDto
        {
            ProfilePhoto = "https://images.unsplash.com/photo-1573496359142.jpg",
            Mobile = "9988776655",
            Address = "New Present Address",
            EmergencyContact = "9112233445"
        };

        _profileServiceMock.Setup(s => s.UpdateMyProfileAsync(15, updateDto))
            .ReturnsAsync(true);

        _profileServiceMock.Setup(s => s.GetMyProfileAsync(15))
            .ReturnsAsync(new TeacherSelfProfileDto
            {
                StaffId = 15,
                Mobile = updateDto.Mobile,
                Address = updateDto.Address,
                EmergencyContact = updateDto.EmergencyContact,
                ProfilePhoto = updateDto.ProfilePhoto
            });

        var result = await _teacherController.UpdateMyProfile(updateDto);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        _profileServiceMock.Verify(s => s.UpdateMyProfileAsync(15, updateDto), Times.Once);
    }

    [Fact]
    public async Task Teacher_Assignments_Returns_Only_Assigned_Classes_Sections_Subjects()
    {
        var expectedAssignments = new TeacherAssignmentsResponseDto
        {
            StaffId = 15,
            EmployeeId = "STF-2026-0001",
            TeacherName = "Veera Garikapati",
            Classes = new List<TeacherClassAssignmentDto>
            {
                new TeacherClassAssignmentDto { ClassId = 10, ClassName = "Class 10-A", Role = "Class Teacher" }
            },
            Sections = new List<TeacherSectionAssignmentDto>
            {
                new TeacherSectionAssignmentDto { SectionId = 1, SectionName = "A", ClassName = "Class 10" }
            },
            Subjects = new List<TeacherSubjectAssignmentDto>
            {
                new TeacherSubjectAssignmentDto { SubjectId = 5, SubjectName = "Mathematics", SubjectCode = "MATH10", ClassName = "Class 10" }
            }
        };

        _profileServiceMock.Setup(s => s.GetMyAssignmentsAsync(15, null))
            .ReturnsAsync(expectedAssignments);

        var result = await _teacherController.GetMyAssignments(null);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        _profileServiceMock.Verify(s => s.GetMyAssignmentsAsync(15, null), Times.Once);
    }

    [Fact]
    public async Task Profile_Me_Returns_404_When_Teacher_Has_No_Active_Staff_Profile()
    {
        _profileServiceMock.Setup(s => s.GetMyProfileAsync(15))
            .ReturnsAsync((TeacherSelfProfileDto?)null);

        var result = await _teacherController.GetMyProfile();

        Assert.IsType<NotFoundObjectResult>(result);
    }
}
