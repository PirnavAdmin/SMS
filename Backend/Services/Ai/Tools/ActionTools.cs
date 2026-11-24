using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Ai;
using SMS.Api.Models;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Services.Ai.Tools
{
    public class ActionCreateAnnouncementTool : IAiTool
    {
        public string Name => "action_create_announcement";
        public string Description => "Prepares a formal school announcement/circular broadcast for preview and explicit user confirmation before sending.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""title"": { ""type"": ""string"", ""description"": ""Announcement title / headline"" },
                ""content"": { ""type"": ""string"", ""description"": ""Full content text of the announcement"" },
                ""targetAudience"": { ""type"": ""string"", ""description"": ""Target group: 'All', 'Students', 'Parents', 'Teachers'"" },
                ""category"": { ""type"": ""string"", ""description"": ""Category: 'ACADEMIC', 'URGENT', 'SPORTS', 'EXAM', 'HOLIDAY', 'GENERAL'"" }
            },
            ""required"": [""title"", ""content""]
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal" };

        public Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            if (!context.UserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
                !context.UserRole.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) &&
                !context.UserRole.Equals("Super Admin", StringComparison.OrdinalIgnoreCase) &&
                !context.UserRole.Equals("Principal", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(AiToolResult.Fail("Unauthorized: Only School Administrators and Principals can broadcast school announcements."));
            }

            var title = arguments.TryGetProperty("title", out var tElem) ? tElem.GetString()?.Trim() : "School Announcement";
            var content = arguments.TryGetProperty("content", out var cElem) ? cElem.GetString()?.Trim() : "";
            var audience = arguments.TryGetProperty("targetAudience", out var aElem) ? aElem.GetString()?.Trim() : "All";
            var category = arguments.TryGetProperty("category", out var catElem) ? catElem.GetString()?.Trim().ToUpperInvariant() : "GENERAL";

            if (string.IsNullOrWhiteSpace(content))
            {
                return Task.FromResult(AiToolResult.Fail("Announcement content is required."));
            }

            var token = "ACT_CIRCULAR_" + Guid.NewGuid().ToString("N");
            var pendingAction = new AiPendingActionDto
            {
                ActionType = "create_announcement",
                Title = $"Create Announcement: '{title}'",
                Description = $"Broadcast announcement to {audience} under category {category}.",
                ConfirmationToken = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                Parameters = new Dictionary<string, object?>
                {
                    { "title", title },
                    { "content", content },
                    { "audience", audience },
                    { "category", category }
                }
            };

            var summary = $"Action Preview: Prepared announcement '{title}' for target audience '{audience}'. Explicit confirmation required before publishing.";

            var visualData = new
            {
                title = "Authorized Action Preview: Publish Announcement",
                type = "announcement_preview",
                details = new
                {
                    Title = title,
                    TargetAudience = audience,
                    Category = category,
                    Content = content,
                    Author = context.UserName,
                    Status = "AWAITING_USER_CONFIRMATION"
                }
            };

            var result = new AiToolResult
            {
                Success = true,
                Summary = summary,
                VisualType = "action_preview",
                VisualData = visualData,
                PendingAction = pendingAction
            };

            return Task.FromResult(result);
        }
    }

    public class ActionScheduleMeetingTool : IAiTool
    {
        public string Name => "action_schedule_meeting";
        public string Description => "Prepares a Parent-Teacher Meeting (PTM) or staff meeting for preview and explicit user confirmation before scheduling.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""meetingTitle"": { ""type"": ""string"", ""description"": ""Meeting title e.g. 'Term 1 Parent Teacher Conference'"" },
                ""meetingDate"": { ""type"": ""string"", ""description"": ""Meeting date in YYYY-MM-DD format"" },
                ""meetingTime"": { ""type"": ""string"", ""description"": ""Meeting time e.g. '10:00 AM'"" },
                ""audience"": { ""type"": ""string"", ""description"": ""Target group: 'Parent', 'Staff', 'All Audiences'"" },
                ""mode"": { ""type"": ""string"", ""description"": ""Mode: 'In-Person', 'Online', 'Hybrid'"" },
                ""agenda"": { ""type"": ""string"", ""description"": ""Meeting agenda / description"" }
            },
            ""required"": [""meetingTitle"", ""meetingDate""]
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher" };

        public Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            var title = arguments.TryGetProperty("meetingTitle", out var tElem) ? tElem.GetString()?.Trim() : "Parent-Teacher Meeting";
            var dateStr = arguments.TryGetProperty("meetingDate", out var dElem) ? dElem.GetString()?.Trim() : DateTime.Today.AddDays(2).ToString("yyyy-MM-dd");
            var timeStr = arguments.TryGetProperty("meetingTime", out var timeElem) ? timeElem.GetString()?.Trim() : "10:00 AM";
            var audience = arguments.TryGetProperty("audience", out var aElem) ? aElem.GetString()?.Trim() : "Parent";
            var mode = arguments.TryGetProperty("mode", out var mElem) ? mElem.GetString()?.Trim() : "In-Person";
            var agenda = arguments.TryGetProperty("agenda", out var agElem) ? agElem.GetString()?.Trim() : "Discussion on academic performance and progress.";

            var token = "ACT_MEET_" + Guid.NewGuid().ToString("N");
            var pendingAction = new AiPendingActionDto
            {
                ActionType = "schedule_meeting",
                Title = $"Schedule Meeting: '{title}'",
                Description = $"Schedule {mode} meeting on {dateStr} at {timeStr} for {audience}.",
                ConfirmationToken = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                Parameters = new Dictionary<string, object?>
                {
                    { "meetingTitle", title },
                    { "meetingDate", dateStr },
                    { "meetingTime", timeStr },
                    { "audience", audience },
                    { "mode", mode },
                    { "agenda", agenda }
                }
            };

            var summary = $"Action Preview: Prepared meeting '{title}' for {audience} on {dateStr} at {timeStr} ({mode}). Explicit confirmation required before scheduling.";

            var visualData = new
            {
                title = "Authorized Action Preview: Schedule Meeting",
                type = "meeting_preview",
                details = new
                {
                    Title = title,
                    Date = dateStr,
                    Time = timeStr,
                    Audience = audience,
                    Mode = mode,
                    Agenda = agenda,
                    Organizer = context.UserName,
                    Status = "AWAITING_USER_CONFIRMATION"
                }
            };

            var result = new AiToolResult
            {
                Success = true,
                Summary = summary,
                VisualType = "action_preview",
                VisualData = visualData,
                PendingAction = pendingAction
            };

            return Task.FromResult(result);
        }
    }
}
