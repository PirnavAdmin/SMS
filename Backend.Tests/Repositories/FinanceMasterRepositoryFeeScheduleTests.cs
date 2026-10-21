using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Implementations.FinanceManagement;
using Xunit;

namespace Backend.Tests.Repositories
{
    public class FinanceMasterRepositoryFeeScheduleTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetFeeScheduleAsync_GeneratesDefaultTermsWhenNoneSaved()
        {
            using var db = GetInMemoryDbContext();
            var ay = new AcademicYear
            {
                AcademicYearName = "2026-2027",
                StartDate = new DateTime(2026, 6, 1),
                EndDate = new DateTime(2027, 5, 31),
                IsActive = true
            };
            db.AcademicYears.Add(ay);
            await db.SaveChangesAsync();

            var repo = new FinanceMasterRepository(db);
            var result = await repo.GetFeeScheduleAsync("2026-2027");

            Assert.NotNull(result);
            Assert.Equal("2026-2027", result.AcademicYear);
            Assert.NotEmpty(result.Terms);
            Assert.Equal(4, result.NumberOfTerms);
            Assert.Equal(4, result.Terms.Count);
        }

        [Fact]
        public async Task SaveFeeScheduleAsync_CreatesAndUpdatesScheduleWithoutKeyCollisions()
        {
            using var db = GetInMemoryDbContext();
            var ay = new AcademicYear
            {
                AcademicYearName = "2026-2027",
                StartDate = new DateTime(2026, 6, 1),
                EndDate = new DateTime(2027, 5, 31),
                IsActive = true
            };
            db.AcademicYears.Add(ay);
            await db.SaveChangesAsync();

            var repo = new FinanceMasterRepository(db);

            var initialSchedule = new FeeScheduleConfigDto
            {
                Id = "SCH-2026-2027",
                AcademicYear = "2026-2027",
                NumberOfTerms = 3,
                DueDateOffsetDays = 45,
                Status = "Published",
                OneTimeDueDate = "2026-07-15",
                MonthlyConfig = new MonthlyDueDateConfigDto
                {
                    ApplySameDayToAllMonths = true,
                    DueDay = 10,
                    MonthDueDates = new List<MonthDueDateItemDto>
                    {
                        new MonthDueDateItemDto { MonthIndex = 1, MonthName = "June", DueDate = "2026-06-10" },
                        new MonthDueDateItemDto { MonthIndex = 2, MonthName = "July", DueDate = "2026-07-10" }
                    }
                },
                Terms = new List<FeeScheduleTermDto>
                {
                    new FeeScheduleTermDto { Sequence = 1, TermName = "Term 1", StartDate = "2026-06-01", EndDate = "2026-09-30", DueDate = "2026-07-15", PercentageShare = 40 },
                    new FeeScheduleTermDto { Sequence = 2, TermName = "Term 2", StartDate = "2026-10-01", EndDate = "2026-12-31", DueDate = "2026-11-15", PercentageShare = 30 },
                    new FeeScheduleTermDto { Sequence = 3, TermName = "Term 3", StartDate = "2027-01-01", EndDate = "2027-04-30", DueDate = "2027-02-15", PercentageShare = 30 }
                }
            };

            // 1. Initial Save & Publish
            var saveResult1 = await repo.SaveFeeScheduleAsync(initialSchedule);
            Assert.True(saveResult1);

            var fetched1 = await repo.GetFeeScheduleAsync("2026-2027");
            Assert.NotNull(fetched1);
            Assert.Equal(3, fetched1.Terms.Count);
            Assert.Equal("Published", fetched1.Status);
            Assert.Equal(2, fetched1.MonthlyConfig?.MonthDueDates.Count);

            // 2. Update existing schedule (simulates clicking Save & Publish Schedule again or changing dates)
            initialSchedule.DueDateOffsetDays = 30;
            initialSchedule.Terms[0].DueDate = "2026-07-01";
            var saveResult2 = await repo.SaveFeeScheduleAsync(initialSchedule);
            Assert.True(saveResult2);

            var fetched2 = await repo.GetFeeScheduleAsync("2026-2027");
            Assert.NotNull(fetched2);
            Assert.Equal(30, fetched2.DueDateOffsetDays);
            Assert.Equal("2026-07-01", fetched2.Terms[0].DueDate);
        }
    }
}
