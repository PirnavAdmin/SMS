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
using Backend.Helpers;

namespace SMS.Api.Services.Ai.Tools
{
    public class StudentOverviewTool : IAiTool
    {
        private readonly AppDbContext _context;

        public StudentOverviewTool(AppDbContext context)
        {
            _context = context;
        }

        public string Name => "student_get_overview";
        public string Description => "Retrieves total student counts, active enrolled student metrics, and breakdown by class, section, branch, or academic year. Matches official school dashboard records.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""className"": { ""type"": ""string"", ""description"": ""Optional class name e.g. 'Class 10' or '10'"" },
                ""sectionName"": { ""type"": ""string"", ""description"": ""Optional section name e.g. 'A' or 'B'"" },
                ""branchName"": { ""type"": ""string"", ""description"": ""Optional branch name e.g. 'Madhapur Branch'"" },
                ""academicYear"": { ""type"": ""string"", ""description"": ""Optional academic year e.g. '2026-27'"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Parent", "Student", "Accountant", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            var cls = arguments.TryGetProperty("className", out var cElem) ? cElem.GetString()?.Trim() : null;
            var sec = arguments.TryGetProperty("sectionName", out var sElem) ? sElem.GetString()?.Trim() : null;
            var branchArg = arguments.TryGetProperty("branchName", out var bElem) ? bElem.GetString()?.Trim() : null;
            var ayArg = arguments.TryGetProperty("academicYear", out var yElem) ? yElem.GetString()?.Trim() : null;

            string? targetBranchName = !string.IsNullOrWhiteSpace(branchArg) ? branchArg : context.BranchName;
            int? targetBranchId = context.BranchId;

            if (!string.IsNullOrWhiteSpace(targetBranchName) && !targetBranchName.Equals("All Branches", StringComparison.OrdinalIgnoreCase) && !targetBranchName.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                var bObj = await _context.Branches.AsNoTracking()
                    .FirstOrDefaultAsync(b => b.BranchName.ToLower() == targetBranchName.ToLower() || b.BranchName.ToLower().Contains(targetBranchName.ToLower()));
                if (bObj != null)
                {
                    targetBranchId = bObj.BranchId;
                    targetBranchName = bObj.BranchName;
                }
            }

            string? targetAcademicYear = !string.IsNullOrWhiteSpace(ayArg) ? ayArg : context.AcademicYear;
            int? targetAcademicYearId = context.AcademicYearId;

            if (!targetAcademicYearId.HasValue && !string.IsNullOrWhiteSpace(targetAcademicYear) && !targetAcademicYear.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                var cleanYear = targetAcademicYear.Trim().Replace(" ", "");
                var activeYears = await _context.AcademicYears.AsNoTracking().Where(a => !a.IsDeleted).ToListAsync();
                var ayObj = activeYears.FirstOrDefault(a => string.Equals(a.AcademicYearName.Trim(), targetAcademicYear.Trim(), StringComparison.OrdinalIgnoreCase) ||
                                                           a.AcademicYearName.Contains(cleanYear, StringComparison.OrdinalIgnoreCase));
                targetAcademicYearId = ayObj?.AcademicYearId;
            }

            // Role-based filtering for students
            if (context.UserRole.Equals("Student", StringComparison.OrdinalIgnoreCase) && context.StudentId.HasValue)
            {
                var ownStudent = await _context.Students.AsNoTracking()
                    .Include(s => s.ClassGrade)
                    .Include(s => s.ClassSection)
                    .FirstOrDefaultAsync(s => s.StudentId == context.StudentId.Value && !s.IsDeleted);

                if (ownStudent != null)
                {
                    var summaryStu = $"You are enrolled as {ownStudent.StudentName} (Roll: {ownStudent.RollNumber}, Class: {ownStudent.ClassGrade?.ClassName} - {ownStudent.ClassSection?.SectionName}).";
                    return AiToolResult.Ok(summaryStu, new { ownStudent.StudentId, ownStudent.StudentName, Class = ownStudent.ClassGrade?.ClassName, Section = ownStudent.ClassSection?.SectionName });
                }
            }

            // 1. Query Active Students matching Dashboard query
            var studentQuery = _context.Students.AsNoTracking()
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .Include(s => s.Branch)
                .Where(s => !s.IsDeleted && (s.Status == "Active" || string.IsNullOrEmpty(s.Status)));

            if (targetBranchId.HasValue && targetBranchId.Value > 0)
            {
                studentQuery = studentQuery.Where(s => s.BranchId == targetBranchId.Value);
            }
            else if (!string.IsNullOrEmpty(targetBranchName) && !targetBranchName.Equals("All Branches", StringComparison.OrdinalIgnoreCase) && !targetBranchName.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                studentQuery = studentQuery.Where(s => s.Branch != null && (s.Branch.BranchName.ToLower() == targetBranchName.ToLower() || s.Branch.BranchName.ToLower().Contains(targetBranchName.ToLower())));
            }

            if (targetAcademicYearId.HasValue && targetAcademicYearId.Value > 0)
            {
                studentQuery = studentQuery.Where(s => s.AcademicYearId == targetAcademicYearId.Value);
            }

            if (context.UserRole.Equals("Teacher", StringComparison.OrdinalIgnoreCase) && context.AssignedClassIds != null && context.AssignedClassIds.Count > 0)
            {
                studentQuery = studentQuery.Where(s => context.AssignedClassIds.Contains(s.ClassId));
            }

            var candidateStudents = await studentQuery.ToListAsync();
            var canonicalStudents = StudentCanonicalHelper.DeduplicateStudents(candidateStudents);

            // Also check admission applications not yet in Students table to match exact Dashboard KPI
            var admissionAppsQuery = _context.AdmissionApplications.AsNoTracking()
                .Include(a => a.AppliedClass)
                .Where(a => !a.IsDeleted && (a.Status == "Enrolled" || a.Status == "Admitted"));

            if (!string.IsNullOrEmpty(targetBranchName) && !targetBranchName.Equals("All Branches", StringComparison.OrdinalIgnoreCase) && !targetBranchName.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                string cleanBranch = targetBranchName.Trim().ToLower();
                string cleanBranchBase = cleanBranch.Replace(" branch", "").Replace(" campus", "").Trim();
                admissionAppsQuery = admissionAppsQuery.Where(a => a.BranchName != null &&
                    (a.BranchName.ToLower() == cleanBranch || a.BranchName.ToLower() == cleanBranchBase || a.BranchName.ToLower().Contains(cleanBranchBase)));
            }

            var candidateAdmissions = await admissionAppsQuery.ToListAsync();
            var existingAdmSet = new HashSet<string>(
                canonicalStudents.SelectMany(s => new[] { s.AdmissionNumber, $"STU-{s.StudentId:D4}" })
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x!.Trim().ToLowerInvariant()),
                StringComparer.OrdinalIgnoreCase);

