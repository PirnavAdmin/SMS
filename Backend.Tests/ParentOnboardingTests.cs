using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Xunit.Abstractions;
using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SMS.Api.Models;
using SMS.Api.Dtos;
using SMS.Api.Services.Implementations;

namespace Backend.Tests
{
    public class ParentOnboardingTests
    {
        private readonly ITestOutputHelper _output;

        public ParentOnboardingTests(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void BCrypt_HashAndVerify_EmailPassword_Succeeds()
        {
            string email19 = "veerashankargarikapati@gmail.com";
            string hash19 = BCrypt.Net.BCrypt.HashPassword(email19);

            string email57 = "veerashankargarikapati007@gmail.com";
            string hash57 = BCrypt.Net.BCrypt.HashPassword(email57);

            Assert.True(BCrypt.Net.BCrypt.Verify(email19, hash19));
            Assert.True(BCrypt.Net.BCrypt.Verify(email57, hash57));
        }

        [Fact]
        public void ParentStudentMapping_ModelProperties_AreValid()
        {
            var mapping = new ParentStudentMapping
            {
                ParentUserId = 19,
                StudentId = 1,
                RelationshipType = "Father",
                IsPrimaryContact = true,
                Status = "Active",
                OnboardingStatus = "Account Ready"
            };

            Assert.Equal(19, mapping.ParentUserId);
            Assert.Equal(1, mapping.StudentId);
            Assert.Equal("Father", mapping.RelationshipType);
            Assert.Equal("Account Ready", mapping.OnboardingStatus);
        }

        [Fact]
        public async Task Test_SendParentWelcomeEmailWithResult_EmptyEmail_ReturnsFailureWithoutException()
        {
            var inMemorySettings = new Dictionary<string, string?> {
                {"Smtp:Host", "smtp.gmail.com"},
                {"Smtp:Port", "587"},
                {"Smtp:Email", "pirnavsms@gmail.com"},
                {"Smtp:Password", "somepassword"}
            };

            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            var service = new EmailNotificationService(configuration, NullLogger<EmailNotificationService>.Instance);
            var result = await service.SendParentWelcomeEmailWithResultAsync(
                parentEmail: "",
                parentName: "Parent",
                studentName: "Student",
                admissionNo: "ADM001",
                loginEmail: "",
                initialPassword: "",
                isNewAccount: true
            );

            Assert.False(result.Success);
            Assert.NotNull(result.ErrorMessage);
            Assert.Contains("Invalid or empty email", result.ErrorMessage);
        }

        [Fact]
        public async Task Test_SendParentWelcomeEmailWithResult_MissingSmtpPassword_ReturnsFailureGracefully()
        {
            var inMemorySettings = new Dictionary<string, string?> {
                {"Smtp:Host", "smtp.gmail.com"},
                {"Smtp:Port", "587"},
                {"Smtp:Email", "pirnavsms@gmail.com"},
                {"Smtp:Password", ""}
            };

            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            var service = new EmailNotificationService(configuration, NullLogger<EmailNotificationService>.Instance);
            var result = await service.SendParentWelcomeEmailWithResultAsync(
                parentEmail: "testparent@example.com",
                parentName: "Parent",
                studentName: "Student",
                admissionNo: "ADM001",
                loginEmail: "testparent@example.com",
                initialPassword: "testparent@example.com",
                isNewAccount: true
            );

            Assert.False(result.Success);
            Assert.NotNull(result.ErrorMessage);
            Assert.Contains("SMTP Password not configured", result.ErrorMessage);
        }

        [Fact]
        public void AdmissionApplicationResponseDto_ParentEmailProperties_MapCorrectly()
        {
            var dto = new AdmissionApplicationResponseDto
            {
                Id = 1,
                RegistrationNo = "REG-001",
                ParentEmailStatus = "Email Sent",
                ParentEmailFailureReason = null,
                WelcomeEmailSentAt = DateTime.UtcNow,
                HasParentAccount = true
            };

            Assert.Equal("Email Sent", dto.ParentEmailStatus);
            Assert.True(dto.HasParentAccount);
            Assert.NotNull(dto.WelcomeEmailSentAt);
            Assert.Null(dto.ParentEmailFailureReason);
        }
    }
}
