using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Ai.Tools
{
    public class AdmissionSummaryTool : IAiTool
    {
        private readonly ISchoolService _schoolService;

        public AdmissionSummaryTool(ISchoolService schoolService)
        {
            _schoolService = schoolService;
        }

        public string Name => "admissions_get_summary";
        public string Description => "Retrieves school admission statistics, counts of received applications, admitted, enrolled, pending, and rejected admissions.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""branch"": { ""type"": ""string"", ""description"": ""Optional branch name"" },
                ""academicYear"": { ""type"": ""string"", ""description"": ""Optional academic year e.g. '2026-27'"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Staff", "Receptionist" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            string? branch = arguments.TryGetProperty("branch", out var bElem) ? bElem.GetString()?.Trim() : context.BranchName;
            string? academicYear = arguments.TryGetProperty("academicYear", out var ayElem) ? ayElem.GetString()?.Trim() : context.AcademicYear;

            var apps = await _schoolService.GetAllApplicationsAsync(null, branch, null, null, academicYear);

            int total = apps.Count;
            int enrolled = apps.Count(a => a.Status != null && (a.Status.Equals("Enrolled", StringComparison.OrdinalIgnoreCase) || a.Status.Equals("Admitted", StringComparison.OrdinalIgnoreCase)));
            int pending = apps.Count(a => a.Status != null && (a.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase) || a.Status.Equals("Under Review", StringComparison.OrdinalIgnoreCase)));
            int rejected = apps.Count(a => a.Status != null && a.Status.Equals("Rejected", StringComparison.OrdinalIgnoreCase));

            var classBreakdown = apps
                .GroupBy(a => a.AppliedClassGrade ?? "Unassigned")
                .Select(g => new
                {
                    Class = g.Key,
                    Total = g.Count(),
                    Enrolled = g.Count(a => a.Status != null && (a.Status.Equals("Enrolled", StringComparison.OrdinalIgnoreCase) || a.Status.Equals("Admitted", StringComparison.OrdinalIgnoreCase))),
                    Pending = g.Count(a => a.Status != null && a.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
                })
                .OrderBy(g => g.Class)
                .ToList();

            string branchLabel = !string.IsNullOrEmpty(branch) ? branch : "all branches";
            string summary = $"Admissions Summary ({branchLabel}): Total of **{total} application(s)**. Enrolled/Admitted: **{enrolled}**, Pending Review: **{pending}**, Rejected: {rejected}.";

            var visualData = new
            {
                title = $"Admissions Overview ({total} Applications)",
                columns = new[] { "Class", "Total", "Enrolled", "Pending" },
                rows = classBreakdown
            };

            return AiToolResult.Ok(summary, new
            {
                Total = total,
                Enrolled = enrolled,
                Pending = pending,
                Rejected = rejected,
                ClassBreakdown = classBreakdown
            }, "table", visualData);
        }
    }

    public class AdmissionApplicationsTool : IAiTool
    {
        private readonly ISchoolService _schoolService;

        public AdmissionApplicationsTool(ISchoolService schoolService)
        {
            _schoolService = schoolService;
        }

        public string Name => "admissions_get_applications";
        public string Description => "Searches student admission applications by candidate name, application number, status, applied class, or branch.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""search"": { ""type"": ""string"", ""description"": ""Candidate name or application number"" },
                ""status"": { ""type"": ""string"", ""description"": ""Filter by status: 'Pending', 'Enrolled', 'Admitted', 'Rejected'"" },
                ""branch"": { ""type"": ""string"", ""description"": ""Optional branch name"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Staff", "Receptionist" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            string? search = arguments.TryGetProperty("search", out var sElem) ? sElem.GetString()?.Trim() : null;
            string? status = arguments.TryGetProperty("status", out var stElem) ? stElem.GetString()?.Trim() : null;
            string? branch = arguments.TryGetProperty("branch", out var bElem) ? bElem.GetString()?.Trim() : context.BranchName;

            var apps = await _schoolService.GetAllApplicationsAsync(search, branch, null, status, context.AcademicYear);

            if (apps.Count == 0)
            {
                return AiToolResult.Ok($"No admission applications found matching query '{search ?? status}'.");
            }

            var rows = apps.Take(25).Select(a => new
            {
                ApplicationNo = a.RegistrationNo ?? a.AdmissionNo ?? a.Id.ToString(),
                CandidateName = $"{a.FirstName} {a.LastName}".Trim(),
                Class = a.AppliedClassGrade ?? "-",
                ParentName = a.FatherName ?? "-",
                ParentPhone = a.FatherContact ?? "-",
                Status = a.Status ?? "Pending",
                AppliedDate = a.CreatedAt.HasValue ? a.CreatedAt.Value.ToString("yyyy-MM-dd") : "-"
            }).ToList();

            string summary = $"Found {apps.Count} admission application(s). Displaying recent records.";
            var visualData = new
            {
                title = "Admission Applications Directory",
                columns = new[] { "ApplicationNo", "CandidateName", "Class", "ParentName", "ParentPhone", "Status", "AppliedDate" },
                rows = rows
            };

            return AiToolResult.Ok(summary, rows, "table", visualData);
        }
    }
}
