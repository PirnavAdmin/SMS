namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/chat")]
[Authorize]
[Tags("Direct Chat & Messaging Hub")]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _context;
    private static bool _tableEnsured = false;
    private static readonly object _tableLock = new();

    public ChatController(AppDbContext context)
    {
        _context = context;
        EnsureTableCreated();
    }

    private void EnsureTableCreated()
    {
        if (_tableEnsured) return;
        lock (_tableLock)
        {
            if (_tableEnsured) return;
            try
            {
                _context.Database.ExecuteSqlRaw(@"
                    CREATE TABLE IF NOT EXISTS `direct_chat_messages` (
                        `message_id` int NOT NULL AUTO_INCREMENT,
                        `TenantId` varchar(64) NULL,
                        `sender_id` varchar(100) NOT NULL,
                        `sender_name` varchar(150) NOT NULL,
                        `sender_role` varchar(50) NOT NULL,
                        `sender_class` varchar(50) NULL,
                        `receiver_id` varchar(100) NOT NULL,
                        `receiver_name` varchar(150) NOT NULL,
                        `receiver_role` varchar(50) NOT NULL,
                        `receiver_class` varchar(50) NULL,
                        `message_text` text NOT NULL,
                        `attachment_url` varchar(500) NULL,
                        `attachment_name` varchar(255) NULL,
                        `attachment_type` varchar(100) NULL,
                        `call_type` varchar(30) NULL,
                        `call_meeting_url` varchar(500) NULL,
                        `is_read` tinyint(1) NOT NULL DEFAULT 0,
                        `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (`message_id`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
                _tableEnsured = true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChatController] Table ensure notice: {ex.Message}");
            }
        }
    }

    // Helper to resolve current authenticated user details
    private (string UserId, string UserName, string UserRole, string UserEmail) GetCurrentUserInfo()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("id")?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("UserId")?.Value
            ?? string.Empty;

        var userName = User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst("name")?.Value
            ?? "User";

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value
            ?? User.FindFirst("role")?.Value
            ?? "Student";

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value
            ?? string.Empty;

        return (userId, userName, userRole, userEmail);
    }

    // =========================================================
    // 1. GET CONTACTS
    // Business Rule:
    // "students can message or call to that class students only not everyone and can msg to any teacher"
    // =========================================================
    [HttpGet("contacts")]
    public async Task<IActionResult> GetContacts()
    {
        var (userId, userName, userRole, userEmail) = GetCurrentUserInfo();
        var isStudent = string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase) || User.IsInRole("Student");
        var isParent = string.Equals(userRole, "Parent", StringComparison.OrdinalIgnoreCase) || User.IsInRole("Parent");
        var isTeacher = string.Equals(userRole, "Teacher", StringComparison.OrdinalIgnoreCase) || User.IsInRole("Teacher");

        var contacts = new List<ChatContactDto>();

        // 1. Identify enrolled class if current user is Student
        int? studentClassId = null;
        string? studentClassName = null;
        string? studentSection = null;
        int? currentStudentDbId = null;

        if (isStudent)
        {
            int parsedUserId = 0;
            bool hasNumericUserId = int.TryParse(userId, out parsedUserId);

            // Search in students table
            var student = await _context.Students
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => 
                    (hasNumericUserId && s.StudentId == parsedUserId) ||
                    (!string.IsNullOrEmpty(userEmail) && s.Email != null && s.Email.ToLower() == userEmail.ToLower()) ||
                    s.AdmissionNumber.ToLower() == userId.ToLower());

            if (student != null)
            {
                currentStudentDbId = student.StudentId;
                studentClassId = student.ClassId;
                studentClassName = student.ClassGrade?.ClassName ?? $"Class {student.ClassId}";
                studentSection = student.ClassSection?.SectionName ?? string.Empty;
            }
            else
            {
                // Fallback search in Admissions table
                var adm = await _context.Admissions.AsNoTracking()
                    .FirstOrDefaultAsync(a => 
                        (hasNumericUserId && a.AdmissionId == (long)parsedUserId) ||
                        (a.ApplicationNo != null && a.ApplicationNo.ToLower() == userId.ToLower()));

                if (adm != null)
                {
                    studentClassId = adm.ClassId;
                    studentSection = adm.SectionLetter ?? string.Empty;
                }
            }
        }

        // 2. Fetch TEACHERS (available to ANY student, parent, or colleague)
        var teachersQuery = _context.Staff.AsNoTracking()
            .Where(s => s.EmployeeCategory == "Teaching Staff" || s.SystemRole == "Teacher" || s.Designation != null && s.Designation.Contains("Teacher"));

        var teachers = await teachersQuery.Take(100).ToListAsync();
        foreach (var t in teachers)
        {
            var tId = $"TEA-{t.StaffId}";
            contacts.Add(new ChatContactDto
            {
                Id = tId,
                Name = $"{t.FirstName} {t.LastName}".Trim(),
                Role = "teacher",
                Email = t.Email,
                Phone = t.Phone,
                Subject = t.PrimarySubject ?? t.Department ?? "Academics",
                Designation = t.Designation ?? "Subject Teacher",
                IsOnline = true
            });
        }

        // 3. Fetch CLASSMATES if user is Student
        // STRICT RULE: PARTICULAR CLASS STUDENTS ONLY!
        if (isStudent)
        {
            IQueryable<Student> peersQuery = _context.Students
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .AsNoTracking();

            if (studentClassId.HasValue && studentClassId.Value > 0)
            {
                peersQuery = peersQuery.Where(s => s.ClassId == studentClassId.Value);
            }
            else if (!string.IsNullOrEmpty(studentClassName))
            {
                peersQuery = peersQuery.Where(s => s.ClassGrade != null && s.ClassGrade.ClassName == studentClassName);
            }

            if (currentStudentDbId.HasValue)
            {
                peersQuery = peersQuery.Where(s => s.StudentId != currentStudentDbId.Value);
            }

            var classmates = await peersQuery.Take(100).ToListAsync();
            foreach (var c in classmates)
            {
                var cleanClass = c.ClassGrade?.ClassName ?? studentClassName ?? "Class";
                var cleanSec = c.ClassSection?.SectionName ?? c.RollNumber ?? string.Empty;
                contacts.Add(new ChatContactDto
                {
                    Id = $"STU-{c.StudentId}",
                    Name = c.StudentName,
                    Role = "student",
                    ClassName = cleanClass,
                    Section = cleanSec,
                    AdmissionNo = c.AdmissionNumber,
                    IsOnline = true
                });
            }
        }
        else if (isTeacher)
        {
            // Teachers can message students across their classes
            var studentsList = await _context.Students
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .AsNoTracking()
                .Take(100)
                .ToListAsync();

            foreach (var s in studentsList)
            {
                contacts.Add(new ChatContactDto
                {
                    Id = $"STU-{s.StudentId}",
                    Name = s.StudentName,
                    Role = "student",
                    ClassName = s.ClassGrade?.ClassName ?? "Class",
                    Section = s.ClassSection?.SectionName ?? "",
                    AdmissionNo = s.AdmissionNumber,
                    IsOnline = true
                });

                // Also add parent option
                if (!string.IsNullOrEmpty(s.FatherName) || !string.IsNullOrEmpty(s.MotherName))
                {
                    var pName = !string.IsNullOrEmpty(s.FatherName) ? s.FatherName : s.MotherName;
                    contacts.Add(new ChatContactDto
                    {
                        Id = $"PAR-{s.StudentId}",
                        Name = $"{pName} (Parent of {s.StudentName})",
                        Role = "parent",
                        ClassName = s.ClassGrade?.ClassName,
                        AdmissionNo = s.AdmissionNumber,
                        Phone = s.FatherMobile ?? s.MotherMobile,
                        IsOnline = false
                    });
                }
            }
        }

        // 4. Populate latest messages and unread counts for each contact
        var effectiveMyId = isStudent && currentStudentDbId.HasValue ? $"STU-{currentStudentDbId.Value}" : userId;

        var messageHistory = await _context.DirectChatMessages
            .AsNoTracking()
            .Where(m => m.SenderId == effectiveMyId || m.ReceiverId == effectiveMyId || m.SenderId == userId || m.ReceiverId == userId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        foreach (var contact in contacts)
        {
            var lastMsg = messageHistory.FirstOrDefault(m => 
                (m.SenderId == contact.Id && (m.ReceiverId == effectiveMyId || m.ReceiverId == userId)) ||
                (m.ReceiverId == contact.Id && (m.SenderId == effectiveMyId || m.SenderId == userId)));

            if (lastMsg != null)
            {
                contact.LastMessage = lastMsg.MessageText;
                contact.LastMessageTime = lastMsg.CreatedAt.ToLocalTime().ToString("hh:mm tt");
            }

            contact.UnreadCount = messageHistory.Count(m => 
                m.SenderId == contact.Id && 
                (m.ReceiverId == effectiveMyId || m.ReceiverId == userId) && 
                !m.IsRead);
        }

        return Ok(new
        {
            success = true,
            currentUser = new
            {
                id = effectiveMyId,
                name = userName,
                role = userRole,
                className = studentClassName,
                section = studentSection
            },
            data = contacts
        });
    }

    // =========================================================
    // 2. GET MESSAGES BETWEEN CURRENT USER & CONTACT
    // =========================================================
    [HttpGet("messages")]
    public async Task<IActionResult> GetMessages([FromQuery] string contactId)
    {
        if (string.IsNullOrWhiteSpace(contactId))
        {
            return BadRequest(new { success = false, message = "contactId parameter is required." });
        }

        var (userId, userName, userRole, _) = GetCurrentUserInfo();
        var effectiveMyId = userId;

        // If student, check if they use STU- format
        if (string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            int.TryParse(userId, out int parsedUid);
            var st = await _context.Students.AsNoTracking().FirstOrDefaultAsync(s => 
                (parsedUid > 0 && s.StudentId == parsedUid) || s.AdmissionNumber == userId);
            if (st != null)
            {
                effectiveMyId = $"STU-{st.StudentId}";
            }
        }

        var query = _context.DirectChatMessages
            .Where(m => 
                ((m.SenderId == effectiveMyId || m.SenderId == userId) && m.ReceiverId == contactId) ||
                (m.SenderId == contactId && (m.ReceiverId == effectiveMyId || m.ReceiverId == userId)));

        var rawList = await query.OrderBy(m => m.CreatedAt).ToListAsync();

        // Mark incoming messages as read
        bool hasUnread = false;
        foreach (var m in rawList)
        {
            if ((m.ReceiverId == effectiveMyId || m.ReceiverId == userId) && !m.IsRead)
            {
                m.IsRead = true;
                hasUnread = true;
            }
        }

        if (hasUnread)
        {
            await _context.SaveChangesAsync();
        }

        var dtoList = rawList.Select(m => new ChatMessageDto
        {
            Id = m.MessageId,
            SenderId = m.SenderId,
            SenderName = m.SenderName,
            SenderRole = m.SenderRole,
            SenderClass = m.SenderClass,
            ReceiverId = m.ReceiverId,
            ReceiverName = m.ReceiverName,
            ReceiverRole = m.ReceiverRole,
            ReceiverClass = m.ReceiverClass,
            Text = m.MessageText,
            Timestamp = m.CreatedAt.ToLocalTime().ToString("hh:mm tt"),
            CreatedAt = m.CreatedAt,
            IsRead = m.IsRead,
            AttachmentUrl = m.AttachmentUrl,
            AttachmentName = m.AttachmentName,
            AttachmentType = m.AttachmentType,
            CallType = m.CallType,
            CallMeetingUrl = m.CallMeetingUrl,
            IsOutgoing = (m.SenderId == effectiveMyId || m.SenderId == userId)
        }).ToList();

        return Ok(new
        {
            success = true,
            contactId,
            data = dtoList
        });
    }

    // =========================================================
    // 3. SEND DIRECT MESSAGE
    // Enforces class boundary rule for students
    // =========================================================
    [HttpPost("messages")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.ReceiverId))
        {
            return BadRequest(new { success = false, message = "Receiver ID is required." });
        }

        if (string.IsNullOrWhiteSpace(dto.MessageText) && string.IsNullOrWhiteSpace(dto.AttachmentUrl))
        {
            return BadRequest(new { success = false, message = "Message text or attachment is required." });
        }

        var (userId, userName, userRole, userEmail) = GetCurrentUserInfo();
        var isStudent = string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase) || User.IsInRole("Student");

        string effectiveSenderId = userId;
        string? senderClassName = null;
        int? senderClassId = null;

        if (isStudent)
        {
            int.TryParse(userId, out int parsedSenderId);
            var senderStudent = await _context.Students
                .Include(s => s.ClassGrade)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => 
                    (parsedSenderId > 0 && s.StudentId == parsedSenderId) || 
                    s.AdmissionNumber.ToLower() == userId.ToLower() ||
                    (!string.IsNullOrEmpty(userEmail) && s.Email != null && s.Email.ToLower() == userEmail.ToLower()));

            if (senderStudent != null)
            {
                effectiveSenderId = $"STU-{senderStudent.StudentId}";
                senderClassId = senderStudent.ClassId;
                senderClassName = senderStudent.ClassGrade?.ClassName ?? $"Class {senderStudent.ClassId}";
            }

            // CHECK RECEIVER RULE:
            // "particular class students can message or call to that class students only not everyone and can msg to any teacher"
            bool isReceiverStudent = dto.ReceiverId.StartsWith("STU-", StringComparison.OrdinalIgnoreCase) ||
                                     string.Equals(dto.ReceiverRole, "Student", StringComparison.OrdinalIgnoreCase);

            if (isReceiverStudent)
            {
                // Extract receiver student ID
                string rawId = dto.ReceiverId.Replace("STU-", "", StringComparison.OrdinalIgnoreCase);
                int.TryParse(rawId, out int parsedReceiverId);
                var receiverStudent = await _context.Students
                    .Include(s => s.ClassGrade)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => (parsedReceiverId > 0 && s.StudentId == parsedReceiverId) || s.AdmissionNumber == rawId);

                if (receiverStudent != null)
                {
                    // Strict Class Validation
                    if (senderClassId.HasValue && receiverStudent.ClassId != senderClassId.Value)
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new
                        {
                            success = false,
                            message = $"Access Denied: You can only message students in your enrolled class ({senderClassName}). Messaging students from other classes is restricted."
                        });
                    }
                }
            }
        }

        var message = new DirectChatMessage
        {
            SenderId = effectiveSenderId,
            SenderName = userName,
            SenderRole = userRole,
            SenderClass = senderClassName,
            ReceiverId = dto.ReceiverId,
            ReceiverName = dto.ReceiverName ?? "User",
            ReceiverRole = dto.ReceiverRole ?? "User",
            MessageText = dto.MessageText?.Trim() ?? string.Empty,
            AttachmentUrl = dto.AttachmentUrl,
            AttachmentName = dto.AttachmentName,
            AttachmentType = dto.AttachmentType,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.DirectChatMessages.AddAsync(message);
        await _context.SaveChangesAsync();

        var responseDto = new ChatMessageDto
        {
            Id = message.MessageId,
            SenderId = message.SenderId,
            SenderName = message.SenderName,
            SenderRole = message.SenderRole,
            SenderClass = message.SenderClass,
            ReceiverId = message.ReceiverId,
            ReceiverName = message.ReceiverName,
            ReceiverRole = message.ReceiverRole,
            ReceiverClass = message.ReceiverClass,
            Text = message.MessageText,
            Timestamp = message.CreatedAt.ToLocalTime().ToString("hh:mm tt"),
            CreatedAt = message.CreatedAt,
            IsRead = message.IsRead,
            AttachmentUrl = message.AttachmentUrl,
            AttachmentName = message.AttachmentName,
            AttachmentType = message.AttachmentType,
            CallType = message.CallType,
            CallMeetingUrl = message.CallMeetingUrl,
            IsOutgoing = true
        };

        return Ok(new
        {
            success = true,
            message = "Message sent successfully.",
            data = responseDto
        });
    }

    // =========================================================
    // 4. INITIATE DIRECT CALL (VIDEO / AUDIO)
    // Enforces class boundary rule for students
    // =========================================================
    [HttpPost("call")]
    public async Task<IActionResult> InitiateCall([FromBody] InitiateCallDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.ReceiverId))
        {
            return BadRequest(new { success = false, message = "Receiver ID is required to initiate call." });
        }

        var (userId, userName, userRole, userEmail) = GetCurrentUserInfo();
        var isStudent = string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase) || User.IsInRole("Student");

        string effectiveSenderId = userId;
        string? senderClassName = null;
        int? senderClassId = null;

        if (isStudent)
        {
            int.TryParse(userId, out int parsedSenderId);
            var senderStudent = await _context.Students
                .Include(s => s.ClassGrade)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => 
                    (parsedSenderId > 0 && s.StudentId == parsedSenderId) || 
                    s.AdmissionNumber.ToLower() == userId.ToLower() ||
                    (!string.IsNullOrEmpty(userEmail) && s.Email != null && s.Email.ToLower() == userEmail.ToLower()));

            if (senderStudent != null)
            {
                effectiveSenderId = $"STU-{senderStudent.StudentId}";
                senderClassId = senderStudent.ClassId;
                senderClassName = senderStudent.ClassGrade?.ClassName ?? $"Class {senderStudent.ClassId}";
            }

            // CHECK RECEIVER RULE FOR CALLS
            bool isReceiverStudent = dto.ReceiverId.StartsWith("STU-", StringComparison.OrdinalIgnoreCase) ||
                                     string.Equals(dto.ReceiverRole, "Student", StringComparison.OrdinalIgnoreCase);

            if (isReceiverStudent)
            {
                string rawId = dto.ReceiverId.Replace("STU-", "", StringComparison.OrdinalIgnoreCase);
                int.TryParse(rawId, out int parsedReceiverId);
                var receiverStudent = await _context.Students
                    .Include(s => s.ClassGrade)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => (parsedReceiverId > 0 && s.StudentId == parsedReceiverId) || s.AdmissionNumber == rawId);

                if (receiverStudent != null && senderClassId.HasValue && receiverStudent.ClassId != senderClassId.Value)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new
                    {
                        success = false,
                        message = $"Access Denied: You can only video call classmates in your own class ({senderClassName})."
                    });
                }
            }
        }

        // Generate clean, secure Jitsi Room Link
        var roomCode = $"SMS-{Guid.NewGuid():N}";
        var callMeetingUrl = $"https://meet.jit.si/{roomCode}";

        // Save invitation record in chat
        var callMessage = new DirectChatMessage
        {
            SenderId = effectiveSenderId,
            SenderName = userName,
            SenderRole = userRole,
            SenderClass = senderClassName,
            ReceiverId = dto.ReceiverId,
            ReceiverName = dto.ReceiverName ?? "Contact",
            ReceiverRole = dto.ReceiverRole ?? "User",
            MessageText = $"Started an instant {dto.CallType} call meeting. Click 'Join Video Call' below to connect.",
            CallType = dto.CallType ?? "video",
            CallMeetingUrl = callMeetingUrl,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _context.DirectChatMessages.AddAsync(callMessage);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            meetingUrl = callMeetingUrl,
            callType = dto.CallType ?? "video",
            message = "Call room generated successfully.",
            chatMessage = new ChatMessageDto
            {
                Id = callMessage.MessageId,
                SenderId = callMessage.SenderId,
                SenderName = callMessage.SenderName,
                SenderRole = callMessage.SenderRole,
                ReceiverId = callMessage.ReceiverId,
                ReceiverName = callMessage.ReceiverName,
                ReceiverRole = callMessage.ReceiverRole,
                Text = callMessage.MessageText,
                CallType = callMessage.CallType,
                CallMeetingUrl = callMessage.CallMeetingUrl,
                Timestamp = callMessage.CreatedAt.ToLocalTime().ToString("hh:mm tt"),
                CreatedAt = callMessage.CreatedAt,
                IsOutgoing = true
            }
        });
    }

    // =========================================================
    // 5. UNREAD MESSAGES COUNT
    // =========================================================
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var (userId, _, userRole, userEmail) = GetCurrentUserInfo();
        var effectiveMyId = userId;

        if (string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            int.TryParse(userId, out int parsedUid);
            var st = await _context.Students.AsNoTracking().FirstOrDefaultAsync(s => 
                (parsedUid > 0 && s.StudentId == parsedUid) || 
                s.AdmissionNumber.ToLower() == userId.ToLower() ||
                (!string.IsNullOrEmpty(userEmail) && s.Email != null && s.Email.ToLower() == userEmail.ToLower()));
            if (st != null)
            {
                effectiveMyId = $"STU-{st.StudentId}";
            }
        }

        var count = await _context.DirectChatMessages
            .CountAsync(m => (m.ReceiverId == effectiveMyId || m.ReceiverId == userId) && !m.IsRead);

        return Ok(new
        {
            success = true,
            unreadCount = count
        });
    }
}
