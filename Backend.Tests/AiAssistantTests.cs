using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using SMS.Api.Data;
using SMS.Api.Dtos.Ai;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Ai.Providers;
using SMS.Api.Services.Ai.Tools;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Interfaces.Examination;
using SMS.Api.Services.Interfaces.FinanceManagement;
using SMS.Api.Services.Interfaces.Parent;
using SMS.Api.Services.Interfaces.StaffManagement;
using Xunit;

namespace Backend.Tests
{
    public class AiAssistantTests
    {
        private readonly List<IAiTool> _tools;
        private readonly DeterministicAiEngine _engine;

        public AiAssistantTests()
        {
            var mockContext = CreateInMemoryContext();
            var mockParentService = new Mock<IParentService>();
            var mockFeeService = new Mock<IFeeCollectionService>();
            var mockExamService = new Mock<IExamScheduleService>();
            var mockLibraryService = new Mock<ILibraryService>();
            var mockTimetableService = new Mock<ITimetableService>();
            var mockStaffService = new Mock<IStaffService>();

            _tools = new List<IAiTool>
            {
                new StudentSearchTool(mockContext),
                new StudentDetailsTool(mockContext),
                new AttendanceDailySummaryTool(mockContext),
                new AttendanceClassSummaryTool(mockContext),
                new FeeStudentProfileTool(mockFeeService.Object, mockContext),
                new FeeCollectionStatsTool(mockFeeService.Object),
                new ExamStudentResultsTool(mockParentService.Object, mockContext),
                new ExamScheduleTool(mockExamService.Object),
                new TransportFleetTool(mockContext),
                new LibraryCatalogTool(mockLibraryService.Object),
                new TimetableScheduleTool(mockTimetableService.Object, mockContext),
                new AdminStaffDirectoryTool(mockStaffService.Object),
                new AdminClassesTool(mockContext),
                new ActionCreateAnnouncementTool(),
                new ActionScheduleMeetingTool()
            };

            _engine = new DeterministicAiEngine();
        }

        private AppDbContext CreateInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task Engine_DetectsAttendanceDailySummaryIntent_Successfully()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "How many students are absent today?",
                ToolContext = new AiToolContext
                {
                    UserId = 1,
                    UserRole = "Admin",
                    UserName = "Administrator"
                }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.NotEmpty(plan.ToolCallsRequested);
            Assert.Equal("attendance_get_daily_summary", plan.ToolCallsRequested[0].ToolName);
        }

