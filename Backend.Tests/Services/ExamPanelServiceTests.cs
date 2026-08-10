using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models.Examination;
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
        public async Task Examination_ScheduleNewExamTimetableSlot_SavesSuccessfully()
        {
            var context = GetInMemoryDbContext();
            var slot = new NewExamTimetableSlot
            {
                SlotId = 1,
                ExamId = 10,
                ClassName = "Class 10",
                SectionName = "Section A",
                SubjectCode = "MTH-101",
                SubjectName = "Mathematics",
                TotalMarks = 100,
                ExamDate = new DateTime(2026, 09, 10),
                TimeSlot = "09:00 - 12:00",
                Duration = "3h",
                RoomHall = "Room 101",
                InvigilatorFaculty = "Rajesh Pirnav"
            };

            await context.NewExamTimetableSlots.AddAsync(slot);
            await context.SaveChangesAsync();

            var saved = await context.NewExamTimetableSlots.FirstAsync();
            Assert.Equal(1, saved.SlotId);
            Assert.Equal(10, saved.ExamId);
            Assert.Equal("Class 10", saved.ClassName);
            Assert.Equal("Section A", saved.SectionName);
            Assert.Equal("Mathematics", saved.SubjectName);
            Assert.Equal("Room 101", saved.RoomHall);
            Assert.Equal("Rajesh Pirnav", saved.InvigilatorFaculty);
        }
    }
}
