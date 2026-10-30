using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Xunit.Abstractions;
using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SMS.Api.Models;
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
        public async Task Test_EmailNotificationService_Sending()
        {
            var inMemorySettings = new Dictionary<string, string?> {
                {"Smtp:Host", "smtp.gmail.com"},
                {"Smtp:Port", "587"},
                {"Smtp:Email", "pirnavsms@gmail.com"},
                {"Smtp:Password", "rsrmigklndqmliti"},
                {"AppUrl", "http://localhost:5173"}
            };

            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            var service = new EmailNotificationService(configuration, NullLogger<EmailNotificationService>.Instance);
            
            var result = await service.SendParentWelcomeEmailAsync(
                parentEmail: "pirnavsms@gmail.com",
                parentName: "Test Parent",
                studentName: "Test Student",
                admissionNo: "ADM-TEST-001",
                loginEmail: "pirnavsms@gmail.com",
                initialPassword: "pirnavsms@gmail.com",
                isNewAccount: true,
                portalUrl: "http://localhost:5173/login",
                schoolName: "Pirnav School"
            );
            _output.WriteLine($"Send result: {result}");
            Assert.True(result, "Email sending returned false!");
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
    }
}
