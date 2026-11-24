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
            ?? Request.Headers["X-User-Id"].FirstOrDefault()
            ?? string.Empty;

        var userName = User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst("name")?.Value
            ?? User.FindFirst("unique_name")?.Value
            ?? "User";

        var userRole = Request.Headers["X-User-Role"].FirstOrDefault()
            ?? Request.Headers["User-Role"].FirstOrDefault()
            ?? User.FindFirst(ClaimTypes.Role)?.Value
            ?? User.FindFirst("role")?.Value
            ?? string.Empty;

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value
            ?? string.Empty;

        return (userId, userName, userRole, userEmail);
    }

    // Helper to deeply resolve caller identity, database records, and all matching IDs
    private async Task<(string UserId, string UserName, string UserRole, string UserEmail, Staff? StaffUser, Student? StudentUser, HashSet<string> MyIds, string EffectiveId)> ResolveCurrentEntityAsync()
    {
        var (userId, userName, userRole, userEmail) = GetCurrentUserInfo();
        int.TryParse(userId, out int parsedUserId);

        var myIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrEmpty(userId)) myIds.Add(userId);
        if (!string.IsNullOrEmpty(userEmail)) myIds.Add(userEmail);

        // 1. Look up Staff table (by staffId, employeeId, email, or full name)
        Staff? staffUser = null;
        if (parsedUserId > 0 || !string.IsNullOrEmpty(userEmail) || (!string.IsNullOrEmpty(userName) && userName != "User"))
        {
            staffUser = await _context.Staff.AsNoTracking().FirstOrDefaultAsync(s => 
                (parsedUserId > 0 && s.StaffId == parsedUserId) ||
                (!string.IsNullOrEmpty(userEmail) && s.Email != null && s.Email.ToLower() == userEmail.ToLower()) ||
                (!string.IsNullOrEmpty(userId) && s.EmployeeId != null && s.EmployeeId.ToLower() == userId.ToLower()) ||
                (!string.IsNullOrEmpty(userName) && userName != "User" && (s.FirstName + " " + s.LastName).Trim().ToLower() == userName.ToLower()));
        }

        // 2. Check Admin role
        bool isAdmin = userRole.Contains("Admin", StringComparison.OrdinalIgnoreCase) || 
                      User.IsInRole("Admin") || 
                      User.IsInRole("SuperAdmin");

        // 3. Look up Student if explicitly indicated or not staff/admin
        bool isExplicitStudent = string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase) || User.IsInRole("Student");
        Student? studentUser = null;

        if ((isExplicitStudent || (staffUser == null && !isAdmin)) && staffUser == null)
        {
            studentUser = await _context.Students
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => 
                    (parsedUserId > 0 && s.StudentId == parsedUserId) ||
                    (!string.IsNullOrEmpty(userEmail) && s.Email != null && s.Email.ToLower() == userEmail.ToLower()) ||
                    (!string.IsNullOrEmpty(userId) && s.AdmissionNumber.ToLower() == userId.ToLower()) ||
                    (!string.IsNullOrEmpty(userName) && userName != "User" && s.StudentName.ToLower() == userName.ToLower()));
        }

        string effectiveId = userId;
        string resolvedRole = userRole;

        if (staffUser != null)
        {
            effectiveId = $"TEA-{staffUser.StaffId}";
            myIds.Add(effectiveId);
            myIds.Add(staffUser.StaffId.ToString());
            if (!string.IsNullOrEmpty(staffUser.EmployeeId)) myIds.Add(staffUser.EmployeeId);
            if (!string.IsNullOrEmpty(staffUser.Phone)) myIds.Add(staffUser.Phone);
            userName = $"{staffUser.FirstName} {staffUser.LastName}".Trim();
            resolvedRole = "teacher";
        }
        else if (studentUser != null)
        {
            effectiveId = $"STU-{studentUser.StudentId}";
            myIds.Add(effectiveId);
            myIds.Add(studentUser.StudentId.ToString());
            if (!string.IsNullOrEmpty(studentUser.AdmissionNumber)) myIds.Add(studentUser.AdmissionNumber);
            if (!string.IsNullOrEmpty(studentUser.RollNumber)) myIds.Add(studentUser.RollNumber);
            userName = studentUser.StudentName;
            resolvedRole = "student";
        }
        else if (isAdmin)
        {
            resolvedRole = "admin";
        }

        return (userId, userName, resolvedRole, userEmail, staffUser, studentUser, myIds, effectiveId);
    }

    // =========================================================
    // 1. GET CONTACTS
    // Business Rule:
    // "students can message or call to that class students only not everyone and can msg to any teacher"
    // Teachers/Staff/Admins can message all students, parents, and colleagues, and filter by class & staff category.
    // =========================================================
    [HttpGet("contacts")]
    public async Task<IActionResult> GetContacts([FromQuery] string? classFilter = null, [FromQuery] string? staffCategory = null)
    {
        var (userId, userName, userRole, userEmail, staffUser, studentUser, myIds, effectiveMyId) = await ResolveCurrentEntityAsync();
        bool isStudent = studentUser != null || (string.Equals(userRole, "student", StringComparison.OrdinalIgnoreCase) && staffUser == null);

        var contacts = new List<ChatContactDto>();

        // Load class dictionary for quick lookup of class names by ID
        var classLookup = await _context.Classes.AsNoTracking()
            .ToDictionaryAsync(c => c.ClassId, c => c.ClassName);

        // Load dynamic class list directly from Classes table (ordered by display order or class name)
        var dynamicClasses = await _context.Classes.AsNoTracking()
            .Where(c => c.Status == "Active" || string.IsNullOrEmpty(c.Status))
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.ClassName)
            .Select(c => c.ClassName)
            .Where(cn => !string.IsNullOrEmpty(cn))
            .Distinct()
            .ToListAsync();

        // 1. TEACHERS & STAFF (available to ANY student, parent, or colleague)
        var staffQuery = _context.Staff.AsNoTracking().Where(s => s.IsActive != false);
        var staffList = await staffQuery.Take(250).ToListAsync();
        foreach (var t in staffList)
        {
            // Do not show the current user to themselves
            if (staffUser != null && t.StaffId == staffUser.StaffId) continue;
            if (myIds.Contains(t.StaffId.ToString()) || (!string.IsNullOrEmpty(t.EmployeeId) && myIds.Contains(t.EmployeeId))) continue;

            string resolvedStaffCategory = "Teaching Staff";
            if (!string.IsNullOrWhiteSpace(t.EmployeeCategory))
            {
                resolvedStaffCategory = t.EmployeeCategory.Contains("Non-Teaching", StringComparison.OrdinalIgnoreCase)
                    ? "Non-Teaching Staff"
                    : "Teaching Staff";
            }
            else
            {
                var des = (t.Designation ?? "").ToLower();
                var dep = (t.Department ?? "").ToLower();
                var sRole = (t.SystemRole ?? "").ToLower();

                if (des.Contains("account") || des.Contains("librar") || des.Contains("clerk") || 
                    des.Contains("driver") || des.Contains("warden") || des.Contains("peon") || 
                    des.Contains("security") || des.Contains("admin") || des.Contains("reception") ||
                    des.Contains("office") || des.Contains("bus") || des.Contains("nurse") ||
                    dep.Contains("admin") || dep.Contains("account") || dep.Contains("transport") ||
                    dep.Contains("hostel") || dep.Contains("library") ||
                    sRole.Contains("driver") || sRole.Contains("accountant") || sRole.Contains("librarian"))
                {
                    resolvedStaffCategory = "Non-Teaching Staff";
                }
                else
                {
                    resolvedStaffCategory = "Teaching Staff";
                }
            }

            // Optional staffCategory query filter
            if (!string.IsNullOrWhiteSpace(staffCategory) && !staffCategory.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                if (staffCategory.Contains("Non-Teaching", StringComparison.OrdinalIgnoreCase) && resolvedStaffCategory != "Non-Teaching Staff")
                    continue;
                if (!staffCategory.Contains("Non-Teaching", StringComparison.OrdinalIgnoreCase) && resolvedStaffCategory != "Teaching Staff")
                    continue;
            }

            contacts.Add(new ChatContactDto
            {
                Id = $"TEA-{t.StaffId}",
                Name = $"{t.FirstName} {t.LastName}".Trim(),
                Role = "teacher",
                StaffCategory = resolvedStaffCategory,
                Department = t.Department,
                Email = t.Email,
                Phone = t.Phone,
                Subject = t.PrimarySubject ?? t.Department ?? (resolvedStaffCategory == "Teaching Staff" ? "Academics" : "Administration"),
                Designation = t.Designation ?? (t.SystemRole ?? (resolvedStaffCategory == "Teaching Staff" ? "Faculty Teacher" : "Staff Member")),
                IsOnline = true
            });
        }

        // 2. CLASSMATES FOR STUDENTS
        // STRICT RULE: PARTICULAR CLASS STUDENTS ONLY!
        if (isStudent && studentUser != null)
        {
            int? studentClassId = studentUser.ClassId;
            string? studentClassName = studentUser.ClassGrade?.ClassName ?? 
                (studentClassId.HasValue && classLookup.TryGetValue(studentClassId.Value, out var cn) ? cn : $"Class {studentClassId}");
            string? studentSection = studentUser.ClassSection?.SectionName ?? string.Empty;

            var peersQuery = _context.Students
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .AsNoTracking()
                .Where(s => !s.IsDeleted && s.StudentId != studentUser.StudentId);

            if (studentClassId.HasValue && studentClassId.Value > 0)
            {
                peersQuery = peersQuery.Where(s => s.ClassId == studentClassId.Value);
            }
            else if (!string.IsNullOrEmpty(studentClassName))
            {
                peersQuery = peersQuery.Where(s => s.ClassGrade != null && s.ClassGrade.ClassName == studentClassName);
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
        else
        {
            // 3. TEACHER, ADMIN, OR STAFF: FULL ACCESS TO STUDENTS & PARENTS WITH CLASS FILTERING
            var addedAdmissionNos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var studentsQuery = _context.Students
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .AsNoTracking()
                .Where(s => !s.IsDeleted);

            if (!string.IsNullOrWhiteSpace(classFilter) && !classFilter.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var cf = classFilter.Trim().ToLower();
                studentsQuery = studentsQuery.Where(s => 
                    (s.ClassGrade != null && s.ClassGrade.ClassName != null && s.ClassGrade.ClassName.ToLower().Contains(cf)) ||
                    (s.ClassId.ToString() == cf));
            }

            var studentList = await studentsQuery.Take(250).ToListAsync();
            foreach (var s in studentList)
            {
                var cleanClass = s.ClassGrade?.ClassName ?? (s.ClassId > 0 && classLookup.TryGetValue(s.ClassId, out var cn) ? cn : $"Class {s.ClassId}");
                var cleanSec = s.ClassSection?.SectionName ?? "";
                contacts.Add(new ChatContactDto
                {
                    Id = $"STU-{s.StudentId}",
                    Name = s.StudentName,
                    Role = "student",
                    ClassName = cleanClass,
                    Section = cleanSec,
                    AdmissionNo = s.AdmissionNumber,
                    Phone = s.MobileNumber,
                    Email = s.Email,
                    IsOnline = true
                });

                if (!string.IsNullOrEmpty(s.AdmissionNumber))
                {
                    addedAdmissionNos.Add(s.AdmissionNumber);
                }

                // Add parent contact option
                var pName = !string.IsNullOrWhiteSpace(s.FatherName) ? s.FatherName : (!string.IsNullOrWhiteSpace(s.MotherName) ? s.MotherName : $"{s.StudentName}'s Parent");
                contacts.Add(new ChatContactDto
                {
                    Id = $"PAR-{s.StudentId}",
                    Name = $"{pName} (Parent of {s.StudentName})",
                    Role = "parent",
                    ClassName = cleanClass,
                    Section = cleanSec,
                    AdmissionNo = s.AdmissionNumber,
                    Phone = s.FatherMobile ?? s.MotherMobile ?? s.MobileNumber,
                    IsOnline = false
                });
            }

            // Also include students from Admissions table if not already represented
            var admissionsQuery = _context.Admissions
                .AsNoTracking()
                .Where(a => !a.IsDeleted && (a.Status == "Active" || a.Status == "Enrolled" || a.Status == "Admitted" || a.Status == "Approved"));

            var admissionList = await admissionsQuery.Take(250).ToListAsync();
            foreach (var a in admissionList)
            {
                var admNo = a.ApplicationNo ?? a.RollNo ?? $"ADM-{a.AdmissionId}";
                if (addedAdmissionNos.Contains(admNo)) continue;

                var cleanClass = a.ClassId.HasValue && classLookup.TryGetValue(a.ClassId.Value, out var cName)
                    ? cName
                    : (a.ClassId.HasValue ? $"Class {a.ClassId.Value}" : "General");

                if (!string.IsNullOrWhiteSpace(classFilter) && !classFilter.Equals("all", StringComparison.OrdinalIgnoreCase))
                {
                    var cf = classFilter.Trim().ToLower();
                    if (cleanClass != null && !cleanClass.ToLower().Contains(cf) && a.ClassId?.ToString() != cf)
                    {
                        continue;
                    }
                }

                var sName = a.StudentName ?? "Student";
                contacts.Add(new ChatContactDto
                {
                    Id = $"ADM-{a.AdmissionId}",
                    Name = sName,
                    Role = "student",
                    ClassName = cleanClass,
                    Section = a.SectionLetter ?? "",
                    AdmissionNo = admNo,
                    Phone = a.FatherMobile,
                    IsOnline = true
                });

                var pName = !string.IsNullOrWhiteSpace(a.FatherName) ? a.FatherName : $"{sName}'s Parent";
                contacts.Add(new ChatContactDto
                {
                    Id = $"PAR-ADM-{a.AdmissionId}",
                    Name = $"{pName} (Parent of {sName})",
                    Role = "parent",
                    ClassName = cleanClass,
                    Section = a.SectionLetter ?? "",
                    AdmissionNo = admNo,
                    Phone = a.FatherMobile,
                    IsOnline = false
                });
            }
        }

        // 4. Populate latest messages and unread counts for each contact
        var messageHistory = await _context.DirectChatMessages
            .AsNoTracking()
            .Where(m => myIds.Contains(m.SenderId) || myIds.Contains(m.ReceiverId))
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        foreach (var contact in contacts)
        {
            var lastMsg = messageHistory.FirstOrDefault(m => 
                (m.SenderId == contact.Id && myIds.Contains(m.ReceiverId)) ||
                (m.ReceiverId == contact.Id && myIds.Contains(m.SenderId)));

            if (lastMsg != null)
            {
                contact.LastMessage = lastMsg.MessageText;
                contact.LastMessageTime = lastMsg.CreatedAt.ToLocalTime().ToString("hh:mm tt");
            }

            contact.UnreadCount = messageHistory.Count(m => 
                m.SenderId == contact.Id && 
                myIds.Contains(m.ReceiverId) && 
                !m.IsRead);
        }

        string? currentClassName = studentUser?.ClassGrade?.ClassName;
        string? currentSection = studentUser?.ClassSection?.SectionName;

        return Ok(new
        {
            success = true,
            currentUser = new
            {
                id = effectiveMyId,
                name = userName,
                role = userRole,
                className = currentClassName,
                section = currentSection
            },
            classes = dynamicClasses,
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

        var (_, userName, _, _, _, _, myIds, effectiveMyId) = await ResolveCurrentEntityAsync();

        var query = _context.DirectChatMessages
            .Where(m => 
                (myIds.Contains(m.SenderId) && m.ReceiverId == contactId) ||
                (m.SenderId == contactId && myIds.Contains(m.ReceiverId)));

        var rawList = await query.OrderBy(m => m.CreatedAt).ToListAsync();

        // Mark incoming messages as read
        bool hasUnread = false;
        foreach (var m in rawList)
        {
            if (myIds.Contains(m.ReceiverId) && !m.IsRead)
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
            IsOutgoing = myIds.Contains(m.SenderId)
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

        var (userId, userName, userRole, _, staffUser, studentUser, _, effectiveSenderId) = await ResolveCurrentEntityAsync();
        bool isStudent = studentUser != null;

        string? senderClassName = null;
        int? senderClassId = null;

        if (isStudent && studentUser != null)
        {
            senderClassId = studentUser.ClassId;
            senderClassName = studentUser.ClassGrade?.ClassName ?? $"Class {studentUser.ClassId}";

            // CHECK RECEIVER RULE:
            // "particular class students can message or call to that class students only not everyone and can msg to any teacher"
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
                        message = $"Access Denied: You can only message students in your enrolled class ({senderClassName}). Messaging students from other classes is restricted."
                    });
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

        var (userId, userName, userRole, _, staffUser, studentUser, _, effectiveSenderId) = await ResolveCurrentEntityAsync();
        bool isStudent = studentUser != null;

        string? senderClassName = null;
        int? senderClassId = null;

        if (isStudent && studentUser != null)
        {
            senderClassId = studentUser.ClassId;
            senderClassName = studentUser.ClassGrade?.ClassName ?? $"Class {studentUser.ClassId}";

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
        var (_, _, _, _, _, _, myIds, _) = await ResolveCurrentEntityAsync();

        var count = await _context.DirectChatMessages
            .CountAsync(m => myIds.Contains(m.ReceiverId) && !m.IsRead);

        return Ok(new
        {
            success = true,
            unreadCount = count
        });
    }
}
