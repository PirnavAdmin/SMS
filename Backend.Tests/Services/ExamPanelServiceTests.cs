using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using Xunit;

namespace Backend.Tests.Services
{
    public class ExamPanelServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task Examination_ScheduleExamWithInvigilator_SavesSectionInvigilation()
        {
            var context = GetInMemoryDbContext();
            var schedule = new ExamSchedule
            {
                ExamId = 1,
                ExamTitle = "Mid-Term Examination 2026",
                ClassName = "Class 10",
                SectionName = "Section A",
                SubjectName = "Mathematics",
                ExamDate = new DateTime(2026, 09, 10),
                StartTime = "09:00",
                EndTime = "12:00"
            };

            schedule.InvigilatorAssignments.Add(new ExamInvigilatorAssignment
            {
                SectionName = "Section A",
                StaffId = 3,
                StaffName = "Rajesh Pirnav",
                EmployeeId = "EMP003"
            });

            await context.ExamSchedules.AddAsync(schedule);
            await context.SaveChangesAsync();

            var saved = await context.ExamSchedules.Include(s => s.InvigilatorAssignments).FirstAsync();
            Assert.Single(saved.InvigilatorAssignments);
            var invig = System.Linq.Enumerable.First(saved.InvigilatorAssignments);
            Assert.Equal("Rajesh Pirnav", invig.StaffName);
            Assert.Equal("EMP003", invig.EmployeeId);
        }
    }
}
