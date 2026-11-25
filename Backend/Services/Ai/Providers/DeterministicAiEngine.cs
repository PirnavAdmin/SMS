using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Services.Ai.Providers
{
    public class DeterministicAiEngine : IAiProvider
    {
        public string ProviderName => "DeterministicBuiltInEngine";
        public bool IsConfigured => true;

        public Task<AiCompletionResult> GenerateChatResponseAsync(AiChatContext context, IEnumerable<IAiTool> availableTools)
        {
            var msg = (context.LatestUserMessage ?? "").Trim().ToLowerInvariant();
            var result = new AiCompletionResult();

            // 0. WRITE ACTION INTENTS (Announcements & Meeting Scheduling with Confirmation Requirement)
            if (msg.Contains("announcement") || msg.Contains("circular") || msg.Contains("broadcast"))
            {
                var actionTool = availableTools.FirstOrDefault(t => t.Name == "action_create_announcement");
                if (actionTool != null)
                {
                    var titleMatch = Regex.Match(context.LatestUserMessage ?? "", @"(?:titled|title|subject|announcement:?)\s*[:'-]?\s*['""]?([^'""\n\r]+)['""]?", RegexOptions.IgnoreCase);
                    var title = titleMatch.Success ? titleMatch.Groups[1].Value.Trim() : "School Circular";
                    var content = "Important school notification regarding upcoming schedule.";

                    var payload = new Dictionary<string, string>
                    {
                        ["title"] = title,
                        ["content"] = content,
                        ["targetAudience"] = msg.Contains("parent") ? "Parents" : msg.Contains("teacher") ? "Teachers" : msg.Contains("student") ? "Students" : "All",
                        ["category"] = msg.Contains("holiday") ? "HOLIDAY" : msg.Contains("exam") ? "EXAM" : "ACADEMIC"
                    };

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = actionTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Preparing announcement draft for your confirmation...";
                    return Task.FromResult(result);
                }
            }

            if (msg.Contains("meeting") || msg.Contains("ptm") || msg.Contains("parent teacher meeting") || msg.Contains("parent-teacher meeting"))
            {
                var meetTool = availableTools.FirstOrDefault(t => t.Name == "action_schedule_meeting");
                if (meetTool != null)
                {
                    var payload = new Dictionary<string, string>
                    {
                        ["meetingTitle"] = "PTM: Parent-Teacher Meeting",
                        ["meetingDate"] = DateTime.Today.AddDays(3).ToString("yyyy-MM-dd"),
                        ["meetingTime"] = "10:30 AM",
                        ["audience"] = "Parent",
                        ["mode"] = "In-Person",
                        ["agenda"] = "Review of academic progress, attendance and term assessments."
                    };

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = meetTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Preparing meeting schedule preview for your review...";
                    return Task.FromResult(result);
                }
            }

            // 1. ATTENDANCE INTENTS
            if (msg.Contains("highest") && (msg.Contains("attendance") || msg.Contains("present")))
            {
                var tool = availableTools.FirstOrDefault(t => t.Name == "attendance_get_class_comparison" || t.Name == "attendance_get_class_summary");
                if (tool != null)
                {
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = tool.Name,
                        Arguments = JsonDocument.Parse("{}").RootElement
                    });
                    result.ReplyText = "Analyzing attendance records across all classes to determine which class has the highest attendance...";
                    return Task.FromResult(result);
                }
            }

            if (msg.Contains("absent") || msg.Contains("attendance") || msg.Contains("present") || msg.Contains("how many students are absent"))
            {
                var className = ExtractClass(msg);
                var sectionName = ExtractSection(msg);
                var date = ExtractDate(msg);

                var tool = availableTools.FirstOrDefault(t => t.Name == "attendance_get_daily_summary");
                if (tool != null)
                {
                    var payload = new Dictionary<string, string>();
                    if (!string.IsNullOrEmpty(className)) payload["className"] = className;
                    if (!string.IsNullOrEmpty(sectionName)) payload["sectionName"] = sectionName;
                    if (!string.IsNullOrEmpty(date)) payload["date"] = date;

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = tool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Fetching live attendance records and absentee counts from the database...";
                    return Task.FromResult(result);
                }
            }

            // 2. FEE & FINANCE INTENTS
            if (msg.Contains("fee") || msg.Contains("dues") || msg.Contains("pending fee") || msg.Contains("overdue") || msg.Contains("collection"))
            {
                // School-wide fee collection
                if ((msg.Contains("collection") && (msg.Contains("total") || msg.Contains("stats") || msg.Contains("summary") || msg.Contains("overall") || msg.Contains("overdue"))) ||
                    (msg.Contains("total") && msg.Contains("collection")) ||
                    msg.Contains("school collection") || msg.Contains("overall fee"))
                {
                    var tool = availableTools.FirstOrDefault(t => t.Name == "fee_get_collection_stats");
                    if (tool != null)
                    {
                        result.ToolCallsRequested.Add(new AiToolCallRequest
                        {
                            ToolName = tool.Name,
                            Arguments = JsonDocument.Parse("{}").RootElement
                        });
                        result.ReplyText = "Retrieving total school-wide fee collection summaries and pending balances...";
                        return Task.FromResult(result);
                    }
                }

                // Student / child fee profile
                var studentTool = availableTools.FirstOrDefault(t => t.Name == "fee_get_student_profile");
                if (studentTool != null)
                {
                    var studentName = ExtractNameOrQuery(msg, new[] { "fee", "child", "show", "pending", "my", "of", "for", "student", "what", "is" });
                    var payload = new Dictionary<string, string>();
                    if (!string.IsNullOrWhiteSpace(studentName)) payload["studentNameOrRoll"] = studentName;

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = studentTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Retrieving verified student fee profile, paid amounts, term breakdown, and pending due dates...";
                    return Task.FromResult(result);
                }
            }

            // 3. EXAMINATION INTENTS
            if (msg.Contains("exam") || msg.Contains("result") || msg.Contains("mark") || msg.Contains("grade") || msg.Contains("report card") || msg.Contains("schedule"))
            {
                if (msg.Contains("schedule") || msg.Contains("date sheet") || msg.Contains("timetable") || msg.Contains("when is"))
                {
                    var scheduleTool = availableTools.FirstOrDefault(t => t.Name == "exam_get_schedules");
                    if (scheduleTool != null)
                    {
                        var cls = ExtractClass(msg);
                        var payload = new Dictionary<string, string>();
                        if (!string.IsNullOrEmpty(cls)) payload["className"] = cls;

                        var jsonArgs = JsonSerializer.Serialize(payload);
                        result.ToolCallsRequested.Add(new AiToolCallRequest
                        {
                            ToolName = scheduleTool.Name,
                            Arguments = JsonDocument.Parse(jsonArgs).RootElement
                        });
                        result.ReplyText = "Fetching official examination schedule and subject timetable...";
                        return Task.FromResult(result);
                    }
                }

                var marksTool = availableTools.FirstOrDefault(t => t.Name == "exam_get_student_results");
                if (marksTool != null)
                {
                    var studentName = ExtractNameOrQuery(msg, new[] { "marks", "result", "exam", "report", "card", "of", "for", "show", "my", "student" });
                    var payload = new Dictionary<string, string>();
                    if (!string.IsNullOrWhiteSpace(studentName)) payload["studentNameOrRoll"] = studentName;

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = marksTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Retrieving student examination results and report card breakdown...";
                    return Task.FromResult(result);
                }
            }

            // 4. TRANSPORT INTENTS
            if (msg.Contains("bus") || msg.Contains("transport") || msg.Contains("route") || msg.Contains("driver") || msg.Contains("pickup"))
            {
                var transTool = availableTools.FirstOrDefault(t => t.Name == "transport_get_fleet_info" || t.Name == "transport_get_routes_stops");
                if (transTool != null)
                {
                    var payload = new Dictionary<string, string>();
                    var q = ExtractNameOrQuery(msg, new[] { "bus", "transport", "route", "driver", "details", "for", "show", "the", "which", "assigned" });
                    if (!string.IsNullOrWhiteSpace(q)) payload["routeSearch"] = q;

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = transTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Accessing school fleet and transport logistics...";
                    return Task.FromResult(result);
                }
            }

            // 5. LIBRARY INTENTS
            if (msg.Contains("library") || msg.Contains("book") || msg.Contains("author") || msg.Contains("isbn") || msg.Contains("overdue book"))
            {
                var libTool = availableTools.FirstOrDefault(t => t.Name == "library_search_catalog" || t.Name == "library_check_availability");
                if (libTool != null)
                {
                    bool checkIssued = msg.Contains("issued") || msg.Contains("overdue") || msg.Contains("borrowed");
                    var payload = new Dictionary<string, object>
                    {
                        ["checkIssuedBooks"] = checkIssued
                    };
                    var q = ExtractNameOrQuery(msg, new[] { "book", "library", "available", "is", "there", "any", "copies", "of", "issued", "check", "overdue" });
                    if (!string.IsNullOrWhiteSpace(q)) payload["bookTitleOrSearch"] = q;

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = libTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Searching library catalog and inventory records...";
                    return Task.FromResult(result);
                }
            }

            // 6. TIMETABLE INTENTS
            if (msg.Contains("timetable") || msg.Contains("schedule") || msg.Contains("period") || msg.Contains("classes today"))
            {
                var ttTool = availableTools.FirstOrDefault(t => t.Name == "timetable_get_schedule");
                if (ttTool != null)
                {
                    var cls = ExtractClass(msg);
                    var sec = ExtractSection(msg);
                    var payload = new Dictionary<string, string>();
                    if (!string.IsNullOrEmpty(cls)) payload["className"] = cls;
                    if (!string.IsNullOrEmpty(sec)) payload["sectionName"] = sec;

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = ttTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Looking up class and teaching timetable schedules...";
                    return Task.FromResult(result);
                }
            }

            // 7. STAFF & TEACHER INTENTS
            if (msg.Contains("staff") || msg.Contains("teacher") || msg.Contains("faculty") || msg.Contains("principal") || msg.Contains("department"))
            {
                var staffTool = availableTools.FirstOrDefault(t => t.Name == "admin_get_staff_list");
                if (staffTool != null)
                {
                    var dept = ExtractDepartment(msg);
                    var payload = new Dictionary<string, string>();
                    if (!string.IsNullOrEmpty(dept)) payload["department"] = dept;
                    var q = ExtractNameOrQuery(msg, new[] { "staff", "teacher", "teachers", "list", "who", "are", "the", "in", "show", "of" });
                    if (!string.IsNullOrWhiteSpace(q) && q != dept?.ToLower()) payload["search"] = q;

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = staffTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Retrieving school staff and faculty directory...";
                    return Task.FromResult(result);
                }
            }

            // 7b. STUDENT OVERVIEW & COUNT INTENTS
            if (msg.Contains("how many student") || msg.Contains("total student") || msg.Contains("number of student") ||
                msg.Contains("student count") || msg.Contains("count of student") || msg.Contains("students are there") ||
                msg.Contains("students in our school") || msg.Contains("students in school") || msg.Contains("student strength") ||
                msg.Contains("enrolled student") || msg.Contains("how many enrolled") || msg.Contains("total enrolled") ||
                msg.Contains("enrollment") || msg.Contains("class-wise student") || msg.Contains("classwise student") ||
                ((msg.Contains("how many") || msg.Contains("total")) && (msg.Contains("student") || msg.Contains("boys") || msg.Contains("girls"))))
            {
                var overviewTool = availableTools.FirstOrDefault(t => t.Name == "student_get_overview");
                if (overviewTool != null)
                {
                    var cls = ExtractClass(msg);
                    var sec = ExtractSection(msg);
                    var payload = new Dictionary<string, string>();
                    if (!string.IsNullOrEmpty(cls)) payload["className"] = cls;
                    if (!string.IsNullOrEmpty(sec)) payload["sectionName"] = sec;

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = overviewTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Retrieving total student enrollment and class-wise distribution records from the database...";
                    return Task.FromResult(result);
                }
            }

            // 8. STUDENT SEARCH / DIRECTORY INTENTS
            if (msg.Contains("student") || msg.Contains("roll") || msg.Contains("admission") || msg.Contains("find student") || msg.Contains("search student") || msg.Contains("profile"))
            {
                var studentTool = availableTools.FirstOrDefault(t => t.Name == "student_search");
                if (studentTool != null)
                {
                    var q = ExtractNameOrQuery(msg, new[] { "student", "students", "search", "find", "details", "of", "for", "show", "profile", "roll", "admission", "how", "many", "are", "there", "in", "our", "school", "all" });
                    var cls = ExtractClass(msg);
                    var sec = ExtractSection(msg);

                    var payload = new Dictionary<string, string>();
                    if (!string.IsNullOrEmpty(q)) payload["query"] = q;
                    if (!string.IsNullOrEmpty(cls)) payload["className"] = cls;
                    if (!string.IsNullOrEmpty(sec)) payload["sectionName"] = sec;

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = studentTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Searching student directory records...";
                    return Task.FromResult(result);
                }
            }

            // 9. AUTHORIZED WRITE ACTION INTENTS (Preview phase)
            if (msg.Contains("announcement") || msg.Contains("circular") || msg.Contains("broadcast"))
            {
                var actionTool = availableTools.FirstOrDefault(t => t.Name == "action_create_announcement");
                if (actionTool != null)
                {
                    var titleMatch = Regex.Match(msg, @"(?:titled|title|subject)\s+['""]?([^'""\n,]+)['""]?", RegexOptions.IgnoreCase);
                    var title = titleMatch.Success ? titleMatch.Groups[1].Value : "School Circular";
                    var content = "Important school notification regarding upcoming schedule.";

                    var payload = new Dictionary<string, string>
                    {
                        ["title"] = title,
                        ["content"] = content,
                        ["targetAudience"] = msg.Contains("parent") ? "Parents" : msg.Contains("teacher") ? "Teachers" : msg.Contains("student") ? "Students" : "All",
                        ["category"] = msg.Contains("holiday") ? "HOLIDAY" : msg.Contains("exam") ? "EXAM" : "ACADEMIC"
                    };

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = actionTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Preparing announcement draft for your confirmation...";
                    return Task.FromResult(result);
                }
            }

            if (msg.Contains("meeting") || msg.Contains("ptm") || msg.Contains("parent teacher meeting") || msg.Contains("schedule meeting"))
            {
                var meetTool = availableTools.FirstOrDefault(t => t.Name == "action_schedule_meeting");
                if (meetTool != null)
                {
                    var payload = new Dictionary<string, string>
                    {
                        ["meetingTitle"] = "Parent-Teacher Conference",
                        ["meetingDate"] = DateTime.Today.AddDays(3).ToString("yyyy-MM-dd"),
                        ["meetingTime"] = "10:30 AM",
                        ["audience"] = "Parent",
                        ["mode"] = "In-Person",
                        ["agenda"] = "Review of academic progress, attendance and term assessments."
                    };

                    var jsonArgs = JsonSerializer.Serialize(payload);
                    result.ToolCallsRequested.Add(new AiToolCallRequest
                    {
                        ToolName = meetTool.Name,
                        Arguments = JsonDocument.Parse(jsonArgs).RootElement
                    });
                    result.ReplyText = "Preparing meeting schedule preview for your review...";
                    return Task.FromResult(result);
                }
            }

            // General Assistance or Fallback Greetings
            result.ReplyText = $"Hello {context.ToolContext.UserName}! I am your School ERP AI Assistant. How can I help you today? You can ask me about **attendance records**, **fee balances and dues**, **exam results & schedules**, **transport routes**, **library books**, **timetables**, or **staff directory**.";
            return Task.FromResult(result);
        }

        private static string? ExtractClass(string msg)
        {
            var match = Regex.Match(msg, @"(?:class|grade|standard)\s+([0-9]{1,2}(?:st|nd|rd|th)?|[a-zA-Z]+)", RegexOptions.IgnoreCase);
            if (match.Success) return match.Groups[1].Value.Trim();

            var digitMatch = Regex.Match(msg, @"\b([1-9]|1[0-2])(?:th|st|nd|rd)?\b", RegexOptions.IgnoreCase);
            if (digitMatch.Success) return digitMatch.Groups[1].Value.Trim();

            return null;
        }

        private static string? ExtractSection(string msg)
        {
            var match = Regex.Match(msg, @"section\s+([a-zA-Z])\b", RegexOptions.IgnoreCase);
            if (match.Success) return match.Groups[1].Value.Trim().ToUpperInvariant();

            var combinedMatch = Regex.Match(msg, @"\b(?:class|grade)?\s*([0-9]{1,2})\s*([a-dA-D])\b", RegexOptions.IgnoreCase);
            if (combinedMatch.Success) return combinedMatch.Groups[2].Value.Trim().ToUpperInvariant();

            return null;
        }

        private static string? ExtractDate(string msg)
        {
            var isoMatch = Regex.Match(msg, @"\b(20[2-3][0-9]-[0-1][0-9]-[0-3][0-9])\b");
            if (isoMatch.Success) return isoMatch.Groups[1].Value;

            if (msg.Contains("yesterday")) return DateTime.Today.AddDays(-1).ToString("yyyy-MM-dd");
            if (msg.Contains("today")) return DateTime.Today.ToString("yyyy-MM-dd");
            if (msg.Contains("tomorrow")) return DateTime.Today.AddDays(1).ToString("yyyy-MM-dd");

            return null;
        }

        private static string? ExtractDepartment(string msg)
        {
            var depts = new[] { "mathematics", "math", "science", "physics", "chemistry", "biology", "english", "social", "hindi", "computer", "administration" };
            foreach (var d in depts)
            {
                if (msg.Contains(d)) return d;
            }
            return null;
        }

        private static string? ExtractNameOrQuery(string msg, string[] stopWords)
        {
            var words = msg.Split(new[] { ' ', '?', '.', ',', '!', ':', ';' }, StringSplitOptions.RemoveEmptyEntries);
            var filtered = words.Where(w => !stopWords.Contains(w.ToLowerInvariant())).ToList();
            if (filtered.Count > 0)
            {
                return string.Join(" ", filtered).Trim();
            }
            return null;
        }
    }
}
