using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Implementations;
using Xunit;

namespace Backend.Tests.Repositories
{
    public class OtpRepositoryTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task SaveOtpAsync_InvalidatesPreviousOtpsAndSavesNewOtp()
        {
            using var db = GetInMemoryDbContext();
            var repo = new OtpRepository(db);

            var oldOtp = new OtpVerification
            {
                UserId = 1,
                OtpCodeHash = "oldHash",
                Purpose = "General",
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false
            };
            db.OtpVerifications.Add(oldOtp);
            await db.SaveChangesAsync();

            var newOtp = new OtpVerification
            {
                UserId = 1,
                OtpCodeHash = "newHash",
                Purpose = "General",
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false
            };

            await repo.SaveOtpAsync(newOtp);

            Assert.True(oldOtp.IsUsed);

            var activeOtp = await repo.GetLatestActiveOtpAsync(1, "General");
            Assert.NotNull(activeOtp);
            Assert.Equal("newHash", activeOtp!.OtpCodeHash);
        }

        [Fact]
        public async Task ValidateOtpAsync_ExpiredOtp_ReturnsFalseAndMarksUsed()
        {
            using var db = GetInMemoryDbContext();
            var repo = new OtpRepository(db);

            var expiredOtp = new OtpVerification
            {
                UserId = 2,
                OtpCodeHash = "hash123",
                Purpose = "General",
                ExpiryTime = DateTime.UtcNow.AddMinutes(-5),
                IsUsed = false,
                CreatedAt = DateTime.UtcNow.AddMinutes(-10)
            };
            db.OtpVerifications.Add(expiredOtp);
            await db.SaveChangesAsync();

            bool result = await repo.ValidateOtpAsync(2, "hash123", "General");

            Assert.False(result);
            Assert.True(expiredOtp.IsUsed);
        }

        [Fact]
        public async Task ValidateOtpAsync_ExceededAttempts_ReturnsFalseAndMarksUsed()
        {
            using var db = GetInMemoryDbContext();
            var repo = new OtpRepository(db);

            var otp = new OtpVerification
            {
                UserId = 3,
                OtpCodeHash = "hash123",
                Purpose = "General",
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                AttemptCount = 3,
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };
            db.OtpVerifications.Add(otp);
            await db.SaveChangesAsync();

            bool result = await repo.ValidateOtpAsync(3, "hash123", "General");

            Assert.False(result);
            Assert.True(otp.IsUsed);
        }

        [Fact]
        public async Task ValidateOtpAsync_WrongCodeHash_IncrementsAttemptCountAndReturnsFalse()
        {
            using var db = GetInMemoryDbContext();
            var repo = new OtpRepository(db);

            var otp = new OtpVerification
            {
                UserId = 4,
                OtpCodeHash = "correctHash",
                Purpose = "General",
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                AttemptCount = 0,
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };
            db.OtpVerifications.Add(otp);
            await db.SaveChangesAsync();

            bool result = await repo.ValidateOtpAsync(4, "wrongHash", "General");

            Assert.False(result);
            Assert.Equal(1, otp.AttemptCount);
            Assert.False(otp.IsUsed);
        }

        [Fact]
        public async Task ValidateOtpAsync_ValidOtp_ReturnsTrueAndMarksUsed()
        {
            using var db = GetInMemoryDbContext();
            var repo = new OtpRepository(db);

            var otp = new OtpVerification
            {
                UserId = 5,
                OtpCodeHash = "correctHash",
                Purpose = "General",
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                AttemptCount = 0,
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };
            db.OtpVerifications.Add(otp);
            await db.SaveChangesAsync();

            bool result = await repo.ValidateOtpAsync(5, "correctHash", "General");

            Assert.True(result);
            Assert.Equal(1, otp.AttemptCount);
            Assert.True(otp.IsUsed);
        }
    }
}