            var unmappedAdmissions = candidateAdmissions
                .Where(a => (!string.IsNullOrWhiteSpace(a.RegistrationNo) && !existingAdmSet.Contains(a.RegistrationNo.Trim().ToLowerInvariant())) &&
                            (string.IsNullOrWhiteSpace(a.AdmissionNo) || !existingAdmSet.Contains(a.AdmissionNo.Trim().ToLowerInvariant())))
                .ToList();

            int totalStudents = canonicalStudents.Count + unmappedAdmissions.Count;

            // Class filter if requested
            if (!string.IsNullOrWhiteSpace(cls))
            {
                var filtered = canonicalStudents.Where(s => s.ClassGrade != null && s.ClassGrade.ClassName != null &&
                    s.ClassGrade.ClassName.ToLower().Contains(cls.ToLower())).ToList();

                if (!string.IsNullOrWhiteSpace(sec))
                {
                    filtered = filtered.Where(s => s.ClassSection != null && s.ClassSection.SectionName != null &&
                        s.ClassSection.SectionName.Equals(sec, StringComparison.OrdinalIgnoreCase)).ToList();
                }

                int classTotal = filtered.Count;
                int boys = filtered.Count(s => s.Gender != null && (s.Gender.Equals("Male", StringComparison.OrdinalIgnoreCase) || s.Gender.Equals("Boy", StringComparison.OrdinalIgnoreCase)));
                int girls = filtered.Count(s => s.Gender != null && (s.Gender.Equals("Female", StringComparison.OrdinalIgnoreCase) || s.Gender.Equals("Girl", StringComparison.OrdinalIgnoreCase)));

                var classSecGroups = filtered
                    .GroupBy(s => s.ClassSection?.SectionName ?? "Unassigned")
                    .Select(g => new
                    {
                        Section = g.Key,
                        Total = g.Count(),
                        Boys = g.Count(s => s.Gender != null && s.Gender.StartsWith("M", StringComparison.OrdinalIgnoreCase)),
                        Girls = g.Count(s => s.Gender != null && s.Gender.StartsWith("F", StringComparison.OrdinalIgnoreCase))
                    }).ToList();

                var classSummary = $"There are **{classTotal} students** enrolled in **{cls}** {(string.IsNullOrEmpty(sec) ? "" : $"Section {sec}")} " +
                                   $"({boys} Boys, {girls} Girls) in {targetBranchName ?? "our school"}.";

                return AiToolResult.Ok(classSummary, new
                {
                    TotalStudents = classTotal,
                    Boys = boys,
                    Girls = girls,
                    SectionBreakdown = classSecGroups
                }, "table", new
                {
                    title = $"Student Enrollment - {cls}",
                    columns = new[] { "Section", "TotalStudents", "Boys", "Girls" },
                    rows = classSecGroups.Select(sg => new
                    {
                        Section = sg.Section,
                        TotalStudents = sg.Total,
                        Boys = sg.Boys,
                        Girls = sg.Girls
                    }).ToList()
                });
            }