        [Fact]
        public async Task Engine_DetectsClassAttendanceComparisonIntent_Successfully()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "Which class has the highest attendance?",
                ToolContext = new AiToolContext
                {
                    UserId = 1,
                    UserRole = "Principal",
                    UserName = "Principal"
                }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.NotEmpty(plan.ToolCallsRequested);
            Assert.Equal("attendance_get_class_comparison", plan.ToolCallsRequested[0].ToolName);
        }

        [Fact]
        public async Task Engine_DetectsStudentFeeProfileIntent_Successfully()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "Show my child's pending fee balance",
                ToolContext = new AiToolContext
                {
                    UserId = 50,
                    UserRole = "Parent",
                    UserName = "John Parent",
                    LinkedChildStudentIds = new List<int> { 101 }
                }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.NotEmpty(plan.ToolCallsRequested);
            Assert.Equal("fee_get_student_profile", plan.ToolCallsRequested[0].ToolName);
        }

        [Fact]
        public async Task Engine_DetectsFeeCollectionStatsIntent_Successfully()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "What is our total fee collection and overdue amount?",
                ToolContext = new AiToolContext
                {
                    UserId = 20,
                    UserRole = "Accountant",
                    UserName = "Chief Accountant"
                }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.NotEmpty(plan.ToolCallsRequested);
            Assert.Equal("fee_get_collection_stats", plan.ToolCallsRequested[0].ToolName);
        }

        [Fact]
        public async Task Engine_DetectsExamResultsIntent_Successfully()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "Show my exam report card and marks",
                ToolContext = new AiToolContext
                {
                    UserId = 88,
                    UserRole = "Student",
                    UserName = "Alice Student",
                    StudentId = 205
                }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.NotEmpty(plan.ToolCallsRequested);
            Assert.Equal("exam_get_student_results", plan.ToolCallsRequested[0].ToolName);
        }

        [Fact]
        public async Task Engine_DetectsTransportFleetIntent_Successfully()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "Show my assigned bus and route sheet",
                ToolContext = new AiToolContext
                {
                    UserId = 45,
                    UserRole = "Driver",
                    UserName = "Driver Dave"
                }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.NotEmpty(plan.ToolCallsRequested);
            Assert.Equal("transport_get_fleet_info", plan.ToolCallsRequested[0].ToolName);
        }

        [Fact]
        public async Task Engine_DetectsLibraryCatalogIntent_Successfully()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "Check if Science textbook copies are available in the library",
                ToolContext = new AiToolContext
                {
                    UserId = 30,
                    UserRole = "Librarian",
                    UserName = "Chief Librarian"
                }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.NotEmpty(plan.ToolCallsRequested);
            Assert.Equal("library_search_catalog", plan.ToolCallsRequested[0].ToolName);
        }

        [Fact]
        public async Task Engine_DetectsTimetableScheduleIntent_Successfully()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "What is my timetable for today?",
                ToolContext = new AiToolContext
                {
                    UserId = 12,
                    UserRole = "Teacher",
                    UserName = "Sarah Teacher",
                    StaffId = 15
                }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.NotEmpty(plan.ToolCallsRequested);
            Assert.Equal("timetable_get_schedule", plan.ToolCallsRequested[0].ToolName);
        }

        [Fact]
        public async Task Engine_RequiresConfirmation_ForAnnouncementWriteAction()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "Create an announcement: School will remain closed on Friday for Annual Sports Day",
                ToolContext = new AiToolContext
                {
                    UserId = 1,
                    UserRole = "Admin",
                    UserName = "Principal"
                }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.NotEmpty(plan.ToolCallsRequested);
            var toolCall = plan.ToolCallsRequested[0];
            Assert.Equal("action_create_announcement", toolCall.ToolName);

            // Execute the action tool to verify preview generation and confirmation requirements
            var actionTool = _tools.First(t => t.Name == "action_create_announcement");
            var result = await actionTool.ExecuteAsync(chatContext.ToolContext, toolCall.Arguments);

            Assert.True(result.Success);
            Assert.NotNull(result.PendingAction);
            Assert.Equal("create_announcement", result.PendingAction.ActionType);
            Assert.False(string.IsNullOrWhiteSpace(result.PendingAction.ConfirmationToken));
            Assert.Contains("Sports Day", result.PendingAction.Title + " " + result.PendingAction.Description);
        }

        [Fact]
        public async Task Engine_RequiresConfirmation_ForScheduleMeetingAction()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "Schedule a Parent Teacher Meeting for Class 10 on Monday at 10:00 AM",
                ToolContext = new AiToolContext
                {
                    UserId = 1,
                    UserRole = "Admin",
                    UserName = "Principal"
                }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.NotEmpty(plan.ToolCallsRequested);
            var toolCall = plan.ToolCallsRequested[0];
            Assert.Equal("action_schedule_meeting", toolCall.ToolName);

            // Execute the meeting tool to verify preview generation
            var actionTool = _tools.First(t => t.Name == "action_schedule_meeting");
            var result = await actionTool.ExecuteAsync(chatContext.ToolContext, toolCall.Arguments);

            Assert.True(result.Success);
            Assert.NotNull(result.PendingAction);
            Assert.Equal("schedule_meeting", result.PendingAction.ActionType);
            Assert.False(string.IsNullOrWhiteSpace(result.PendingAction.ConfirmationToken));
            Assert.Contains("PTM", result.PendingAction.Title + " " + result.PendingAction.Description);
        }

        [Fact]
        public async Task ToolAuthorization_PreventsStudent_FromCallingAnnouncementAction()
        {
            var studentContext = new AiToolContext
            {
                UserId = 88,
                UserRole = "Student",
                UserName = "Student User"
            };

            var announcementTool = _tools.First(t => t.Name == "action_create_announcement");
            var jsonArgs = JsonDocument.Parse("{\"title\":\"Fake Holiday\",\"content\":\"No school today\"}").RootElement;

            var result = await announcementTool.ExecuteAsync(studentContext, jsonArgs);

            Assert.False(result.Success);
            Assert.Contains("Unauthorized", result.ErrorMessage);
        }

        [Fact]
        public void ToolAuthorization_PreventsStudent_FromCallingFeeCollectionStats()
        {
            var studentContext = new AiToolContext
            {
                UserId = 88,
                UserRole = "Student",
                UserName = "Student User"
            };

            var feeStatsTool = _tools.First(t => t.Name == "fee_get_collection_stats");

            // FeeCollectionStatsTool AllowedRoles: Admin, SuperAdmin, Principal, Accountant
            bool isAllowed = feeStatsTool.AllowedRoles.Any(r => r.Equals(studentContext.UserRole, StringComparison.OrdinalIgnoreCase));
            Assert.False(isAllowed);
        }

        [Fact]
        public async Task SecurityScoping_PreventsParent_FromAccessingUnlinkedChildExamResult()
        {
            var context = CreateInMemoryContext();
            var parentServiceMock = new Mock<IParentService>();
            var tool = new ExamStudentResultsTool(parentServiceMock.Object, context);

            var parentContext = new AiToolContext
            {
                UserId = 50,
                UserRole = "Parent",
                UserName = "Parent User",
                LinkedChildStudentIds = new List<int> { 101, 102 }
            };

            // Attempting to query student ID 999 which does NOT belong to this parent
            var jsonArgs = JsonDocument.Parse("{\"studentId\": 999}").RootElement;
            var result = await tool.ExecuteAsync(parentContext, jsonArgs);

            Assert.False(result.Success);
            Assert.Contains("Unauthorized", result.ErrorMessage);
        }
    }
}
