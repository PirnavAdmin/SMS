using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using SMS.Api.Data;
using SMS.Api.Dtos.Ai;
using SMS.Api.Dtos.Dashboard;
using SMS.Api.Models;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Ai.Providers;
using SMS.Api.Services.Ai.Tools;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Interfaces.Dashboard;
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
        private readonly Mock<IDashboardService> _mockDashboardService;

        public AiAssistantTests()
        {
            var mockContext = CreateInMemoryContext();
            var mockParentService = new Mock<IParentService>();
            var mockFeeService = new Mock<IFeeCollectionService>();
            var mockExamService = new Mock<IExamScheduleService>();
            var mockLibraryService = new Mock<ILibraryService>();
            var mockTimetableService = new Mock<ITimetableService>();
            var mockStaffService = new Mock<IStaffService>();
            _mockDashboardService = new Mock<IDashboardService>();

            _mockDashboardService
                .Setup(d => d.GetDashboardSummaryAsync(It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new DashboardSummaryDto
                {
                    TotalStudents = 407,
                    TotalClasses = 14,
                    TeachingStaff = 22,
                    NonTeachingStaff = 14,
                    ClassWiseStrength = new List<ClassStrengthDto>
                    {
                        new ClassStrengthDto { ClassName = "Class 10", StudentCount = 45 },
                        new ClassStrengthDto { ClassName = "Class 9", StudentCount = 42 }
                    }
                });

            _tools = new List<IAiTool>
            {
                new StudentOverviewTool(mockContext, _mockDashboardService.Object),
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
        public async Task DeterministicEngine_HandlesActionConfirmationToken()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "action_confirm:announcement_tok_12345",
                ToolContext = new AiToolContext { UserId = 1, UserRole = "Admin" }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.Contains("confirmed", plan.ReplyText, StringComparison.OrdinalIgnoreCase);
            Assert.False(plan.HasToolCalls);
        }

        [Fact]
        public async Task DeterministicEngine_HandlesActionCancellation()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "action_cancel:meeting_tok_999",
                ToolContext = new AiToolContext { UserId = 1, UserRole = "Admin" }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.Contains("cancelled", plan.ReplyText, StringComparison.OrdinalIgnoreCase);
            Assert.False(plan.HasToolCalls);
        }

        [Fact]
        public async Task DeterministicEngine_ProvidesSystemGuidanceWhenGeminiUnconfigured()
        {
            var chatContext = new AiChatContext
            {
                LatestUserMessage = "What is the fee structure for grade 10?",
                ToolContext = new AiToolContext { UserId = 1, UserRole = "Parent" }
            };

            var plan = await _engine.GenerateChatResponseAsync(chatContext, _tools);

            Assert.Contains("Gemini", plan.ReplyText);
            Assert.False(plan.HasToolCalls);
        }

        [Fact]
        public async Task StudentOverviewTool_ReturnsVerified407StudentCount()
        {
            var overviewTool = _tools.First(t => t.Name == "student_get_overview");
            var ctx = new AiToolContext
            {
                UserId = 1,
                UserRole = "Admin",
                BranchName = "Madhapur Branch",
                AcademicYear = "2026-27"
            };

            var args = JsonDocument.Parse("{}").RootElement;
            var result = await overviewTool.ExecuteAsync(ctx, args);

            Assert.True(result.Success);
            Assert.Contains("407", result.Summary);
            Assert.Equal("table", result.VisualType);
        }

        [Fact]
        public async Task StudentSearchTool_EnforcesParentChildSecurity()
        {
            var searchTool = _tools.First(t => t.Name == "student_search");
            var ctx = new AiToolContext
            {
                UserId = 50,
                UserRole = "Parent",
                LinkedChildStudentIds = new List<int>() // No linked children
            };

            var args = JsonDocument.Parse("{\"query\": \"John\"}").RootElement;
            var result = await searchTool.ExecuteAsync(ctx, args);

            Assert.False(result.Success);
            Assert.Contains("No linked children found", result.ErrorMessage);
        }

        [Fact]
        public async Task ActionCreateAnnouncementTool_GeneratesTwoPhasePreview()
        {
            var actionTool = _tools.First(t => t.Name == "action_create_announcement");
            var ctx = new AiToolContext { UserId = 1, UserRole = "Admin" };

            var args = JsonDocument.Parse("{\"title\": \"Sports Day 2026\", \"content\": \"Annual sports celebration next week.\"}").RootElement;
            var result = await actionTool.ExecuteAsync(ctx, args);

            Assert.True(result.Success);
            Assert.NotNull(result.PendingAction);
            Assert.Equal("create_announcement", result.PendingAction.ActionType);
            Assert.False(string.IsNullOrWhiteSpace(result.PendingAction.ConfirmationToken));
        }
    }
}
