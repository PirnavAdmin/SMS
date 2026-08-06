namespace SMS.Api.Services.Implementations;

using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class CommunicationService : ICommunicationService
{
    private readonly AppDbContext _context;

    public CommunicationService(AppDbContext context)
    {
        _context = context;
    }

    public Task<CommunicationOptionsDto> GetCommunicationOptionsAsync()
    {
        var options = new CommunicationOptionsDto
        {
            AcademicYears = new List<string> { "2027-28", "2026-27", "2025-26" },
            Audiences = new List<string> { "All Audiences", "Individual Meetings", "Group Meetings" },
            Modes = new List<string> { "All Modes", "In-Person", "Online", "Hybrid" },
            Statuses = new List<string> { "All Statuses", "Scheduled", "Draft", "Completed", "Cancelled" }
        };

        return Task.FromResult(options);
    }

    public Task<List<BroadcastNotificationDto>> GetBroadcastNotificationsAsync(string? academicYear, string? category)
    {
        var notifications = new List<BroadcastNotificationDto>
        {
            new BroadcastNotificationDto
            {
                Id = 1,
                CategoryTag = "SPORTS • ALL",
                Title = "Annual Sports Meet Registration Open",
                Body = "Submit entries to PE department before August 5th.",
                Date = "2026-07-20",
                Audience = "ALL"
            },
            new BroadcastNotificationDto
            {
                Id = 2,
                CategoryTag = "ACADEMIC • STAFF",
                Title = "Mid-Term Review & Pedagogical Standards Alignment",
                Body = "All teachers are requested to update their lesson plans and student progress reports by this Friday. We will have a short alignment briefing during department meetings.",
                Date = "2026-07-30",
                Audience = "STAFF"
            },
            new BroadcastNotificationDto
            {
                Id = 3,
                CategoryTag = "ASSEMBLY • ALL",
                Title = "All-School Morning Assembly & Leadership Talk",
                Body = "A special morning assembly will be held tomorrow at 08:30 AM in the Main Campus Auditorium. Attendance is mandatory for all students and faculty members. Dr. Eleanor Vance will present the new student council members.",
                Date = "2026-07-30",
                Audience = "ALL"
            }
        };

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            notifications = notifications.Where(n => n.CategoryTag.Contains(category, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        return Task.FromResult(notifications);
    }

    public Task<List<CommunicationMeetingDto>> GetMeetingsAsync(string? audience, string? mode, string? status, string? search, string? academicYear)
    {
        var meetings = new List<CommunicationMeetingDto>
        {
            new CommunicationMeetingDto
            {
                MeetingId = 1,
                Tag = "INDIVIDUAL MEETING",
                Status = "SCHEDULED",
                Title = "Parent-Teacher Performance Sync (Alex Morgan)",
                Description = "In-person discussion regarding Class 10 Mid-Term progress and career stream selection.",
                Participant = "Robert Morgan (Parent)",
                ParticipantSubtext = "Parent of Alex Morgan (Class 10-A • ADM-101)",
                Date = "2026-08-10",
                TimeSlot = "14:00 - 14:30",
                Venue = "Conference Room 204 (Academic Block A)",
                Mode = "In-Person"
            },
            new CommunicationMeetingDto
            {
                MeetingId = 2,
                Tag = "GROUP MEETING",
                Status = "SCHEDULED",
                Title = "HOD & Mathematics Faculty Academic Alignment",
                Description = "Group strategy session to align syllabus completion for Class 9 and Class 10 upcoming assessments.",
                Participant = "All Mathematics Department Faculty",
                ParticipantSubtext = "Mathematics Faculty",
                Date = "2026-08-12",
                TimeSlot = "11:00 - 12:00",
                Venue = "Staff Seminar Hall B (Science & Tech Wing)",
                Mode = "In-Person"
            },
            new CommunicationMeetingDto
            {
                MeetingId = 3,
                Tag = "GROUP MEETING",
                Status = "SCHEDULED",
                Title = "Science & Mathematics Joint Curriculum Sync",
                Description = "Joint alignment meeting between Science and Mathematics departments to discuss interdisciplinary STEM topics and laboratory schedules.",
                Participant = "Science & Mathematics Faculty",
                ParticipantSubtext = "Science & Mathematics Faculty",
                Date = "2026-07-30",
                TimeSlot = "14:30 - 15:30",
                Venue = "Principal Conference Hall (Main Administration Block)",
                Mode = "In-Person"
            }
        };

        // Apply Audience Filter
        if (!string.IsNullOrWhiteSpace(audience) && !audience.Equals("All Audiences", StringComparison.OrdinalIgnoreCase))
        {
            if (audience.Contains("Individual", StringComparison.OrdinalIgnoreCase))
                meetings = meetings.Where(m => m.Tag.Contains("INDIVIDUAL", StringComparison.OrdinalIgnoreCase)).ToList();
            else if (audience.Contains("Group", StringComparison.OrdinalIgnoreCase))
                meetings = meetings.Where(m => m.Tag.Contains("GROUP", StringComparison.OrdinalIgnoreCase)).ToList();
        }

        // Apply Mode Filter
        if (!string.IsNullOrWhiteSpace(mode) && !mode.Equals("All Modes", StringComparison.OrdinalIgnoreCase))
        {
            meetings = meetings.Where(m => m.Mode.Equals(mode, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        // Apply Status Filter
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All Statuses", StringComparison.OrdinalIgnoreCase))
        {
            meetings = meetings.Where(m => m.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        // Apply Search Filter
        if (!string.IsNullOrWhiteSpace(search))
        {
            meetings = meetings.Where(m => 
                m.Title.Contains(search, StringComparison.OrdinalIgnoreCase) || 
                m.Participant.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                m.Venue.Contains(search, StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        return Task.FromResult(meetings);
    }
}
