using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Dtos.Auth;
using SMS.Api.Dtos.Otp;
using SMS.Api.Models;
using Xunit;

namespace Backend.Tests.Data
{
    public class DbContextAndModelTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task AppDbContext_SeedingAndRelationships_WorkAsExpected()
        {
            using var db = GetInMemoryDbContext();

            var role = new Role { RoleId = 1, RoleName = "Admin", Description = "Administrator" };
            var user = new User
            {
                FullName = "Admin User",
                Email = "admin@school.com",
                MobileNumber = "1234567890",
                PasswordHash = "hash"
            };

            user.Roles.Add(role);
            db.Users.Add(user);

            var classGrade = new ClassGrade { ClassName = "Class 1" };
            var subject = new Subject { SubjectCode = "SUB1", SubjectName = "Subject 1" };
            db.Classes.Add(classGrade);
            db.Subjects.Add(subject);
            await db.SaveChangesAsync();

            var ccs = new ClassCurriculumSubject
            {
                ClassId = classGrade.ClassId,
                SubjectId = subject.SubjectId
            };
            db.ClassCurriculumSubjects.Add(ccs);

            var staff = new Staff
            {
                EmployeeId = "T01",
                FirstName = "Teacher",
                LastName = "One"
            };
            db.Staff.Add(staff);
            await db.SaveChangesAsync();

            var section = new ClassSection
            {
                ClassId = classGrade.ClassId,
                SectionName = "A",
                ClassTeacherEmpId = staff.StaffId
            };
            db.ClassSections.Add(section);
            await db.SaveChangesAsync();

            var fetchedUser = await db.Users.Include(u => u.Roles).FirstOrDefaultAsync(u => u.UserId == user.UserId);
            Assert.NotNull(fetchedUser);
            Assert.Single(fetchedUser!.Roles);

            var fetchedSection = await db.ClassSections.Include(cs => cs.ClassTeacher).FirstOrDefaultAsync(cs => cs.SectionId == section.SectionId);
            Assert.NotNull(fetchedSection);
            Assert.Equal("Teacher", fetchedSection!.ClassTeacher!.FirstName);
        }

        [Fact]
        public void DtosAndModels_InstantiationAndPropertySetters_WorkCorrectly()
        {
            var branch = new Branch { BranchId = 1, BranchName = "North Campus" };
            Assert.Equal(1, branch.BranchId);
            Assert.Equal("North Campus", branch.BranchName);

            var authResponse = new AuthResponseDto(10, "Test Name", "token123", new List<string> { "Admin" });
            Assert.Equal(10, authResponse.UserId);
            Assert.Equal("Test Name", authResponse.FullName);
            Assert.Equal("token123", authResponse.Token);

            var loginRequest = new LoginRequestDto("user@test.com", "pass");
            Assert.Equal("user@test.com", loginRequest.EmailOrPhone);
            Assert.Equal("pass", loginRequest.Password);

            var verifyOtpRequest = new VerifyOtpRequestDto("user@test.com", "123456");
            Assert.Equal("user@test.com", verifyOtpRequest.EmailOrPhone);
            Assert.Equal("123456", verifyOtpRequest.OtpCode);

            var resetPassword = new ResetPasswordDto
            {
                EmailOrPhone = "user@test.com",
                OldPassword = "old",
                NewPassword = "new",
                OtpCode = "654321"
            };
            Assert.Equal("user@test.com", resetPassword.EmailOrPhone);
            Assert.Equal("old", resetPassword.OldPassword);
            Assert.Equal("new", resetPassword.NewPassword);
            Assert.Equal("654321", resetPassword.OtpCode);

            var submitAdmission = new SubmitAdmissionDto
            {
                FirstName = "Student",
                LastName = "A",
                MotherName = "Mother A",
                City = "City A",
                TransportRequired = true,
                HostelBlock = "Block B"
            };
            Assert.Equal("Student", submitAdmission.FirstName);
            Assert.Equal("A", submitAdmission.LastName);
            Assert.Equal("Mother A", submitAdmission.MotherName);
            Assert.Equal("City A", submitAdmission.City);
            Assert.True(submitAdmission.TransportRequired);
            Assert.Equal("Block B", submitAdmission.HostelBlock);
        }
    }
}
