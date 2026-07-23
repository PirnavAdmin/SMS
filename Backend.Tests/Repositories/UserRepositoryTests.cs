using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Implementations;
using Xunit;

namespace Backend.Tests.Repositories
{
    public class UserRepositoryTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task AddAsync_And_GetByIdentifierAsync_ReturnsUser()
        {
            using var db = GetInMemoryDbContext();
            var repo = new UserRepository(db);

            var user = new User
            {
                FullName = "John Doe",
                Email = "john@example.com",
                MobileNumber = "1234567890",
                PasswordHash = "hash123"
            };

            await repo.AddAsync(user);
            await repo.SaveChangesAsync();

            var resultByEmail = await repo.GetByIdentifierAsync("john@example.com");
            var resultByPhone = await repo.GetByIdentifierAsync("1234567890");

            Assert.NotNull(resultByEmail);
            Assert.Equal("John Doe", resultByEmail!.FullName);
            Assert.NotNull(resultByPhone);
            Assert.Equal("John Doe", resultByPhone!.FullName);
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsCorrectUser()
        {
            using var db = GetInMemoryDbContext();
            var repo = new UserRepository(db);

            var user = new User
            {
                FullName = "Jane Doe",
                Email = "jane@example.com",
                MobileNumber = "0987654321",
                PasswordHash = "hash456"
            };

            await repo.AddAsync(user);
            await repo.SaveChangesAsync();

            var result = await repo.GetByIdAsync(user.UserId);
            Assert.NotNull(result);
            Assert.Equal("Jane Doe", result!.FullName);
        }

        [Fact]
        public async Task ExistsAsync_ReturnsTrueIfMatch()
        {
            using var db = GetInMemoryDbContext();
            var repo = new UserRepository(db);

            var user = new User
            {
                FullName = "Test User",
                Email = "test@example.com",
                MobileNumber = "5555555555",
                PasswordHash = "hash"
            };

            await repo.AddAsync(user);
            await repo.SaveChangesAsync();

            Assert.True(await repo.ExistsAsync("5555555555", "other@example.com"));
            Assert.True(await repo.ExistsAsync("9999999999", "test@example.com"));
            Assert.False(await repo.ExistsAsync("9999999999", "other@example.com"));
        }

        [Fact]
        public async Task RegisterUserProcedureAsync_ValidRole_CreatesUserWithRole()
        {
            using var db = GetInMemoryDbContext();
            var role = new Role { RoleId = 1, RoleName = "Admin", Description = "System Admin" };
            db.Roles.Add(role);
            await db.SaveChangesAsync();

            var repo = new UserRepository(db);

            await repo.RegisterUserProcedureAsync("Proc User", "proc@example.com", "1112223333", "hash", 1);

            var createdUser = await repo.GetByIdentifierAsync("proc@example.com");
            Assert.NotNull(createdUser);
            Assert.Equal("Proc User", createdUser!.FullName);
            Assert.Contains(createdUser.Roles, r => r.RoleName == "Admin");
        }

        [Fact]
        public async Task RegisterUserProcedureAsync_InvalidRole_ThrowsInvalidOperationException()
        {
            using var db = GetInMemoryDbContext();
            var repo = new UserRepository(db);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                repo.RegisterUserProcedureAsync("Invalid Role User", "inv@example.com", "9998887777", "hash", 999));
        }

        [Fact]
        public async Task UpdatePasswordAsync_UpdatesUserPasswordHash()
        {
            using var db = GetInMemoryDbContext();
            var repo = new UserRepository(db);

            var user = new User
            {
                FullName = "Pwd User",
                Email = "pwd@example.com",
                MobileNumber = "4443332222",
                PasswordHash = "oldHash"
            };

            await repo.AddAsync(user);
            await repo.SaveChangesAsync();

            await repo.UpdatePasswordAsync(user.UserId, "newHash");

            var updatedUser = await repo.GetByIdAsync(user.UserId);
            Assert.NotNull(updatedUser);
            Assert.Equal("newHash", updatedUser!.PasswordHash);
        }

        [Fact]
        public async Task GetRoleByIdAsync_ReturnsRole()
        {
            using var db = GetInMemoryDbContext();
            var role = new Role { RoleId = 5, RoleName = "Teacher", Description = "Teacher Role" };
            db.Roles.Add(role);
            await db.SaveChangesAsync();

            var repo = new UserRepository(db);
            var fetchedRole = await repo.GetRoleByIdAsync(5);

            Assert.NotNull(fetchedRole);
            Assert.Equal("Teacher", fetchedRole!.RoleName);
        }
    }
}
