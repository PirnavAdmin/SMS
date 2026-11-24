using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Interfaces.FinanceManagement;

namespace SMS.Api.Services.Ai.Tools
{
    public class FeeStudentProfileTool : IAiTool
    {
        private readonly IFeeCollectionService _feeService;
        private readonly AppDbContext _context;

        public FeeStudentProfileTool(IFeeCollectionService feeService, AppDbContext context)
        {
            _feeService = feeService;
            _context = context;
        }

        public string Name => "fee_get_student_profile";
        public string Description => "Retrieves detailed student fee profile including total fees, paid amounts, pending balances, overdue dues, fee heads, and payment receipts.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""studentId"": { ""type"": ""integer"", ""description"": ""Student ID (optional for Parent/Student as it is securely resolved)"" },
                ""studentNameOrRoll"": { ""type"": ""string"", ""description"": ""Student name, admission number, or roll number"" },
                ""academicYear"": { ""type"": ""string"", ""description"": ""Academic Year, e.g. 2026-2027"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Accountant", "Teacher", "Parent", "Student" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            int? studentId = arguments.TryGetProperty("studentId", out var idElem) && idElem.TryGetInt32(out var sid) ? sid : null;
            string? search = arguments.TryGetProperty("studentNameOrRoll", out var sElem) ? sElem.GetString()?.Trim() : null;
            string? academicYear = arguments.TryGetProperty("academicYear", out var ayElem) ? ayElem.GetString()?.Trim() : null;

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
                        return AiToolResult.Fail("Unauthorized: Access denied to unlinked student fee record.");
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
                return AiToolResult.Fail("Please specify a valid Student Name, Roll Number, or Student ID.");
            }

            var profile = await _feeService.GetStudentFeeProfileAsync(studentId.Value, academicYear);
            if (profile == null)
            {
                return AiToolResult.Fail($"No fee profile found for student ID {studentId.Value}.");
            }

            decimal totalFee = profile.CurrentAcademicYearFees?.Sum(f => f.TotalAmount) ?? 0m;
            decimal totalPaid = profile.CurrentAcademicYearFees?.Sum(f => f.PaidAmount) ?? 0m;
            decimal pending = profile.TotalOutstandingBalance;
            decimal overdue = profile.CurrentAcademicYearFees?.Where(f => f.IsOverdue).Sum(f => f.RemainingAmount) ?? 0m;

            var headRows = (profile.CurrentAcademicYearFees ?? new List<FeeLineItemDto>()).Select(f => new
            {
                FeeHead = f.GetEffectiveHeadName(),
                DueDate = f.DueDate,
                TotalAmount = f.TotalAmount,
                PaidAmount = f.PaidAmount,
                Balance = f.RemainingAmount,
                Status = f.Status
            }).ToList();

            string summary = $"Fee Profile for {profile.StudentName} (Class: {profile.ClassName} - {profile.Section}): Total Fee: ₹{totalFee:N2}, Paid: ₹{totalPaid:N2}, Pending Balance: ₹{pending:N2}" +
                             (overdue > 0 ? $", Overdue: ₹{overdue:N2}." : ".");

            var visualData = new
            {
                title = $"Fee Profile: {profile.StudentName} ({profile.AdmissionNo})",
                metrics = new
                {
                    totalFee,
                    totalPaid,
                    pending,
                    overdue
                },
                chart = new
                {
                    type = "bar",
                    labels = new[] { "Total Fee", "Paid Amount", "Pending Balance", "Overdue" },
                    datasets = new[]
                    {
                        new { label = "Amount (₹)", data = new[] { totalFee, totalPaid, pending, overdue } }
                    }
                },
                table = new
                {
                    columns = new[] { "FeeHead", "DueDate", "TotalAmount", "PaidAmount", "Balance", "Status" },
                    rows = headRows
                }
            };

            return AiToolResult.Ok(summary, profile, "chart", visualData);
        }
    }

    public class FeeCollectionStatsTool : IAiTool
    {
        private readonly IFeeCollectionService _feeService;

        public FeeCollectionStatsTool(IFeeCollectionService feeService)
        {
            _feeService = feeService;
        }

        public string Name => "fee_get_collection_stats";
        public string Description => "Retrieves school-wide financial statistics, total expected revenue, total collected fee, total pending dues, and overdue amounts.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""branch"": { ""type"": ""string"", ""description"": ""Optional branch filter e.g. 'Main Campus'"" },
                ""academicYear"": { ""type"": ""string"", ""description"": ""Optional academic year e.g. '2026-2027'"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Accountant" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            string? branch = arguments.TryGetProperty("branch", out var bElem) ? bElem.GetString() : null;
            string? academicYear = arguments.TryGetProperty("academicYear", out var ayElem) ? ayElem.GetString() : null;

            var stats = await _feeService.GetDashboardStatsAsync(branch, academicYear);

            decimal totalCollected = stats.TotalCollectedRevenue;
            decimal totalPending = stats.TotalPendingDues;
            decimal totalOverdue = stats.TotalOutstandingDues;
            decimal totalExpected = stats.TotalExpectedRevenue;
            double collectionRate = stats.CollectionEfficiencyPercentage > 0 ? stats.CollectionEfficiencyPercentage : (totalExpected > 0 ? Math.Round((double)totalCollected / (double)totalExpected * 100.0, 1) : 0);

            string summary = $"Financial Summary: Total Expected Fee is ₹{totalExpected:N2}. Total Collected: ₹{totalCollected:N2} ({collectionRate}%). Pending Dues: ₹{totalPending:N2}, of which ₹{totalOverdue:N2} is overdue.";

            var visualData = new
            {
                title = "School Fee Collection Overview",
                chart = new
                {
                    type = "bar",
                    labels = new[] { "Collected", "Pending", "Overdue" },
                    datasets = new[]
                    {
                        new { label = "Amount (₹)", data = new[] { totalCollected, totalPending, totalOverdue } }
                    }
                },
                table = new
                {
                    columns = new[] { "Metric", "Amount (₹)", "Percentage" },
                    rows = new[]
                    {
                        new { Metric = "Total Expected Revenue", Amount = totalExpected, Percentage = "100%" },
                        new { Metric = "Total Fee Collected", Amount = totalCollected, Percentage = $"{collectionRate}%" },
                        new { Metric = "Total Pending Dues", Amount = totalPending, Percentage = totalExpected > 0 ? $"{Math.Round((double)totalPending / (double)totalExpected * 100.0, 1)}%" : "-" },
                        new { Metric = "Total Outstanding / Overdue", Amount = totalOverdue, Percentage = totalExpected > 0 ? $"{Math.Round((double)totalOverdue / (double)totalExpected * 100.0, 1)}%" : "-" }
                    }
                }
            };

            return AiToolResult.Ok(summary, stats, "chart", visualData);
        }
    }
}
