using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Services.Ai.Tools
{
    public class AttendanceDailySummaryTool : IAiTool
    {
        private readonly AppDbContext _context;

        public AttendanceDailySummaryTool(AppDbContext context)
        {
            _context = context;
        }

        public string Name => "attendance_get_daily_summary";
        public string Description => "Retrieves daily student attendance statistics, count of present, absent, late, and half-day students, and lists absent students for a specific date or class.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""date"": { ""type"": ""string"", ""description"": ""Date in YYYY-MM-DD format (defaults to current date)"" },
                ""className"": { ""type"": ""string"", ""description"": ""Optional class name to filter, e.g. 'Class 10' or '10'"" },
                ""sectionName"": { ""type"": ""string"", ""description"": ""Optional section name, e.g. 'A'"" },
                ""statusFilter"": { ""type"": ""string"", ""description"": ""Filter to 'Absent', 'Present', 'Late', or 'All'"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Staff", "Parent", "Student" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            DateTime targetDate = DateTime.Today;
            if (arguments.TryGetProperty("date", out var dElem) && DateTime.TryParse(dElem.GetString(), out var parsedDate))
            {
                targetDate = parsedDate.Date;
            }

            string? clsFilter = arguments.TryGetProperty("className", out var cElem) ? cElem.GetString()?.Trim().ToLowerInvariant() : null;
            string? secFilter = arguments.TryGetProperty("sectionName", out var sElem) ? sElem.GetString()?.Trim().ToLowerInvariant() : null;
            string? statusFilter = arguments.TryGetProperty("statusFilter", out var sfElem) ? sfElem.GetString()?.Trim().ToLowerInvariant() : null;

            // Security scoping
            var studentQuery = _context.Students
                .AsNoTracking()
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .Where(s => !s.IsDeleted);

            if (context.UserRole.Equals("Student", StringComparison.OrdinalIgnoreCase))
            {
                if (context.StudentId.HasValue && context.StudentId.Value > 0)
                    studentQuery = studentQuery.Where(s => s.StudentId == context.StudentId.Value);
                else
                    return AiToolResult.Fail("Student record could not be resolved for authenticated account.");
            }
            else if (context.UserRole.Equals("Parent", StringComparison.OrdinalIgnoreCase))
            {
                if (context.LinkedChildStudentIds != null && context.LinkedChildStudentIds.Count > 0)
                    studentQuery = studentQuery.Where(s => context.LinkedChildStudentIds.Contains(s.StudentId));
                else
                    return AiToolResult.Fail("No linked children found for this parent account.");
            }
            else if (context.UserRole.Equals("Teacher", StringComparison.OrdinalIgnoreCase))
            {
                if (context.AssignedClassIds != null && context.AssignedClassIds.Count > 0)
                {
                    studentQuery = studentQuery.Where(s => context.AssignedClassIds.Contains(s.ClassId));
                }
            }

            if (!string.IsNullOrWhiteSpace(clsFilter))
            {
                studentQuery = studentQuery.Where(s => s.ClassGrade != null && s.ClassGrade.ClassName.ToLower().Contains(clsFilter));
            }
            if (!string.IsNullOrWhiteSpace(secFilter))
            {
                studentQuery = studentQuery.Where(s => s.ClassSection != null && s.ClassSection.SectionName.ToLower().Contains(secFilter));
            }

            var totalEnrolled = await studentQuery.CountAsync();
            if (totalEnrolled == 0)
            {
                return AiToolResult.Ok($"No active students found matching criteria for {targetDate:yyyy-MM-dd}.");
            }

            var studentIds = await studentQuery.Select(s => s.StudentId).ToListAsync();

            // Fetch actual attendance records for targetDate
            var attendanceRecords = await _context.StudentAttendances
                .AsNoTracking()
                .Include(a => a.AttendanceSession)
                .Include(a => a.Student)
                    .ThenInclude(s => s!.ClassGrade)
                .Include(a => a.Student)
                    .ThenInclude(s => s!.ClassSection)
                .Where(a => a.AttendanceSession != null &&
                            a.AttendanceSession.AttendanceDate.Date == targetDate &&
                            a.StudentId.HasValue &&
                            studentIds.Contains(a.StudentId.Value))
                .ToListAsync();

            int recordedCount = attendanceRecords.Count;
            int presentCount = attendanceRecords.Count(a => a.Status.Equals("Present", StringComparison.OrdinalIgnoreCase));
            int absentCount = attendanceRecords.Count(a => a.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase));
            int lateCount = attendanceRecords.Count(a => a.Status.Equals("Late", StringComparison.OrdinalIgnoreCase));
            int halfDayCount = attendanceRecords.Count(a => a.Status.Equals("HalfDay", StringComparison.OrdinalIgnoreCase) || a.Status.Equals("Half Day", StringComparison.OrdinalIgnoreCase));

            // If attendance has not been marked yet for today or no records, check if there are records on the latest recorded date
            if (recordedCount == 0)
            {
                var mostRecentDate = await _context.StudentAttendanceSessions
                    .OrderByDescending(s => s.AttendanceDate)
                    .Select(s => s.AttendanceDate)
                    .FirstOrDefaultAsync();

                if (mostRecentDate != default && mostRecentDate.Date != targetDate)
                {
                    targetDate = mostRecentDate.Date;
                    attendanceRecords = await _context.StudentAttendances
                        .AsNoTracking()
                        .Include(a => a.AttendanceSession)
                        .Include(a => a.Student)
                            .ThenInclude(s => s!.ClassGrade)
                        .Include(a => a.Student)
                            .ThenInclude(s => s!.ClassSection)
                        .Where(a => a.AttendanceSession != null &&
                                    a.AttendanceSession.AttendanceDate.Date == targetDate &&
                                    a.StudentId.HasValue &&
                                    studentIds.Contains(a.StudentId.Value))
                        .ToListAsync();

                    recordedCount = attendanceRecords.Count;
                    presentCount = attendanceRecords.Count(a => a.Status.Equals("Present", StringComparison.OrdinalIgnoreCase));
                    absentCount = attendanceRecords.Count(a => a.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase));
                    lateCount = attendanceRecords.Count(a => a.Status.Equals("Late", StringComparison.OrdinalIgnoreCase));
                    halfDayCount = attendanceRecords.Count(a => a.Status.Equals("HalfDay", StringComparison.OrdinalIgnoreCase) || a.Status.Equals("Half Day", StringComparison.OrdinalIgnoreCase));
                }
            }

            var effectiveTotal = recordedCount > 0 ? recordedCount : totalEnrolled;
            double presentPct = effectiveTotal > 0 ? Math.Round((double)presentCount / effectiveTotal * 100.0, 1) : 0;
            double absentPct = effectiveTotal > 0 ? Math.Round((double)absentCount / effectiveTotal * 100.0, 1) : 0;

            string summary;
            if (recordedCount == 0)
            {
                summary = $"Attendance records have not been submitted yet for {targetDate:yyyy-MM-dd}. Enrolled active students: {totalEnrolled}.";
            }
            else
            {
                summary = $"Attendance Summary for {targetDate:yyyy-MM-dd}: Out of {effectiveTotal} recorded students, {presentCount} are Present ({presentPct}%), {absentCount} are Absent ({absentPct}%), {lateCount} Late, and {halfDayCount} Half-day.";
            }

            var detailList = attendanceRecords.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(statusFilter) && statusFilter != "all")
            {
                detailList = detailList.Where(a => a.Status.ToLower().Contains(statusFilter));
            }

            var rows = detailList.Take(50).Select(a => new
            {
                RollNumber = a.Student?.RollNumber ?? "-",
                StudentName = a.Student?.StudentName ?? "Student",
                Class = a.Student?.ClassGrade?.ClassName ?? "-",
                Section = a.Student?.ClassSection?.SectionName ?? "-",
                Status = a.Status,
                Remarks = a.Remarks ?? "-"
            }).ToList();

            var visualData = new
            {
                title = $"Daily Attendance Breakdown ({targetDate:yyyy-MM-dd})",
                metrics = new
                {
                    totalEnrolled,
                    recordedCount,
                    presentCount,
                    absentCount,
                    lateCount,
                    halfDayCount,
                    attendancePercentage = presentPct
                },
                chart = new
                {
                    type = "bar",
                    labels = new[] { "Present", "Absent", "Late", "Half Day" },
                    datasets = new[]
                    {
                        new { label = "Students", data = new[] { presentCount, absentCount, lateCount, halfDayCount } }
                    }
                },
                table = new
                {
                    columns = new[] { "RollNumber", "StudentName", "Class", "Section", "Status", "Remarks" },
                    rows = rows
                }
            };

            return AiToolResult.Ok(summary, visualData, "chart", visualData);
        }
    }

    public class AttendanceClassSummaryTool : IAiTool
    {
        private readonly AppDbContext _context;

        public AttendanceClassSummaryTool(AppDbContext context)
        {
            _context = context;
        }

        public string Name => "attendance_get_class_comparison";
        public string Description => "Compares attendance rates and percentages across all classes and sections to identify highest and lowest attendance.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""date"": { ""type"": ""string"", ""description"": ""Date in YYYY-MM-DD format (defaults to most recent date)"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            DateTime targetDate = DateTime.Today;
            if (arguments.TryGetProperty("date", out var dElem) && DateTime.TryParse(dElem.GetString(), out var parsedDate))
            {
                targetDate = parsedDate.Date;
            }
            else
            {
                var latest = await _context.StudentAttendanceSessions
                    .OrderByDescending(s => s.AttendanceDate)
                    .Select(s => s.AttendanceDate)
                    .FirstOrDefaultAsync();
                if (latest != default) targetDate = latest.Date;
            }

            var records = await _context.StudentAttendances
                .AsNoTracking()
                .Include(a => a.AttendanceSession)
                .Include(a => a.Student)
                    .ThenInclude(s => s!.ClassGrade)
                .Include(a => a.Student)
                    .ThenInclude(s => s!.ClassSection)
                .Where(a => a.AttendanceSession != null &&
                            a.AttendanceSession.AttendanceDate.Date == targetDate &&
                            a.Student != null &&
                            !a.Student.IsDeleted)
                .ToListAsync();

            if (records.Count == 0)
            {
                return AiToolResult.Ok($"No attendance records recorded on {targetDate:yyyy-MM-dd}.");
            }

            var classGroups = records
                .GroupBy(a => a.Student?.ClassGrade?.ClassName ?? "Unknown Class")
                .Select(g =>
                {
                    int total = g.Count();
                    int present = g.Count(a => a.Status.Equals("Present", StringComparison.OrdinalIgnoreCase));
                    int absent = g.Count(a => a.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase));
                    double pct = total > 0 ? Math.Round((double)present / total * 100.0, 1) : 0;
                    return new
                    {
                        ClassName = g.Key,
                        TotalStudents = total,
                        PresentCount = present,
                        AbsentCount = absent,
                        AttendancePercentage = pct
                    };
                })
                .OrderByDescending(x => x.AttendancePercentage)
                .ToList();

            var topClass = classGroups.FirstOrDefault();
            var lowestClass = classGroups.LastOrDefault();

            string summary = $"Class attendance comparison for {targetDate:yyyy-MM-dd}: " +
                             (topClass != null ? $"Highest attendance: {topClass.ClassName} with {topClass.AttendancePercentage}% ({topClass.PresentCount}/{topClass.TotalStudents} present). " : "") +
                             (lowestClass != null && lowestClass != topClass ? $"Lowest attendance: {lowestClass.ClassName} with {lowestClass.AttendancePercentage}%." : "");

            var chartLabels = classGroups.Select(x => x.ClassName).ToArray();
            var chartData = classGroups.Select(x => (decimal)x.AttendancePercentage).ToArray();

            var visualData = new
            {
                title = $"Class-Wise Attendance Comparison ({targetDate:yyyy-MM-dd})",
                chart = new
                {
                    type = "bar",
                    labels = chartLabels,
                    datasets = new[]
                    {
                        new { label = "Attendance (%)", data = chartData }
                    }
                },
                table = new
                {
                    columns = new[] { "ClassName", "TotalStudents", "PresentCount", "AbsentCount", "AttendancePercentage" },
                    rows = classGroups
                }
            };

            return AiToolResult.Ok(summary, classGroups, "chart", visualData);
        }
    }
}
