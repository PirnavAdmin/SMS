using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Examination;
using SMS.Api.Dtos.Parent;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Interfaces.Examination;
using SMS.Api.Services.Interfaces.Parent;

namespace SMS.Api.Services.Ai.Tools
{
    public class ExamStudentResultsTool : IAiTool
    {
        private readonly IParentService _parentService;
        private readonly AppDbContext _context;

        public ExamStudentResultsTool(IParentService parentService, AppDbContext context)
        {
            _parentService = parentService;
            _context = context;
        }

        public string Name => "exam_get_student_results";
        public string Description => "Retrieves examination report card, subject-wise marks, maximum marks, percentage, grade, and performance for a student.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""studentId"": { ""type"": ""integer"", ""description"": ""Student ID (optional for Parent/Student as it is securely resolved)"" },
                ""studentNameOrRoll"": { ""type"": ""string"", ""description"": ""Student name, admission number, or roll number"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Parent", "Student" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            int? studentId = arguments.TryGetProperty("studentId", out var idElem) && idElem.TryGetInt32(out var sid) ? sid : null;
            string? search = arguments.TryGetProperty("studentNameOrRoll", out var sElem) ? sElem.GetString()?.Trim() : null;

            // Security scoping
            if (context.UserRole.Equals("Student", StringComparison.OrdinalIgnoreCase))
            {
                studentId = context.StudentId;
                if (!studentId.HasValue || studentId.Value <= 0)
                    return AiToolResult.Fail("Student record could not be resolved for authenticated account.");
            }
            else if (context.UserRole.Equals("Parent", StringComparison.OrdinalIgnoreCase))
            {
                if (studentId.HasValue)
                {
                    if (!context.LinkedChildStudentIds.Contains(studentId.Value))
                        return AiToolResult.Fail("Unauthorized: Access denied to unlinked student exam report.");
                }
                else if (context.LinkedChildStudentIds.Count > 0)
                {
                    studentId = context.LinkedChildStudentIds.First();
                }
                else return AiToolResult.Fail("No linked children found for this parent account.");
            }
            else if (!studentId.HasValue && !string.IsNullOrWhiteSpace(search))
            {
                var match = await _context.Students
                    .Where(s => !s.IsDeleted &&
                               (s.StudentName.ToLower().Contains(search.ToLower()) ||
                                s.RollNumber.ToLower() == search.ToLower() ||
                                s.AdmissionNumber.ToLower() == search.ToLower()))
                    .Select(s => s.StudentId)
                    .FirstOrDefaultAsync();

                if (match > 0) studentId = match;
            }

            if (!studentId.HasValue || studentId.Value <= 0)
            {
                return AiToolResult.Fail("Please specify a valid student name or student ID.");
            }

            var results = await _parentService.GetExamResultsAsync(studentId.Value);
            var student = await _context.Students.Include(s => s.ClassGrade).Include(s => s.ClassSection).FirstOrDefaultAsync(s => s.StudentId == studentId.Value);
            var studentName = student?.StudentName ?? "Student";

            if (results == null || results.Count == 0)
            {
                return AiToolResult.Ok($"No examination results or report cards have been published yet for {studentName}.");
            }

            var latest = results.First();
            var subjectRows = (latest.SubjectResults ?? new List<ParentExamSubjectResultDto>()).Select(s => new
            {
                Subject = s.SubjectName,
                MarksObtained = s.MarksObtained,
                MaxMarks = s.MaxMarks,
                Percentage = s.MaxMarks > 0 ? $"{Math.Round((double)s.MarksObtained / (double)s.MaxMarks * 100.0, 1)}%" : "-",
                Grade = s.Grade,
                Remarks = s.Remarks
            }).ToList();

            string summary = $"{studentName}'s result for {latest.ExamName}: Total Marks: {latest.TotalObtainedMarks}/{latest.TotalMaxMarks} ({latest.Percentage}%), Grade: {latest.OverallGrade}, Result: {latest.ResultStatus}.";

            var visualData = new
            {
                title = $"{latest.ExamName} - Report Card: {studentName}",
                metrics = new
                {
                    examName = latest.ExamName,
                    totalMarks = $"{latest.TotalObtainedMarks}/{latest.TotalMaxMarks}",
                    percentage = $"{latest.Percentage}%",
                    grade = latest.OverallGrade,
                    status = latest.ResultStatus
                },
                table = new
                {
                    columns = new[] { "Subject", "MarksObtained", "MaxMarks", "Percentage", "Grade", "Remarks" },
                    rows = subjectRows
                }
            };

            return AiToolResult.Ok(summary, results, "table", visualData);
        }
    }

    public class ExamScheduleTool : IAiTool
    {
        private readonly IExamScheduleService _examScheduleService;

        public ExamScheduleTool(IExamScheduleService examScheduleService)
        {
            _examScheduleService = examScheduleService;
        }

        public string Name => "exam_get_schedules";
        public string Description => "Retrieves upcoming and current examination schedules, dates, subjects, timings, and venues.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""className"": { ""type"": ""string"", ""description"": ""Optional class name e.g. 'Class 10' or '10'"" },
                ""sectionName"": { ""type"": ""string"", ""description"": ""Optional section name e.g. 'A'"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Parent", "Student", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            var cls = arguments.TryGetProperty("className", out var cElem) ? cElem.GetString()?.Trim() : "All";
            var sec = arguments.TryGetProperty("sectionName", out var sElem) ? sElem.GetString()?.Trim() : "All";

            var preview = await _examScheduleService.GetSchedulePreviewAsync(null, null, cls, sec);

            if (preview == null || preview.SectionSchedules == null || preview.SectionSchedules.Count == 0)
            {
                return AiToolResult.Ok("No upcoming examination schedules found matching your query.");
            }

            var rows = new List<object>();
            foreach (var card in preview.SectionSchedules)
            {
                if (card.Timetable != null)
                {
                    foreach (var slot in card.Timetable)
                    {
                        rows.Add(new
                        {
                            Class = $"{card.ClassName} - {card.SectionName}",
                            Subject = slot.SubjectName,
                            SubjectCode = slot.SubjectCode,
                            Date = slot.ExamDate,
                            Time = slot.TimeSlot,
                            Duration = slot.Duration,
                            Room = string.IsNullOrWhiteSpace(slot.RoomHall) ? "Main Hall" : slot.RoomHall,
                            Invigilator = string.IsNullOrWhiteSpace(slot.InvigilatorFaculty) ? "-" : slot.InvigilatorFaculty,
                            MaxMarks = slot.TotalMarks
                        });
                    }
                }
            }

            if (rows.Count == 0)
            {
                return AiToolResult.Ok("No examination schedule slots found for the requested criteria.");
            }

            string summary = $"Found {rows.Count} examination schedule slot(s) for {preview.AcademicYear}.";
            return AiToolResult.Ok(summary, rows, "table", new
            {
                title = $"Examination Timetable Schedule ({preview.AcademicYear})",
                columns = new[] { "Class", "Subject", "Date", "Time", "Duration", "Room", "Invigilator", "MaxMarks" },
                rows = rows.Take(30).ToList()
            });
        }
    }
}
