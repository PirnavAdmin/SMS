using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Ai.Tools
{
    public class TimetableScheduleTool : IAiTool
    {
        private readonly ITimetableService _timetableService;
        private readonly AppDbContext _context;

        public TimetableScheduleTool(ITimetableService timetableService, AppDbContext context)
        {
            _timetableService = timetableService;
            _context = context;
        }

        public string Name => "timetable_get_schedule";
        public string Description => "Retrieves class timetables, teacher schedules, periods, timings, rooms, and daily schedules.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""className"": { ""type"": ""string"", ""description"": ""Class name e.g. 'Class 10' or 'Grade 5'"" },
                ""sectionName"": { ""type"": ""string"", ""description"": ""Section name e.g. 'A'"" },
                ""teacherName"": { ""type"": ""string"", ""description"": ""Optional teacher name to look up teacher timetable"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Student", "Parent", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            var cls = arguments.TryGetProperty("className", out var cElem) ? cElem.GetString()?.Trim().ToLowerInvariant() : null;
            var sec = arguments.TryGetProperty("sectionName", out var sElem) ? sElem.GetString()?.Trim().ToLowerInvariant() : null;
            var tName = arguments.TryGetProperty("teacherName", out var tElem) ? tElem.GetString()?.Trim().ToLowerInvariant() : null;

            // Student/Parent personalized schedule
            if (context.UserRole.Equals("Student", StringComparison.OrdinalIgnoreCase) ||
                (context.UserRole.Equals("Parent", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(tName) && string.IsNullOrWhiteSpace(cls)))
            {
                var targetStudentId = context.StudentId;
                if (!targetStudentId.HasValue && context.LinkedChildStudentIds.Count > 0)
                    targetStudentId = context.LinkedChildStudentIds.First();

                if (targetStudentId.HasValue)
                {
                    var student = await _context.Students.Include(s => s.ClassGrade).Include(s => s.ClassSection).FirstOrDefaultAsync(s => s.StudentId == targetStudentId.Value);
                    if (student != null)
                    {
                        var studentSchedule = await _timetableService.GetStudentTimetableAsync(student.ClassId, student.SectionId);
                        var summary = $"Weekly class timetable for {student.StudentName} ({student.ClassGrade?.ClassName} - {student.ClassSection?.SectionName}): {studentSchedule.Days?.Count ?? 0} active school days.";

                        var rows = new List<object>();
                        if (studentSchedule.Days != null)
                        {
                            foreach (var d in studentSchedule.Days)
                            {
                                foreach (var p in d.Periods)
                                {
                                    rows.Add(new
                                    {
                                        Day = d.DayOfWeek,
                                        Period = p.PeriodName,
                                        Time = $"{p.StartTime} - {p.EndTime}",
                                        Subject = p.SubjectName,
                                        Teacher = p.TeacherName,
                                        Room = p.RoomNo ?? "-"
                                    });
                                }
                            }
                        }

                        return AiToolResult.Ok(summary, studentSchedule, "table", new
                        {
                            title = $"Student Timetable: {student.StudentName} ({student.ClassGrade?.ClassName} - {student.ClassSection?.SectionName})",
                            columns = new[] { "Day", "Period", "Time", "Subject", "Teacher", "Room" },
                            rows = rows.Take(30).ToList()
                        });
                    }
                }
            }

            // Teacher schedule request
            if (context.UserRole.Equals("Teacher", StringComparison.OrdinalIgnoreCase) || !string.IsNullOrWhiteSpace(tName))
            {
                int? teacherId = context.StaffId;
                if (!string.IsNullOrWhiteSpace(tName))
                {
                    var found = await _context.Staff
                        .Where(s => s.FirstName != null && (s.FirstName.ToLower().Contains(tName) || (s.LastName != null && s.LastName.ToLower().Contains(tName))))
                        .Select(s => s.StaffId)
                        .FirstOrDefaultAsync();
                    if (found > 0) teacherId = found;
                }

                if (teacherId.HasValue && teacherId.Value > 0)
                {
                    var teacherSchedule = await _timetableService.GetTeacherTimetableAsync(teacherId.Value);
                    var teacherObj = await _context.Staff.FindAsync(teacherId.Value);
                    int totalPeriods = teacherSchedule.Days?.Sum(d => d.Periods?.Count ?? 0) ?? 0;
                    var summary = $"Teaching schedule for {teacherObj?.DisplayName ?? "Teacher"}: {totalPeriods} weekly periods across {teacherSchedule.Days?.Count ?? 0} days.";

                    var rows = new List<object>();
                    if (teacherSchedule.Days != null)
                    {
                        foreach (var d in teacherSchedule.Days)
                        {
                            foreach (var p in d.Periods)
                            {
                                rows.Add(new
                                {
                                    Day = d.DayOfWeek,
                                    Period = p.PeriodName,
                                    Time = $"{p.StartTime} - {p.EndTime}",
                                    Subject = p.SubjectName,
                                    Class = p.ClassName,
                                    Section = p.SectionName,
                                    Room = p.RoomNo ?? "-"
                                });
                            }
                        }
                    }

                    return AiToolResult.Ok(summary, teacherSchedule, "table", new
                    {
                        title = $"Teacher Schedule: {teacherObj?.DisplayName ?? "Teacher"}",
                        columns = new[] { "Day", "Period", "Time", "Subject", "Class", "Section", "Room" },
                        rows = rows.Take(30).ToList()
                    });
                }
            }

            // General Class Timetable
            int cId = 1, sId = 1;
            if (!string.IsNullOrWhiteSpace(cls))
            {
                var grade = await _context.Classes.FirstOrDefaultAsync(c => c.ClassName != null && c.ClassName.ToLower().Contains(cls));
                if (grade != null) cId = grade.ClassId;
            }
            if (!string.IsNullOrWhiteSpace(sec))
            {
                var sObj = await _context.ClassSections.FirstOrDefaultAsync(s => s.ClassId == cId && s.SectionName.ToLower().Contains(sec));
                if (sObj != null) sId = sObj.SectionId;
            }

            var grid = await _timetableService.GetClassTimetableGridAsync(cId, sId);
            var gridSummary = $"Class Timetable for {grid.ClassName} - {grid.SectionName}: Total active slots: {grid.Slots?.Count ?? 0}.";

            var slotRows = (grid.Slots ?? new List<TimetableSlotDto>()).Select(s => new
            {
                Day = s.DayOfWeek,
                Period = s.PeriodName,
                Time = $"{s.StartTime} - {s.EndTime}",
                Subject = s.SubjectName,
                Teacher = s.TeacherName,
                Room = s.RoomNo ?? "-"
            }).ToList();

            return AiToolResult.Ok(gridSummary, grid, "table", new
            {
                title = $"Class Timetable: {grid.ClassName} - {grid.SectionName}",
                columns = new[] { "Day", "Period", "Time", "Subject", "Teacher", "Room" },
                rows = slotRows.Take(30).ToList()
            });
        }
    }
}
