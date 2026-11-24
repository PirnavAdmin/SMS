using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Ai.Tools
{
    public class StudentSearchTool : IAiTool
    {
        private readonly AppDbContext _context;

        public StudentSearchTool(AppDbContext context)
        {
            _context = context;
        }

        public string Name => "student_search";
        public string Description => "Searches students in the school by name, admission number, roll number, or class/section with role-based security filters.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""query"": { ""type"": ""string"", ""description"": ""Student name, admission number, or roll number"" },
                ""className"": { ""type"": ""string"", ""description"": ""Optional class name e.g. 'Class 10' or '10'"" },
                ""sectionName"": { ""type"": ""string"", ""description"": ""Optional section name e.g. 'A' or 'B'"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Parent", "Student", "Accountant", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            var q = arguments.TryGetProperty("query", out var qElem) ? qElem.GetString()?.Trim().ToLowerInvariant() : null;
            var cls = arguments.TryGetProperty("className", out var cElem) ? cElem.GetString()?.Trim().ToLowerInvariant() : null;
            var sec = arguments.TryGetProperty("sectionName", out var sElem) ? sElem.GetString()?.Trim().ToLowerInvariant() : null;

            var query = _context.Students
                .AsNoTracking()
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .Include(s => s.Branch)
                .Where(s => !s.IsDeleted);

            // Role-based restrictions
            if (context.UserRole.Equals("Student", StringComparison.OrdinalIgnoreCase))
            {
                if (context.StudentId.HasValue && context.StudentId > 0)
                {
                    query = query.Where(s => s.StudentId == context.StudentId.Value);
                }
                else
                {
                    return AiToolResult.Fail("Student record could not be resolved for authenticated account.");
                }
            }
            else if (context.UserRole.Equals("Parent", StringComparison.OrdinalIgnoreCase))
            {
                if (context.LinkedChildStudentIds != null && context.LinkedChildStudentIds.Count > 0)
                {
                    query = query.Where(s => context.LinkedChildStudentIds.Contains(s.StudentId));
                }
                else
                {
                    return AiToolResult.Fail("No linked children found for this parent account.");
                }
            }
            else if (context.UserRole.Equals("Teacher", StringComparison.OrdinalIgnoreCase))
            {
                if (context.AssignedClassIds != null && context.AssignedClassIds.Count > 0)
                {
                    query = query.Where(s => context.AssignedClassIds.Contains(s.ClassId));
                }
            }

            if (!string.IsNullOrWhiteSpace(q))
            {
                query = query.Where(s =>
                    s.StudentName.ToLower().Contains(q) ||
                    s.AdmissionNumber.ToLower().Contains(q) ||
                    s.RollNumber.ToLower().Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(cls))
            {
                query = query.Where(s => s.ClassGrade != null && s.ClassGrade.ClassName != null && s.ClassGrade.ClassName.ToLower().Contains(cls));
            }

            if (!string.IsNullOrWhiteSpace(sec))
            {
                query = query.Where(s => s.ClassSection != null && s.ClassSection.SectionName != null && s.ClassSection.SectionName.ToLower().Contains(sec));
            }

            var students = await query.Take(25).ToListAsync();

            if (students.Count == 0)
            {
                return AiToolResult.Ok("No student records matched your search criteria in the database.");
            }

            var rows = students.Select(s => new
            {
                StudentId = s.StudentId,
                StudentName = s.StudentName,
                AdmissionNumber = s.AdmissionNumber,
                RollNumber = s.RollNumber,
                Class = s.ClassGrade?.ClassName ?? "-",
                Section = s.ClassSection?.SectionName ?? "-",
                Branch = s.Branch?.BranchName ?? "-",
                Status = s.Status
            }).ToList();

            var summary = $"Found {students.Count} student record(s) matching your criteria.";
            return AiToolResult.Ok(summary, rows, "table", new
            {
                title = "Student Directory Search Results",
                columns = new[] { "StudentId", "StudentName", "AdmissionNumber", "RollNumber", "Class", "Section", "Status" },
                rows = rows
            });
        }
    }

    public class StudentDetailsTool : IAiTool
    {
        private readonly AppDbContext _context;

        public StudentDetailsTool(AppDbContext context)
        {
            _context = context;
        }

        public string Name => "student_get_details";
        public string Description => "Retrieves detailed academic and demographic profile of a specific student by Student ID or Roll/Admission number.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""studentId"": { ""type"": ""integer"", ""description"": ""Specific Student ID if known"" },
                ""identifier"": { ""type"": ""string"", ""description"": ""Admission number, roll number, or student name"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Parent", "Student", "Accountant", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            int? studentId = arguments.TryGetProperty("studentId", out var idElem) && idElem.TryGetInt32(out var sid) ? sid : null;
            string? identifier = arguments.TryGetProperty("identifier", out var identElem) ? identElem.GetString()?.Trim() : null;

            // Security Resolution
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
                        return AiToolResult.Fail("Unauthorized: Access denied to unlinked student profile.");
                }
                else if (context.LinkedChildStudentIds.Count > 0)
                {
                    studentId = context.LinkedChildStudentIds.First();
                }
                else
                {
                    return AiToolResult.Fail("No linked children found for this parent account.");
                }
            }

            var query = _context.Students
                .AsNoTracking()
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .Include(s => s.Branch)
                .Include(s => s.AcademicYear)
                .Where(s => !s.IsDeleted);

            Student? student = null;
            if (studentId.HasValue && studentId.Value > 0)
            {
                student = await query.FirstOrDefaultAsync(s => s.StudentId == studentId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(identifier))
            {
                var lower = identifier.ToLowerInvariant();
                student = await query.FirstOrDefaultAsync(s =>
                    s.AdmissionNumber.ToLower() == lower ||
                    s.RollNumber.ToLower() == lower ||
                    s.StudentName.ToLower() == lower);
            }

            if (student == null)
            {
                return AiToolResult.Fail("Student record not found in the database.");
            }

            // Teacher check
            if (context.UserRole.Equals("Teacher", StringComparison.OrdinalIgnoreCase) &&
                context.AssignedClassIds != null && context.AssignedClassIds.Count > 0 &&
                !context.AssignedClassIds.Contains(student.ClassId))
            {
                return AiToolResult.Fail("Unauthorized: You are only permitted to access students in your assigned classes.");
            }

            var profile = new
            {
                StudentId = student.StudentId,
                StudentName = student.StudentName,
                AdmissionNumber = student.AdmissionNumber,
                RollNumber = student.RollNumber,
                Class = student.ClassGrade?.ClassName ?? "-",
                Section = student.ClassSection?.SectionName ?? "-",
                Branch = student.Branch?.BranchName ?? "-",
                AcademicYear = student.AcademicYear?.AcademicYearName ?? "-",
                DateOfBirth = student.DateOfBirth?.ToString("yyyy-MM-dd") ?? "-",
                Gender = student.Gender ?? "-",
                FatherName = student.FatherName ?? "-",
                MotherName = student.MotherName ?? "-",
                FatherMobile = student.FatherMobile ?? "-",
                MotherMobile = student.MotherMobile ?? "-",
                ContactEmail = student.Email ?? "-",
                Address = student.Address ?? "-",
                Status = student.Status
            };

            var summary = $"Profile of {student.StudentName} (Roll No: {student.RollNumber}, Adm: {student.AdmissionNumber}) enrolled in {profile.Class} - {profile.Section}.";
            return AiToolResult.Ok(summary, profile, "table", new
            {
                title = $"Student Profile: {student.StudentName}",
                columns = new[] { "Property", "Value" },
                rows = new[]
                {
                    new { Property = "Full Name", Value = profile.StudentName },
                    new { Property = "Admission Number", Value = profile.AdmissionNumber },
                    new { Property = "Roll Number", Value = profile.RollNumber },
                    new { Property = "Class & Section", Value = $"{profile.Class} - {profile.Section}" },
                    new { Property = "Branch", Value = profile.Branch },
                    new { Property = "Academic Year", Value = profile.AcademicYear },
                    new { Property = "Date of Birth", Value = profile.DateOfBirth },
                    new { Property = "Gender", Value = profile.Gender },
                    new { Property = "Father's Name", Value = profile.FatherName },
                    new { Property = "Father's Mobile", Value = profile.FatherMobile },
                    new { Property = "Status", Value = profile.Status }
                }
            });
        }
    }
}
