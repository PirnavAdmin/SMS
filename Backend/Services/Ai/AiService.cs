using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SMS.Api.Data;
using SMS.Api.Dtos.Ai;
using SMS.Api.Models;
using SMS.Api.Models.Ai;
using SMS.Api.Repositories.Interfaces.Parent;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Ai.Providers;

namespace SMS.Api.Services.Ai
{
    public class AiService : IAiService
    {
        private readonly AppDbContext _context;
        private readonly IEnumerable<IAiTool> _tools;
        private readonly DeterministicAiEngine _deterministicEngine;
        private readonly GeminiAiProvider _geminiProvider;
        private readonly IParentRepository _parentRepository;
        private readonly IConfiguration _config;
        private readonly ILogger<AiService> _logger;

        public AiService(
            AppDbContext context,
            IEnumerable<IAiTool> tools,
            DeterministicAiEngine deterministicEngine,
            GeminiAiProvider geminiProvider,
            IParentRepository parentRepository,
            IConfiguration config,
            ILogger<AiService> logger)
        {
            _context = context;
            _tools = tools;
            _deterministicEngine = deterministicEngine;
            _geminiProvider = geminiProvider;
            _parentRepository = parentRepository;
            _config = config;
            _logger = logger;
        }

        public async Task<AiToolContext> BuildToolContextAsync(ClaimsPrincipal user)
        {
            var ctx = new AiToolContext();

            var idClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value ?? user.FindFirst("id")?.Value;
            if (int.TryParse(idClaim, out var uid)) ctx.UserId = uid;

            ctx.UserRole = user.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";
            ctx.UserName = user.FindFirst(ClaimTypes.Name)?.Value ?? "User";
            ctx.UserEmail = user.FindFirst(ClaimTypes.Email)?.Value ?? "";
            ctx.TenantId = user.FindFirst("TenantId")?.Value ?? user.FindFirst("tenant")?.Value;

            var schClaim = user.FindFirst("schoolId")?.Value;
            if (int.TryParse(schClaim, out var sid)) ctx.SchoolId = sid;

            var staffClaim = user.FindFirst("StaffId")?.Value ?? user.FindFirst("staff_id")?.Value;
            if (int.TryParse(staffClaim, out var stid)) ctx.StaffId = stid;

            // Security: Role-specific entity resolution
            if (ctx.UserRole.Equals("Parent", StringComparison.OrdinalIgnoreCase))
            {
                var children = await _parentRepository.GetChildrenByParentIdentifierAsync(
                    ctx.UserEmail.Length > 0 ? ctx.UserEmail : ctx.UserId.ToString());
                ctx.LinkedChildStudentIds = children.Select(c => c.StudentId).Distinct().ToList();

                // If not in parent repo, fallback to parent_student_mappings directly
                if (ctx.LinkedChildStudentIds.Count == 0 && ctx.UserId > 0)
                {
                    ctx.LinkedChildStudentIds = await _context.ParentStudentMappings
                        .Where(m => m.ParentUserId == ctx.UserId && m.Status == "Active")
                        .Select(m => m.StudentId)
                        .ToListAsync();
                }
            }
            else if (ctx.UserRole.Equals("Student", StringComparison.OrdinalIgnoreCase))
            {
                // Resolve student from DB
                var stu = await _context.Students
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => !s.IsDeleted &&
                        ((s.Email != null && ctx.UserEmail.Length > 0 && s.Email.ToLower() == ctx.UserEmail.ToLower()) ||
                         (ctx.UserName.Length > 0 && s.StudentName.ToLower() == ctx.UserName.ToLower())));

                if (stu != null)
                {
                    ctx.StudentId = stu.StudentId;
                }
                else if (ctx.UserId > 0)
                {
                    var usr = await _context.Users.FindAsync(ctx.UserId);
                    if (usr != null && !string.IsNullOrEmpty(usr.MobileNumber))
                    {
                        var stuByMob = await _context.Students.FirstOrDefaultAsync(s => !s.IsDeleted &&
                            (s.RollNumber == usr.MobileNumber || s.AdmissionNumber == usr.MobileNumber));
                        if (stuByMob != null) ctx.StudentId = stuByMob.StudentId;
                    }
                }
            }
            else if (ctx.UserRole.Equals("Teacher", StringComparison.OrdinalIgnoreCase))
            {
                // Resolve assigned classes & sections
                int? staffId = ctx.StaffId;
                if (!staffId.HasValue && ctx.UserEmail.Length > 0)
                {
                    var staff = await _context.Staff.FirstOrDefaultAsync(s => s.Email == ctx.UserEmail);
                    if (staff != null) staffId = staff.StaffId;
                }

                if (staffId.HasValue)
                {
                    ctx.StaffId = staffId.Value;
                    ctx.AssignedClassIds = await _context.TeacherAssignments
                        .Where(t => t.TeacherId == staffId.Value)
                        .Select(t => t.ClassId)
                        .Distinct()
                        .ToListAsync();

                    var letters = await _context.TeacherAssignments
                        .Where(t => t.TeacherId == staffId.Value)
                        .Select(t => t.SectionLetter)
                        .Distinct()
                        .ToListAsync();

                    ctx.AssignedSectionIds = await _context.ClassSections
                        .Where(cs => letters.Contains(cs.SectionName))
                        .Select(cs => cs.SectionId)
                        .Distinct()
                        .ToListAsync();
                }
            }

