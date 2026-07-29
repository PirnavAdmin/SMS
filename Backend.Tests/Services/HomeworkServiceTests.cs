using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using Xunit;

namespace Backend.Tests.Services
{
    public class HomeworkServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task Homework_CreateAndRetrieve_ReturnsCorrectData()
        {
            var context = GetInMemoryDbContext();
            var hw = new Homework
            {
                ClassName = "Class 10-A",
                SubjectName = "Mathematics",
                Title = "Quadratic Equations Problem Set",
                Description = "Complete Problems 1 to 25",
                DueDate = new DateTime(2026, 07, 22),
                TeacherName = "Jonathan Miller"
            };

            await context.Homeworks.AddAsync(hw);
            await context.SaveChangesAsync();

            var count = await context.Homeworks.CountAsync();
            Assert.Equal(1, count);
            var saved = await context.Homeworks.FirstAsync();
            Assert.Equal("Quadratic Equations Problem Set", saved.Title);
        }
    }
}