            // Overall school-wide breakdown
            var classGroups = canonicalStudents
                .GroupBy(s => s.ClassGrade?.ClassName ?? "Unassigned")
                .Select(g => new
                {
                    Class = g.Key,
                    Count = g.Count(),
                    Boys = g.Count(s => s.Gender != null && s.Gender.StartsWith("M", StringComparison.OrdinalIgnoreCase)),
                    Girls = g.Count(s => s.Gender != null && s.Gender.StartsWith("F", StringComparison.OrdinalIgnoreCase)),
                    Sections = string.Join(", ", g.Select(s => s.ClassSection?.SectionName).Where(x => !string.IsNullOrEmpty(x)).Distinct())
                })
                .OrderBy(g => g.Class)
                .ToList();

            int overallBoys = canonicalStudents.Count(s => s.Gender != null && s.Gender.StartsWith("M", StringComparison.OrdinalIgnoreCase));
            int overallGirls = canonicalStudents.Count(s => s.Gender != null && s.Gender.StartsWith("F", StringComparison.OrdinalIgnoreCase));

            string branchLabel = !string.IsNullOrWhiteSpace(targetBranchName) ? targetBranchName : "Madhapur Branch";
            string summary = $"Our school currently has a total of **{totalStudents} enrolled students** in **{branchLabel}** (Academic Year: {targetAcademicYear ?? "2026-27"}).";

            var rows = classGroups.Select(cg => new
            {
                Class = cg.Class,
                TotalStudents = cg.Count,
                Boys = cg.Boys,
                Girls = cg.Girls,
                Sections = string.IsNullOrEmpty(cg.Sections) ? "-" : cg.Sections
            }).ToList();

            return AiToolResult.Ok(summary, new
            {
                TotalStudents = totalStudents,
                ActiveStudents = canonicalStudents.Count,
                UnmappedAdmissions = unmappedAdmissions.Count,
                Boys = overallBoys,
                Girls = overallGirls,
                Branch = branchLabel,
                AcademicYear = targetAcademicYear ?? "2026-27"
            }, "table", new
            {
                title = $"Total School Student Enrollment Summary ({totalStudents} Students)",
                columns = new[] { "Class", "TotalStudents", "Boys", "Girls", "Sections" },
                rows = rows
            });
        }
    }

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

            // If the query is actually an enrollment/count inquiry, seamlessly delegate to StudentOverviewTool
            if (!string.IsNullOrWhiteSpace(q) && (q.Contains("how many") || q.Contains("count") || q.Contains("our school") || q.Contains("total") || q.Contains("strength") || q == "students" || q == "student" || q == "all"))
            {
                return await new StudentOverviewTool(_context).ExecuteAsync(context, arguments);
            }

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
