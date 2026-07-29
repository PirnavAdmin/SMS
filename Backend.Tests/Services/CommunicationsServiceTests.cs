using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using Xunit;

namespace Backend.Tests.Services
{
    public class CommunicationsServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task Communications_ScheduleMeeting_SavesVenueAndParticipant()
        {
            var context = GetInMemoryDbContext();
            var meeting = new Meeting
            {
                MeetingAudience = "Individual Meeting",
                ParticipantType = "Parent",
                ParticipantName = "Robert Morgan (Parent)",
                MeetingTitle = "Parent-Teacher Performance Sync (Alex Morgan)",
                MeetingMode = "In-Person",
                Building = "Academic Block A",
                MeetingRoom = "Conference Room 204",
                RoomCapacity = 15,
                MeetingDate = new DateTime(2026, 08, 10),
                StartTime = "14:00",
                EndTime = "14:30",
                MeetingStatus = "Scheduled"
            };

            await context.Meetings.AddAsync(meeting);
            await context.SaveChangesAsync();

            var saved = await context.Meetings.FirstAsync();
            Assert.Equal("Conference Room 204", saved.MeetingRoom);
            Assert.Equal(15, saved.RoomCapacity);
        }
    }
}
