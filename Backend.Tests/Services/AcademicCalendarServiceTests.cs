using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using Xunit;

namespace Backend.Tests.Services
{
    public class AcademicCalendarServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task AcademicCalendar_CreateSchoolEvent_ReturnsPublishedEvent()
        {
            var context = GetInMemoryDbContext();
            var ev = new SchoolEvent
            {
                Title = "Annual Sports Day & Athletic Meet 2026",
                Category = "Sports Day",
                Venue = "Main Campus Stadium Ground",
                StartDate = new DateTime(2026, 08, 15),
                EndDate = new DateTime(2026, 08, 15),
                Status = "Published"
            };

            await context.SchoolEvents.AddAsync(ev);
            await context.SaveChangesAsync();

            var saved = await context.SchoolEvents.FirstAsync();
            Assert.Equal("Sports Day", saved.Category);
            Assert.Equal("Published", saved.Status);
        }
    }
}