            return ctx;
        }

        public async Task<List<AiConversationSummaryDto>> GetUserConversationsAsync(ClaimsPrincipal user)
        {
            var ctx = await BuildToolContextAsync(user);

            var list = await _context.AiConversations
                .AsNoTracking()
                .Where(c => c.UserId == ctx.UserId && !c.IsDeleted)
                .OrderByDescending(c => c.IsPinned)
                .ThenByDescending(c => c.UpdatedAt)
                .Select(c => new AiConversationSummaryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    IsPinned = c.IsPinned,
                    MessageCount = c.Messages.Count,
                    LastMessage = c.Messages.OrderByDescending(m => m.CreatedAt).Select(m => m.Content).FirstOrDefault()
                })
                .ToListAsync();

            return list;
        }

        public async Task<AiConversationDetailDto?> GetConversationDetailAsync(ClaimsPrincipal user, string conversationId)
        {
            var ctx = await BuildToolContextAsync(user);

            var conv = await _context.AiConversations
                .Include(c => c.Messages.OrderBy(m => m.CreatedAt))
                .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == ctx.UserId && !c.IsDeleted);

            if (conv == null) return null;

            return new AiConversationDetailDto
            {
                Id = conv.Id,
                Title = conv.Title,
                UserRole = conv.UserRole,
                CreatedAt = conv.CreatedAt,
                UpdatedAt = conv.UpdatedAt,
                IsPinned = conv.IsPinned,
                Messages = conv.Messages.Select(m =>
                {
                    object? visualData = null;
                    if (!string.IsNullOrWhiteSpace(m.VisualDataJson))
                    {
                        try { visualData = JsonSerializer.Deserialize<object>(m.VisualDataJson); } catch { }
                    }

                    List<AiToolExecutionDto>? toolCalls = null;
                    if (!string.IsNullOrWhiteSpace(m.ToolCallsJson))
                    {
                        try { toolCalls = JsonSerializer.Deserialize<List<AiToolExecutionDto>>(m.ToolCallsJson); } catch { }
                    }

                    AiPendingActionDto? pendingAction = null;
                    if (!string.IsNullOrWhiteSpace(m.PendingActionJson))
                    {
                        try { pendingAction = JsonSerializer.Deserialize<AiPendingActionDto>(m.PendingActionJson); } catch { }
                    }

                    return new AiChatMessageDto
                    {
                        Id = m.Id,
                        Sender = m.Sender,
                        Content = m.Content,
                        VisualType = m.VisualType,
                        VisualData = visualData,
                        ToolCalls = toolCalls,
                        PendingAction = pendingAction,
                        IsActionExecuted = m.IsActionExecuted,
                        CreatedAt = m.CreatedAt
                    };
                }).ToList()
            };
        }

        public async Task<AiConversationSummaryDto> CreateConversationAsync(ClaimsPrincipal user, string? title)
        {
            var ctx = await BuildToolContextAsync(user);

            var conv = new AiConversation
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = ctx.UserId,
                UserRole = ctx.UserRole,
                Title = string.IsNullOrWhiteSpace(title) ? "New Conversation" : title.Trim(),
                SchoolId = ctx.SchoolId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.AiConversations.Add(conv);
            await _context.SaveChangesAsync();

            return new AiConversationSummaryDto
            {
                Id = conv.Id,
                Title = conv.Title,
                CreatedAt = conv.CreatedAt,
                UpdatedAt = conv.UpdatedAt,
                IsPinned = conv.IsPinned,
                MessageCount = 0
            };
        }

        public async Task<bool> RenameConversationAsync(ClaimsPrincipal user, string conversationId, string newTitle)
        {
            var ctx = await BuildToolContextAsync(user);
            var conv = await _context.AiConversations.FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == ctx.UserId && !c.IsDeleted);
            if (conv == null) return false;

            conv.Title = string.IsNullOrWhiteSpace(newTitle) ? "Untitled Conversation" : newTitle.Trim();
            conv.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteConversationAsync(ClaimsPrincipal user, string conversationId)
        {
            var ctx = await BuildToolContextAsync(user);
            var conv = await _context.AiConversations.FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == ctx.UserId);
            if (conv == null) return false;

            conv.IsDeleted = true;
            conv.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<AiChatResponseDto> SendChatMessageAsync(ClaimsPrincipal user, AiChatRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Message))
            {
                throw new ArgumentException("Message cannot be empty.");
            }

            var ctx = await BuildToolContextAsync(user);
            if (request.BranchId.HasValue) ctx.BranchId = request.BranchId.Value;
            if (request.AcademicYearId.HasValue) ctx.AcademicYearId = request.AcademicYearId.Value;

            AiConversation? conversation = null;
            if (!string.IsNullOrWhiteSpace(request.ConversationId))
            {
                conversation = await _context.AiConversations
                    .Include(c => c.Messages)
                    .FirstOrDefaultAsync(c => c.Id == request.ConversationId && c.UserId == ctx.UserId && !c.IsDeleted);
            }

            if (conversation == null)
            {
                // Auto-generate conversation title from the first 50 chars of the message
                var autoTitle = request.Message.Trim();
                if (autoTitle.Length > 40) autoTitle = autoTitle.Substring(0, 40) + "...";

                conversation = new AiConversation
                {
                    Id = Guid.NewGuid().ToString("N"),
                    UserId = ctx.UserId,
                    UserRole = ctx.UserRole,
                    Title = autoTitle,
                    SchoolId = ctx.SchoolId,
                    BranchId = ctx.BranchId,
                    AcademicYearId = ctx.AcademicYearId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.AiConversations.Add(conversation);
                await _context.SaveChangesAsync();
            }

            // Save user message
            var userMsg = new AiChatMessage
            {
                Id = Guid.NewGuid().ToString("N"),
                ConversationId = conversation.Id,
                Sender = "user",
                Content = request.Message.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _context.AiChatMessages.Add(userMsg);
            await _context.SaveChangesAsync();

            // Load context history
            var history = await _context.AiChatMessages
                .Where(m => m.ConversationId == conversation.Id && m.Id != userMsg.Id)
                .OrderBy(m => m.CreatedAt)
                .Take(10)
                .Select(m => new AiChatMessageDto
                {
                    Id = m.Id,
                    Sender = m.Sender,
                    Content = m.Content,
                    VisualType = m.VisualType,
                    CreatedAt = m.CreatedAt
                })
                .ToListAsync();

            var chatContext = new AiChatContext
            {
                ConversationId = conversation.Id,
                LatestUserMessage = request.Message.Trim(),
                History = history,
                ToolContext = ctx
            };

            // Filter allowed tools based on user's authenticated role
            var allowedTools = _tools.Where(t => t.AllowedRoles.Any(r => r.Equals(ctx.UserRole, StringComparison.OrdinalIgnoreCase) ||
                                                                          r.Equals("All", StringComparison.OrdinalIgnoreCase))).ToList();

            AiCompletionResult completion;
            // Attempt Gemini provider if configured; fallback to Deterministic Engine seamlessly
            if (_geminiProvider.IsConfigured)
            {
                try
                {
                    completion = await _geminiProvider.GenerateChatResponseAsync(chatContext, allowedTools);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"[AiService] Gemini provider invocation failed: {ex.Message}. Falling back to Deterministic AI Engine.");
                    completion = await _deterministicEngine.GenerateChatResponseAsync(chatContext, allowedTools);
                }
            }
            else
            {
                completion = await _deterministicEngine.GenerateChatResponseAsync(chatContext, allowedTools);
            }

            var toolExecutions = new List<AiToolExecutionDto>();
            string finalReply = completion.ReplyText;
            string? visualType = null;
            object? visualData = null;
            AiPendingActionDto? pendingAction = null;

            // Execute requested tools
            if (completion.HasToolCalls)
            {
                foreach (var toolCall in completion.ToolCallsRequested)
                {
                    var tool = allowedTools.FirstOrDefault(t => t.Name == toolCall.ToolName);
                    if (tool != null)
                    {
                        try
                        {
                            var toolResult = await tool.ExecuteAsync(ctx, toolCall.Arguments);
                            toolExecutions.Add(new AiToolExecutionDto
                            {
                                ToolName = tool.Name,
                                Description = tool.Description,
                                Success = toolResult.Success,
                                Summary = toolResult.Summary
                            });

                            if (toolResult.Success)
                            {
                                if (!string.IsNullOrWhiteSpace(toolResult.Summary))
                                {
                                    finalReply = toolResult.Summary;
                                }
                                if (!string.IsNullOrWhiteSpace(toolResult.VisualType))
                                {
                                    visualType = toolResult.VisualType;
                                    visualData = toolResult.VisualData ?? toolResult.Data;
                                }
                                if (toolResult.PendingAction != null)
                                {
                                    pendingAction = toolResult.PendingAction;
                                }
                            }
                            else if (!string.IsNullOrWhiteSpace(toolResult.ErrorMessage))
                            {
                                finalReply = $"⚠️ {toolResult.ErrorMessage}";
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"[AiService] Error executing tool '{toolCall.ToolName}'");
                            toolExecutions.Add(new AiToolExecutionDto
                            {
                                ToolName = tool.Name,
                                Description = tool.Description,
                                Success = false,
                                Summary = $"Tool execution error: {ex.Message}"
                            });
                        }
                    }
                }
            }

            // Save assistant message
            var assistantMsg = new AiChatMessage
            {
                Id = Guid.NewGuid().ToString("N"),
                ConversationId = conversation.Id,
                Sender = "assistant",
                Content = finalReply,
                ToolCallsJson = toolExecutions.Count > 0 ? JsonSerializer.Serialize(toolExecutions) : null,
                VisualType = visualType,
                VisualDataJson = visualData != null ? JsonSerializer.Serialize(visualData) : null,
                PendingActionJson = pendingAction != null ? JsonSerializer.Serialize(pendingAction) : null,
                IsActionExecuted = pendingAction != null ? false : null,
                CreatedAt = DateTime.UtcNow
            };

            _context.AiChatMessages.Add(assistantMsg);
            conversation.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new AiChatResponseDto
            {
                ConversationId = conversation.Id,
                MessageId = assistantMsg.Id,
                Reply = finalReply,
                VisualType = visualType,
                VisualData = visualData,
                ToolCallsExecuted = toolExecutions,
                PendingAction = pendingAction,
                Timestamp = assistantMsg.CreatedAt
            };
        }

        public async Task<AiActionConfirmationResponseDto> ConfirmActionAsync(ClaimsPrincipal user, AiActionConfirmationRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ConfirmationToken))
            {
                return new AiActionConfirmationResponseDto { Success = false, Message = "Confirmation token is required." };
            }

            var ctx = await BuildToolContextAsync(user);

            // Locate the message containing this pending action
            var msg = await _context.AiChatMessages
                .Include(m => m.Conversation)
                .FirstOrDefaultAsync(m => m.PendingActionJson != null &&
                                          m.PendingActionJson.Contains(request.ConfirmationToken) &&
                                          m.Conversation != null && m.Conversation.UserId == ctx.UserId);

            if (msg == null || string.IsNullOrWhiteSpace(msg.PendingActionJson))
            {
                return new AiActionConfirmationResponseDto { Success = false, Message = "Action token not found or already processed." };
            }

            if (msg.IsActionExecuted == true)
            {
                return new AiActionConfirmationResponseDto { Success = false, Message = "This action has already been executed." };
            }

            if (!request.Confirmed)
            {
                msg.IsActionExecuted = false;
                await _context.SaveChangesAsync();
                return new AiActionConfirmationResponseDto { Success = true, Message = "Action cancelled by user." };
            }

            var pending = JsonSerializer.Deserialize<AiPendingActionDto>(msg.PendingActionJson);
            if (pending == null)
            {
                return new AiActionConfirmationResponseDto { Success = false, Message = "Failed to deserialize pending action." };
            }

            if (pending.ExpiresAt < DateTime.UtcNow)
            {
                return new AiActionConfirmationResponseDto { Success = false, Message = "This action confirmation has expired. Please request the action again." };
            }

            // Execute the authorized write action
            if (pending.ActionType == "create_announcement")
            {
                // Revalidate authorization
                if (!ctx.UserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
                    !ctx.UserRole.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) &&
                    !ctx.UserRole.Equals("Super Admin", StringComparison.OrdinalIgnoreCase) &&
                    !ctx.UserRole.Equals("Principal", StringComparison.OrdinalIgnoreCase))
                {
                    return new AiActionConfirmationResponseDto { Success = false, Message = "Unauthorized: Insufficient privileges to publish announcements." };
                }

                var title = pending.Parameters.GetValueOrDefault("title")?.ToString() ?? "Announcement";
                var content = pending.Parameters.GetValueOrDefault("content")?.ToString() ?? "";
                var audience = pending.Parameters.GetValueOrDefault("audience")?.ToString() ?? "All";
                var category = pending.Parameters.GetValueOrDefault("category")?.ToString() ?? "GENERAL";

                var circular = new Circular
                {
                    Title = title,
                    Category = category,
                    TargetAudience = audience,
                    Content = content,
                    Author = ctx.UserName,
                    CreatedDate = DateTime.UtcNow
                };
                _context.Circulars.Add(circular);

                // Audit Log
                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = ctx.UserId,
                    UserName = ctx.UserName,
                    UserRole = ctx.UserRole,
                    Action = "AI_ANNOUNCEMENT_CREATED",
                    Details = $"Created announcement '{title}' for {audience} via AI Assistant.",
                    Timestamp = DateTime.UtcNow
                });

                msg.IsActionExecuted = true;
                await _context.SaveChangesAsync();

                return new AiActionConfirmationResponseDto
                {
                    Success = true,
                    Message = $"Announcement '{title}' has been successfully published to {audience}!",
                    ResultDetails = new { circular.CircularId, circular.Title, circular.CreatedDate }
                };
            }
            else if (pending.ActionType == "schedule_meeting")
            {
                var title = pending.Parameters.GetValueOrDefault("meetingTitle")?.ToString() ?? "Parent-Teacher Meeting";
                var dateStr = pending.Parameters.GetValueOrDefault("meetingDate")?.ToString() ?? DateTime.Today.ToString("yyyy-MM-dd");
                var timeStr = pending.Parameters.GetValueOrDefault("meetingTime")?.ToString() ?? "10:00 AM";
                var audience = pending.Parameters.GetValueOrDefault("audience")?.ToString() ?? "Parent";
                var mode = pending.Parameters.GetValueOrDefault("mode")?.ToString() ?? "In-Person";
                var agenda = pending.Parameters.GetValueOrDefault("agenda")?.ToString() ?? "";

                DateTime parsedDate = DateTime.TryParse(dateStr, out var d) ? d : DateTime.Today;

                var meeting = new Meeting
                {
                    MeetingTitle = title,
                    MeetingDate = parsedDate,
                    StartTime = timeStr,
                    EndTime = parsedDate.AddMinutes(45).ToString("HH:mm"),
                    MeetingAudience = audience,
                    MeetingMode = mode,
                    Agenda = agenda,
                    MeetingStatus = "SCHEDULED",
                    OrganizerName = ctx.UserName,
                    OrganizerRole = ctx.UserRole,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Meetings.Add(meeting);

                // Audit Log
                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = ctx.UserId,
                    UserName = ctx.UserName,
                    UserRole = ctx.UserRole,
                    Action = "AI_MEETING_SCHEDULED",
                    Details = $"Scheduled {mode} meeting '{title}' on {dateStr} at {timeStr} via AI Assistant.",
                    Timestamp = DateTime.UtcNow
                });

                msg.IsActionExecuted = true;
                await _context.SaveChangesAsync();

                return new AiActionConfirmationResponseDto
                {
                    Success = true,
                    Message = $"Meeting '{title}' has been scheduled successfully for {dateStr} at {timeStr}!",
                    ResultDetails = new { meeting.MeetingId, meeting.MeetingTitle, meeting.MeetingDate, meeting.StartTime }
                };
            }

            return new AiActionConfirmationResponseDto { Success = false, Message = $"Unknown action type '{pending.ActionType}'." };
        }

        public async Task<List<AiSuggestedPromptDto>> GetSuggestedPromptsAsync(ClaimsPrincipal user)
        {
            var ctx = await BuildToolContextAsync(user);
            var role = ctx.UserRole.ToLowerInvariant();

            if (role.Contains("parent"))
            {
                return new List<AiSuggestedPromptDto>
                {
                    new() { Category = "Fees", Prompt = "Show my child's pending fee", Description = "View outstanding fee balance, term payments and upcoming due dates.", Icon = "CreditCard" },
                    new() { Category = "Attendance", Prompt = "What is my child's attendance this month?", Description = "Check monthly attendance percentage, present days and leaves.", Icon = "CalendarCheck" },
                    new() { Category = "Exams", Prompt = "Show my child's latest exam results and report card", Description = "View subject-wise marks, percentage, and overall grade.", Icon = "Award" },
                    new() { Category = "Transport", Prompt = "What is my child's bus number and pickup timing?", Description = "View assigned school bus, route, and driver contact info.", Icon = "Bus" },
                    new() { Category = "Timetable", Prompt = "Show my child's class timetable for today", Description = "Check daily class schedule and subject periods.", Icon = "Clock" }
                };
            }

            if (role.Contains("student"))
            {
                return new List<AiSuggestedPromptDto>
                {
                    new() { Category = "Timetable", Prompt = "Show my class timetable today", Description = "View your period schedule, subjects, and room numbers.", Icon = "Clock" },
                    new() { Category = "Exams", Prompt = "When is my next examination schedule?", Description = "Check upcoming exam dates and subjects.", Icon = "FileText" },
                    new() { Category = "Library", Prompt = "Are there any books currently issued to me?", Description = "Check issued library books and due return dates.", Icon = "BookOpen" },
                    new() { Category = "Attendance", Prompt = "What is my overall attendance percentage?", Description = "Review your attendance record and leaves.", Icon = "CalendarCheck" },
                    new() { Category = "Fees", Prompt = "Check my fee payment dues and receipts", Description = "Inspect pending fee amounts and payment history.", Icon = "CreditCard" }
                };
            }

            if (role.Contains("teacher"))
            {
                return new List<AiSuggestedPromptDto>
                {
                    new() { Category = "Attendance", Prompt = "How many students are absent today in my assigned classes?", Description = "Get real-time absentee list with names and roll numbers.", Icon = "Users" },
                    new() { Category = "Timetable", Prompt = "Show my teaching schedule for today", Description = "View your periods, assigned classes, and free slots.", Icon = "Clock" },
                    new() { Category = "Exams", Prompt = "Show exam marks entry status for my class", Description = "Check pending marks entry and student scores.", Icon = "Award" },
                    new() { Category = "Meetings", Prompt = "Schedule a parent-teacher meeting for next week", Description = "Prepare a PTM schedule and send notifications.", Icon = "Calendar" },
                    new() { Category = "Students", Prompt = "Search student records in my class", Description = "Lookup student academic profiles and parent contacts.", Icon = "Search" }
                };
            }

            if (role.Contains("driver"))
            {
                return new List<AiSuggestedPromptDto>
                {
                    new() { Category = "Transport", Prompt = "Show my assigned bus route and pickup stops", Description = "View scheduled stops, pickup timings, and route sequence.", Icon = "Bus" },
                    new() { Category = "Students", Prompt = "List students assigned to my bus route", Description = "Check the passenger roster and pickup points.", Icon = "Users" }
                };
            }

            if (role.Contains("librarian"))
            {
                return new List<AiSuggestedPromptDto>
                {
                    new() { Category = "Library", Prompt = "Show all overdue library books", Description = "List books past their return due date and borrower details.", Icon = "AlertTriangle" },
                    new() { Category = "Inventory", Prompt = "Check stock availability for science textbooks", Description = "Check available copies and shelf locations.", Icon = "BookOpen" }
                };
            }

            if (role.Contains("accountant") || role.Contains("finance"))
            {
                return new List<AiSuggestedPromptDto>
                {
                    new() { Category = "Finance", Prompt = "What is the total fee collection this academic year?", Description = "View collection totals, expected revenue, and recovery rate.", Icon = "DollarSign" },
                    new() { Category = "Dues", Prompt = "Show overdue fee summary across all classes", Description = "List total pending dues and overdue student balances.", Icon = "AlertCircle" },
                    new() { Category = "Student Fee", Prompt = "Show student fee profile by roll number", Description = "Inspect individual student fee ledger and receipts.", Icon = "FileText" }
                };
            }

            // Default Administrator & Principal Prompts
            return new List<AiSuggestedPromptDto>
            {
                new() { Category = "Attendance", Prompt = "How many students are absent today?", Description = "Get school-wide absentee count, percentages, and absentee list.", Icon = "Users" },
                new() { Category = "Attendance", Prompt = "Which class has the highest attendance today?", Description = "Compare attendance rates across all classes with rankings.", Icon = "BarChart2" },
                new() { Category = "Finance", Prompt = "What is the total fee collection and pending dues?", Description = "Review total collections, expected fees, and recovery rates.", Icon = "DollarSign" },
                new() { Category = "Operations", Prompt = "Create a school announcement for upcoming annual day", Description = "Draft and broadcast an authorized circular to parents and staff.", Icon = "Megaphone" },
                new() { Category = "Staff", Prompt = "Show directory of mathematics and science faculty", Description = "List teachers, designations, and departmental assignments.", Icon = "Briefcase" },
                new() { Category = "Transport", Prompt = "Show school bus fleet and route overview", Description = "Review active buses, drivers, and pickup points.", Icon = "Bus" },
                new() { Category = "Exams", Prompt = "Show upcoming examination date sheet", Description = "Inspect exam timetable, subjects, and hall allocations.", Icon = "Award" }
            };
        }
    }
}
