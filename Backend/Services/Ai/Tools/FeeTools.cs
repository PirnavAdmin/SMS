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

    public class FeeDefaultersTool : IAiTool
    {
        private readonly IFeeCollectionService _feeService;

        public FeeDefaultersTool(IFeeCollectionService feeService)
        {
            _feeService = feeService;
        }

        public string Name => "fee_get_defaulters";
        public string Description => "Retrieves list of students with unpaid school fees, pending balances, overdue days, parent contact numbers, and critical defaulter metrics.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""className"": { ""type"": ""string"", ""description"": ""Optional class name filter e.g. 'Class 10' or '10'"" },
                ""sectionName"": { ""type"": ""string"", ""description"": ""Optional section name filter e.g. 'A'"" },
                ""minDaysOverdue"": { ""type"": ""integer"", ""description"": ""Minimum days overdue (default 0 for all pending)"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Accountant" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            string? className = arguments.TryGetProperty("className", out var cElem) ? cElem.GetString()?.Trim() : null;
            string? sectionName = arguments.TryGetProperty("sectionName", out var sElem) ? sElem.GetString()?.Trim() : null;
            int minDays = arguments.TryGetProperty("minDaysOverdue", out var mElem) && mElem.TryGetInt32(out var md) ? md : 0;

            var dues = await _feeService.GetDueFeesSummaryAsync(className, sectionName, minDays);

            if (dues == null || dues.Items == null || dues.Items.Count == 0)
            {
                return AiToolResult.Ok("No fee defaulters found for the specified criteria.");
            }

            var rows = dues.Items.Take(30).Select(d => new
            {
                StudentId = d.StudentId,
                AdmissionNo = d.AdmissionNo,
                StudentName = d.StudentName,
                Class = $"{d.ClassName} - {d.Section}".Trim('-', ' '),
                ParentName = d.ParentName,
                ParentMobile = d.ParentMobile,
                DueAmount = $"₹{d.TotalDueAmount:N0}",
                OverdueDays = d.MaxDaysOverdue
            }).ToList();

            string summary = $"Fee Defaulters Summary: Found **{dues.TotalOverdueStudents} student(s)** with unpaid fees. " +
                             $"Total Outstanding Overdue: **{dues.FormattedTotalOverdue}**, Critical Defaulters: **{dues.CriticalDefaultersCount}**.";

            var visualData = new
            {
                title = $"Students with Pending Fees ({dues.TotalOverdueStudents} Students - Total {dues.FormattedTotalOverdue})",
                columns = new[] { "AdmissionNo", "StudentName", "Class", "ParentName", "ParentMobile", "DueAmount", "OverdueDays" },
                rows = rows
            };

            return AiToolResult.Ok(summary, dues, "table", visualData);
        }
    }

    public class FeeCompareCollectionsTool : IAiTool
    {
        private readonly AppDbContext _context;

        public FeeCompareCollectionsTool(AppDbContext context)
        {
            _context = context;
        }

        public string Name => "fee_compare_collections";
        public string Description => "Compares fee collections between months, terms, or recent periods to identify collection trends, growth, and total revenue.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""monthsBack"": { ""type"": ""integer"", ""description"": ""Number of months to compare (default 3)"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Accountant" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            int months = arguments.TryGetProperty("monthsBack", out var mElem) && mElem.TryGetInt32(out var mb) ? Math.Max(2, mb) : 3;

            var now = DateTime.UtcNow;
            var startDate = new DateTime(now.Year, now.Month, 1).AddMonths(-months + 1);

            var payments = await _context.FeePayments
                .AsNoTracking()
                .Where(p => p.PaymentDate >= startDate)
                .ToListAsync();

            var monthlyGroups = payments
                .GroupBy(p => new { Year = p.PaymentDate.Year, Month = p.PaymentDate.Month })
                .Select(g => new
                {
                    MonthLabel = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    TotalCollected = g.Sum(p => p.Amount),
                    TransactionsCount = g.Count()
                })
                .OrderBy(g => g.Year).ThenBy(g => g.Month)
                .ToList();

            var thisMonth = monthlyGroups.LastOrDefault();
            var prevMonth = monthlyGroups.Count >= 2 ? monthlyGroups[monthlyGroups.Count - 2] : null;

            decimal thisAmt = thisMonth?.TotalCollected ?? 0m;
            decimal prevAmt = prevMonth?.TotalCollected ?? 0m;
            decimal diff = thisAmt - prevAmt;
            string trend = diff >= 0 ? $"+₹{diff:N0} (Upward)" : $"-₹{Math.Abs(diff):N0} (Downward)";

            string summary = $"Fee Collection Comparison: This Month ({thisMonth?.MonthLabel ?? "Current"}) collected **₹{thisAmt:N0}**, compared to Previous Month ({prevMonth?.MonthLabel ?? "Prior"}) which collected **₹{prevAmt:N0}**. Net Difference: **{trend}**.";

            var visualData = new
            {
                title = "Monthly Fee Collection Trend & Comparison",
                chart = new
                {
                    type = "bar",
                    labels = monthlyGroups.Select(m => m.MonthLabel).ToArray(),
                    datasets = new[]
                    {
                        new { label = "Collection (₹)", data = monthlyGroups.Select(m => m.TotalCollected).ToArray() }
                    }
                },
                table = new
                {
                    columns = new[] { "Month", "TotalCollected", "Transactions" },
                    rows = monthlyGroups.Select(m => new
                    {
                        Month = m.MonthLabel,
                        TotalCollected = $"₹{m.TotalCollected:N0}",
                        Transactions = m.TransactionsCount
                    }).ToList()
                }
            };

            return AiToolResult.Ok(summary, monthlyGroups, "chart", visualData);
        }
    }
}
