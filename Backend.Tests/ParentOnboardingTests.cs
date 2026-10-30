using System;
using System.Threading.Tasks;
using Xunit;
using BCrypt.Net;
using SMS.Api.Models;

namespace Backend.Tests
{
    public class ParentOnboardingTests
    {
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
