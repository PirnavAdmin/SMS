namespace SMS.Api.Repositories.Implementations.FinanceManagement;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

public class FeeCollectionRepository : IFeeCollectionRepository
{
    private readonly AppDbContext _context;

    public FeeCollectionRepository(AppDbContext context)
    {
        _context = context;
    }

    private static string NormalizeGrade(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return string.Empty;
        string lower = name.Trim().ToLowerInvariant();

        if (lower.Contains("playgroup") || lower.Contains("play group") || lower.Contains("pg")) return "playgroup";
        if (lower.Contains("nursery") || lower.Contains("nurs")) return "nursery";
        if (lower.Contains("lkg") || lower.Contains("l.k.g")) return "lkg";
        if (lower.Contains("ukg") || lower.Contains("u.k.g")) return "ukg";
        if (lower.Contains("prep")) return "prep";

        var match = System.Text.RegularExpressions.Regex.Match(lower, @"(?:class|grade)?\s*(\d+)");
        if (match.Success)
        {
            return match.Groups[1].Value;
        }

        string clean = System.Text.RegularExpressions.Regex.Replace(lower, @"^class\s+", "");
        clean = System.Text.RegularExpressions.Regex.Replace(clean, @"[-\s][a-z]$", "");
        clean = System.Text.RegularExpressions.Regex.Replace(clean, @"(st|nd|rd|th)$", "");
        return clean.Trim();
    }

    private static bool MatchesClassName(string? classA, string? classB)
    {
        string gA = NormalizeGrade(classA);
        string gB = NormalizeGrade(classB);
        if (string.IsNullOrEmpty(gA) || string.IsNullOrEmpty(gB)) return false;
        return gA.Equals(gB, StringComparison.OrdinalIgnoreCase);
    }

    private static bool MatchesSection(string? structSec, string? studentSec)
    {
        if (string.IsNullOrWhiteSpace(structSec)) return true;
        string s = structSec.Trim().ToLowerInvariant();
        if (s == "all" || s == "all sections" || s == "all section" || s == "all-sections" || s == "all_sections")
            return true;
        if (string.IsNullOrWhiteSpace(studentSec)) return true;
        return s.Equals(studentSec.Trim().ToLowerInvariant(), StringComparison.OrdinalIgnoreCase);
    }

    public async Task<FeeCollectionStudentRosterResponseDto> GetStudentRosterAsync(
        string? search, string? className, string? sectionName, string? studentType, int page, int pageSize)
    {
        var query = _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .Include(s => s.Branch)
            .Include(s => s.AcademicYear)
            .Where(s => !s.IsDeleted && s.Status == "Active");

        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            string cleanClass = className.Trim();
            query = query.Where(s => s.ClassGrade != null && s.ClassGrade.ClassName != null && 
                (s.ClassGrade.ClassName == cleanClass || 
                 s.ClassGrade.ClassName.StartsWith(cleanClass + " ") || 
                 s.ClassGrade.ClassName.StartsWith(cleanClass + "-")));
        }

        if (!string.IsNullOrWhiteSpace(sectionName) && !sectionName.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            string cleanSec = sectionName.Trim();
            query = query.Where(s => s.ClassSection != null && s.ClassSection.SectionName != null && 
                (s.ClassSection.SectionName == cleanSec || s.ClassSection.SectionName.Contains(cleanSec)));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(st =>
                (st.StudentName != null && st.StudentName.ToLower().Contains(s)) ||
                (st.AdmissionNumber != null && st.AdmissionNumber.ToLower().Contains(s)) ||
                (st.RollNumber != null && st.RollNumber.ToLower().Contains(s)));
        }

        int totalRecords = await query.CountAsync();
        int safePage = page <= 0 ? 1 : page;
        int safePageSize = pageSize <= 0 ? 50 : pageSize;

        var students = await query
            .OrderBy(s => s.ClassGrade != null ? s.ClassGrade.ClassName : "")
            .ThenBy(s => s.StudentName)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        var studentIdsStr = students.Select(s => s.StudentId.ToString()).ToList();
        var admNos = students.Where(s => !string.IsNullOrEmpty(s.AdmissionNumber)).Select(s => s.AdmissionNumber!).ToList();

        var payments = await _context.FeePayments.AsNoTracking()
            .Where(p => studentIdsStr.Contains(p.StudentId) || admNos.Contains(p.StudentId))
            .ToListAsync();

        var feeStructures = await _context.DynamicFeeStructures.AsNoTracking().ToListAsync();

        var studentIntIds = students.Select(s => s.StudentId).ToList();
        var hostelAllocations = await _context.StudentBedAllocations.AsNoTracking()
            .Where(b => b.StudentId.HasValue && studentIntIds.Contains(b.StudentId.Value) && b.Status == "Occupied")
            .Select(b => b.StudentId!.Value)
            .ToListAsync();

        var items = new List<FeeCollectionStudentSummaryDto>();

        foreach (var st in students)
        {
            bool isHosteller = hostelAllocations.Contains(st.StudentId);
            string stType = isHosteller ? "Hosteller" : "Day Scholar";

            if (!string.IsNullOrWhiteSpace(studentType) && !studentType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                if (!stType.Equals(studentType.Trim(), StringComparison.OrdinalIgnoreCase))
                    continue;
            }

            string cName = st.ClassGrade?.ClassName ?? "Class 10";
            string sName = st.ClassSection?.SectionName ?? "A";

            decimal baseClassFee = 0m;
            var matchedStructure = feeStructures.FirstOrDefault(f => 
                !string.IsNullOrEmpty(f.ClassName) && 
                MatchesClassName(f.ClassName, cName) &&
                MatchesSection(f.Section, sName));

            if (matchedStructure != null && matchedStructure.TotalAmount > 0)
            {
                baseClassFee = matchedStructure.TotalAmount;
            }

            var stPayments = payments.Where(p => p.StudentId == st.StudentId.ToString() || p.StudentId == st.AdmissionNumber).ToList();
            decimal paidAmt = stPayments.Sum(p => p.Amount);
            decimal discountAmt = stPayments.Sum(p => p.DiscountAmount);
            decimal fineAmt = stPayments.Sum(p => p.FineAmount);

            decimal outstanding = Math.Max(0m, baseClassFee - paidAmt - discountAmt + fineAmt);

            items.Add(new FeeCollectionStudentSummaryDto
            {
                StudentId = st.StudentId,
                AdmissionNo = st.AdmissionNumber ?? $"REG-{st.StudentId}",
                StudentName = st.StudentName ?? $"Student #{st.StudentId}",
                FirstName = st.StudentName ?? "",
                LastName = "",
                ClassId = st.ClassId,
                ClassName = cName,
                SectionId = st.SectionId,
                Section = sName,
                StudentType = stType,
                Branch = st.Branch?.BranchName ?? "Main Campus",
                AcademicYear = st.AcademicYear?.AcademicYearName ?? "2026-2027",
                FatherName = st.FatherName ?? "",
                FatherMobile = st.FatherMobile ?? "",
                TotalFee = baseClassFee,
                PaidFee = paidAmt,
                TotalOutstanding = outstanding,
                CurrentYearDue = outstanding,
                PreviousYearsDue = 0m,
                Status = st.Status ?? "Active"
            });
        }

        return new FeeCollectionStudentRosterResponseDto
        {
            TotalRecords = totalRecords,
            Page = safePage,
            PageSize = safePageSize,
            Items = items
        };
    }

    public async Task<StudentFeeProfileResponseDto?> GetStudentFeeProfileAsync(int studentId, string? academicYear)
    {
        var student = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .Include(s => s.Branch)
            .Include(s => s.AcademicYear)
            .FirstOrDefaultAsync(s => s.StudentId == studentId);

        if (student == null) return null;

        string admNo = student.AdmissionNumber ?? $"REG-{student.StudentId}";
        string studentIdStr = student.StudentId.ToString();
        string cName = student.ClassGrade?.ClassName ?? "Class 10";
        string sName = student.ClassSection?.SectionName ?? "A";

        var payments = await _context.FeePayments.AsNoTracking()
            .Where(p => p.StudentId == studentIdStr || p.StudentId == admNo)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        decimal totalPaid = payments.Sum(p => p.Amount);
        decimal totalDiscounts = payments.Sum(p => p.DiscountAmount);

        bool isHosteller = await _context.StudentBedAllocations.AsNoTracking()
            .AnyAsync(b => b.StudentId == student.StudentId && b.Status == "Occupied");

        var feeStructures = await _context.DynamicFeeStructures.AsNoTracking().ToListAsync();
        var matchedStructure = feeStructures.FirstOrDefault(f => 
            !string.IsNullOrEmpty(f.ClassName) && 
            MatchesClassName(f.ClassName, cName) &&
            MatchesSection(f.Section, sName));

        decimal totalExpectedFee = matchedStructure != null && matchedStructure.TotalAmount > 0 
            ? matchedStructure.TotalAmount 
            : 0m;

        var lineItems = new List<FeeLineItemDto>();
        decimal runningPaid = totalPaid;

        if (totalExpectedFee > 0m)
        {
            List<FeeStructureItemDto>? parsedItems = null;
            if (!string.IsNullOrEmpty(matchedStructure?.ItemsJson))
            {
                try
                {
                    parsedItems = JsonSerializer.Deserialize<List<FeeStructureItemDto>>(matchedStructure.ItemsJson);
                }
                catch { }
            }

            if (parsedItems != null && parsedItems.Count > 0)
            {
                foreach (var pi in parsedItems)
                {
                    decimal itemTotal = pi.Amount;
                    decimal itemPaid = Math.Min(itemTotal, runningPaid);
                    runningPaid -= itemPaid;
                    decimal itemRemaining = Math.Max(0m, itemTotal - itemPaid);

                    decimal termAmt = Math.Round(itemTotal / 4m, 0);
                    decimal termRunningPaid = itemPaid;
                    var itemTerms = new List<FeeTermItemDto>();
                    for (int tIdx = 1; tIdx <= 4; tIdx++)
                    {
                        decimal thisTermAmt = (tIdx == 4) ? (itemTotal - termAmt * 3m) : termAmt;
                        decimal thisTermPaid = Math.Min(thisTermAmt, termRunningPaid);
                        termRunningPaid -= thisTermPaid;
                        decimal thisTermRemaining = Math.Max(0m, thisTermAmt - thisTermPaid);
                        bool isTermOverdue = thisTermRemaining > 0 && tIdx <= 2;
                        itemTerms.Add(new FeeTermItemDto
                        {
                            TermId = $"term-{tIdx}",
                            TermNumber = tIdx,
                            TermName = $"Term {tIdx}",
                            DueDate = tIdx switch { 1 => "2026-04-15", 2 => "2026-07-15", 3 => "2026-10-15", _ => "2027-01-15" },
                            Amount = thisTermAmt,
                            PaidAmount = thisTermPaid,
                            RemainingAmount = thisTermRemaining,
                            Status = thisTermRemaining == 0 ? "PAID" : (thisTermPaid > 0 ? "PARTIAL" : (isTermOverdue ? "OVERDUE" : "PENDING")),
                            IsOverdue = isTermOverdue,
                            DaysOverdue = isTermOverdue ? (tIdx == 1 ? 134 : 45) : 0
                        });
                    }

                    bool isOverdue = itemRemaining > 0 && itemTerms.Any(t => t.IsOverdue);
                    lineItems.Add(new FeeLineItemDto
                    {
                        FeeHeadId = !string.IsNullOrEmpty(pi.FeeHeadId) ? pi.FeeHeadId : "head-default",
                        HeadName = !string.IsNullOrEmpty(pi.FeeHeadName) ? pi.FeeHeadName : "School Fee",
                        Frequency = "Term-Wise (4 Terms)",
                        DueDate = "2026-04-15",
                        TotalAmount = itemTotal,
                        PaidAmount = itemPaid,
                        RemainingAmount = itemRemaining,
                        Status = itemRemaining == 0 ? "PAID" : (itemPaid > 0 ? "PARTIAL" : (isOverdue ? "OVERDUE" : "PENDING")),
                        IsOverdue = isOverdue,
                        DaysOverdue = isOverdue ? itemTerms.Max(t => t.DaysOverdue) : 0,
                        Terms = itemTerms
                    });
                }
            }
            else
            {
                decimal itemTotal = totalExpectedFee;
                decimal itemPaid = Math.Min(itemTotal, runningPaid);
                runningPaid -= itemPaid;
                decimal itemRemaining = Math.Max(0m, itemTotal - itemPaid);
                decimal termAmt = Math.Round(itemTotal / 4m, 0);
                decimal termRunningPaid = itemPaid;
                var itemTerms = new List<FeeTermItemDto>();
                for (int tIdx = 1; tIdx <= 4; tIdx++)
                {
                    decimal thisTermAmt = (tIdx == 4) ? (itemTotal - termAmt * 3m) : termAmt;
                    decimal thisTermPaid = Math.Min(thisTermAmt, termRunningPaid);
                    termRunningPaid -= thisTermPaid;
                    decimal thisTermRemaining = Math.Max(0m, thisTermAmt - thisTermPaid);
                    bool isTermOverdue = thisTermRemaining > 0 && tIdx <= 2;
                    itemTerms.Add(new FeeTermItemDto
                    {
                        TermId = $"term-{tIdx}",
                        TermNumber = tIdx,
                        TermName = $"Term {tIdx}",
                        DueDate = tIdx switch { 1 => "2026-04-15", 2 => "2026-07-15", 3 => "2026-10-15", _ => "2027-01-15" },
                        Amount = thisTermAmt,
                        PaidAmount = thisTermPaid,
                        RemainingAmount = thisTermRemaining,
                        Status = thisTermRemaining == 0 ? "PAID" : (thisTermPaid > 0 ? "PARTIAL" : (isTermOverdue ? "OVERDUE" : "PENDING")),
                        IsOverdue = isTermOverdue,
                        DaysOverdue = isTermOverdue ? (tIdx == 1 ? 134 : 45) : 0
                    });
                }

                bool isOverdue = itemRemaining > 0 && itemTerms.Any(t => t.IsOverdue);
                lineItems.Add(new FeeLineItemDto
                {
                    FeeHeadId = "head-tuition",
                    HeadName = "Academic Fee",
                    Frequency = "Term-Wise (4 Terms)",
                    DueDate = "2026-04-15",
                    TotalAmount = itemTotal,
                    PaidAmount = itemPaid,
                    RemainingAmount = itemRemaining,
                    Status = itemRemaining == 0 ? "PAID" : (itemPaid > 0 ? "PARTIAL" : (isOverdue ? "OVERDUE" : "PENDING")),
                    IsOverdue = isOverdue,
                    DaysOverdue = isOverdue ? itemTerms.Max(t => t.DaysOverdue) : 0,
                    Terms = itemTerms
                });
            }
        }

        decimal totalOutstanding = lineItems.Sum(l => l.RemainingAmount);

        var receiptDtos = payments.Select(p => new StudentPaymentReceiptSummaryDto
        {
            ReceiptNo = !string.IsNullOrEmpty(p.ReceiptNo) ? p.ReceiptNo : $"REC-2026-{p.Id:D4}",
            PaymentDate = p.PaymentDate,
            PaymentMethod = p.PaymentMethod ?? "Cash",
            AmountPaid = p.Amount,
            Status = p.Status ?? "Paid",
            TransactionId = p.TransactionId ?? "",
            PaidHeads = new List<string> { "Tuition Fee", "Admission Fee" }
        }).ToList();

        return new StudentFeeProfileResponseDto
        {
            StudentId = student.StudentId,
            AdmissionNo = admNo,
            StudentName = student.StudentName ?? $"Student #{student.StudentId}",
            ClassName = cName,
            Section = sName,
            StudentType = isHosteller ? "Hosteller" : "Day Scholar",
            Branch = student.Branch?.BranchName ?? "Main Campus",
            AcademicYear = student.AcademicYear?.AcademicYearName ?? "2026-2027",
            FatherName = student.FatherName ?? "",
            FatherMobile = student.FatherMobile ?? "",
            CurrentYearDues = totalOutstanding,
            PreviousYearsArrears = 0m,
            TotalConcessions = totalDiscounts,
            TotalOutstandingBalance = totalOutstanding,
            FineRule = new LateFineRuleDetailDto
            {
                RuleName = "Standard Monthly Late Fine Rule",
                DaysOverdue = lineItems.Any(l => l.IsOverdue) ? lineItems.Max(l => l.DaysOverdue) : 0,
                CalculatedFineAmount = 0m,
                IsWaived = totalOutstanding == 0
            },
            AvailableScholarships = new List<ConcessionOptionDto>
            {
                new ConcessionOptionDto { Id = "sch-merit", Name = "Merit Scholarship (15%)", Type = "Percentage", Value = 15, ApplicableHead = "Tuition Fee" },
                new ConcessionOptionDto { Id = "sch-sports", Name = "Sports Excellence (20%)", Type = "Percentage", Value = 20, ApplicableHead = "Tuition Fee" },
                new ConcessionOptionDto { Id = "sch-ews", Name = "EWS Special Grant (₹5,000 Flat)", Type = "Fixed", Value = 5000, ApplicableHead = "Tuition Fee" }
            },
            AvailableDiscounts = new List<ConcessionOptionDto>
            {
                new ConcessionOptionDto { Id = "disc-sibling", Name = "Sibling Discount (10%)", Type = "Percentage", Value = 10, ApplicableHead = "Tuition Fee" },
                new ConcessionOptionDto { Id = "disc-staff", Name = "Staff Child Concession (50%)", Type = "Percentage", Value = 50, ApplicableHead = "Tuition Fee" },
                new ConcessionOptionDto { Id = "disc-early", Name = "Early Bird Full Payment (5%)", Type = "Percentage", Value = 5, ApplicableHead = "Tuition Fee" }
            },
            CurrentAcademicYearFees = lineItems,
            RecordedReceipts = receiptDtos
        };
    }

    public async Task<CollectFeePaymentResponseDto> CollectPaymentAsync(CollectFeePaymentRequestDto request)
    {
        if (request == null || request.TotalAmountPaid <= 0)
        {
            throw new ArgumentException("A valid payment amount is required.");
        }

        string receiptNo = $"REC-2026-{Random.Shared.Next(1000, 9999)}";

        var payment = new FeePayment
        {
            ReceiptNo = receiptNo,
            StudentId = request.StudentId.ToString(),
            Amount = request.TotalAmountPaid,
            DiscountAmount = request.ConcessionDiscountAmount,
            FineAmount = request.IsFineWaived ? 0m : request.FineAmount,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = request.PaymentMethod ?? "Cash",
            TransactionId = !string.IsNullOrEmpty(request.TransactionId) ? request.TransactionId : request.ChequeNo ?? "",
            Status = "Completed"
        };

        _context.FeePayments.Add(payment);
        await _context.SaveChangesAsync();

        var profile = await GetStudentFeeProfileAsync(request.StudentId, request.AcademicYear);
        decimal remaining = profile != null ? profile.TotalOutstandingBalance : 0m;

        return new CollectFeePaymentResponseDto
        {
            Success = true,
            Message = "Payment collected and receipt generated successfully.",
            ReceiptNo = receiptNo,
            PaymentId = payment.Id,
            PaymentDate = payment.PaymentDate,
            AmountPaid = payment.Amount,
            RemainingOutstanding = remaining
        };
    }

    public async Task<DueFeesSummaryResponseDto> GetDueFeesSummaryAsync(
        string? className, string? sectionName, int minDaysOverdue)
    {
        var roster = await GetStudentRosterAsync(null, className, sectionName, null, 1, 200);
        var overdueItems = new List<DueFeeStudentDto>();

        foreach (var st in roster.Items)
        {
            if (st.TotalOutstanding > 0)
            {
                int days = 134;
                if (minDaysOverdue > 0 && days < minDaysOverdue) continue;

                overdueItems.Add(new DueFeeStudentDto
                {
                    StudentId = st.StudentId,
                    AdmissionNo = st.AdmissionNo,
                    StudentName = st.StudentName,
                    ClassName = st.ClassName,
                    Section = st.Section,
                    ParentName = st.FatherName,
                    ParentMobile = st.FatherMobile,
                    TotalDueAmount = st.TotalOutstanding,
                    MaxDaysOverdue = days,
                    OverdueHeads = new List<string> { "Tuition Fee (Term 1 & 2)", "Admission Fee", "Textbook Fee" }
                });
            }
        }

        return new DueFeesSummaryResponseDto
        {
            TotalOverdueStudents = overdueItems.Count,
            TotalOverdueAmount = overdueItems.Sum(o => o.TotalDueAmount),
            CriticalDefaultersCount = overdueItems.Count(o => o.MaxDaysOverdue > 90),
            Items = overdueItems
        };
    }

    public async Task<List<PromotedDueStudentDto>> GetPromotedStudentsDuesAsync(
        string? search = null, string? className = null, string? previousAcademicYear = null, string? status = null)
    {
        var query = _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .Include(s => s.AcademicYear)
            .Where(s => !s.IsDeleted && s.Status == "Active");

        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            string cleanClass = className.Trim();
            query = query.Where(s => s.ClassGrade != null && s.ClassGrade.ClassName != null &&
                (s.ClassGrade.ClassName == cleanClass ||
                 s.ClassGrade.ClassName.StartsWith(cleanClass + " ") ||
                 s.ClassGrade.ClassName.StartsWith(cleanClass + "-")));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(st =>
                (st.StudentName != null && st.StudentName.ToLower().Contains(s)) ||
                (st.AdmissionNumber != null && st.AdmissionNumber.ToLower().Contains(s)) ||
                (st.RollNumber != null && st.RollNumber.ToLower().Contains(s)));
        }

        var students = await query.ToListAsync();

        var studentIdsStr = students.Select(s => s.StudentId.ToString()).ToList();
        var admNos = students.Where(s => !string.IsNullOrEmpty(s.AdmissionNumber)).Select(s => s.AdmissionNumber!).ToList();

        var payments = await _context.FeePayments.AsNoTracking()
            .Where(p => studentIdsStr.Contains(p.StudentId) || admNos.Contains(p.StudentId))
            .ToListAsync();

        var feeStructures = await _context.DynamicFeeStructures.AsNoTracking().ToListAsync();

        var resultList = new List<PromotedDueStudentDto>();

        foreach (var st in students)
        {
            string cName = st.ClassGrade?.ClassName ?? "Class 10";
            string sName = st.ClassSection?.SectionName ?? "A";
            string prevClass = GetPreviousClassName(cName);
            var prevYears = new List<string> { string.IsNullOrWhiteSpace(previousAcademicYear) || previousAcademicYear.Equals("ALL", StringComparison.OrdinalIgnoreCase) ? "2025-2026" : previousAcademicYear };

            decimal prevFeeTotal = 0m;
            var prevStructure = feeStructures.FirstOrDefault(f =>
                !string.IsNullOrEmpty(f.ClassName) &&
                MatchesClassName(f.ClassName, prevClass));

            if (prevStructure != null && prevStructure.TotalAmount > 0)
            {
                prevFeeTotal = prevStructure.TotalAmount;
            }
            else
            {
                prevFeeTotal = 12000m;
            }

            var stPayments = payments.Where(p =>
                p.StudentId == st.StudentId.ToString() ||
                p.StudentId == st.AdmissionNumber).ToList();

            decimal totalPaid = stPayments.Sum(p => p.Amount);
            decimal previousArrears = Math.Max(0m, prevFeeTotal - totalPaid);

            if (previousArrears > 0)
            {
                string computedStatus = totalPaid > 0 ? "Partially Paid" : "Due";

                if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
                {
                    if (!computedStatus.Equals(status.Trim(), StringComparison.OrdinalIgnoreCase))
                        continue;
                }

                resultList.Add(new PromotedDueStudentDto
                {
                    StudentId = st.StudentId,
                    AdmissionNo = st.AdmissionNumber ?? $"ADM-{st.StudentId:D4}",
                    StudentName = st.StudentName ?? $"Student #{st.StudentId}",
                    CurrentClass = cName,
                    Section = sName,
                    PreviousClass = prevClass,
                    PreviousAcademicYears = prevYears,
                    PreviousAcademicYear = prevYears.FirstOrDefault() ?? "2025-2026",
                    PreviousArrearsAmount = previousArrears,
                    PendingComponentsCount = 2,
                    Status = computedStatus,
                    FatherName = st.FatherName ?? "",
                    FatherMobile = st.FatherMobile ?? "",
                    BreakdownByYear = new List<PromotedDueBreakdownGroupDto>
                    {
                        new PromotedDueBreakdownGroupDto
                        {
                            AcademicYear = prevYears.FirstOrDefault() ?? "2025-2026",
                            ClassName = prevClass,
                            TotalPending = previousArrears,
                            Items = new List<PromotedDueItemDto>
                            {
                                new PromotedDueItemDto
                                {
                                    Id = $"item-prev-1-{st.StudentId}",
                                    FeeHeadName = "Tuition Fee Arrears",
                                    TermName = "Term 2",
                                    DueDate = "2026-03-15",
                                    OriginalAmount = prevFeeTotal * 0.7m,
                                    PaidAmount = Math.Min(totalPaid, prevFeeTotal * 0.7m),
                                    DueAmount = Math.Max(0m, (prevFeeTotal * 0.7m) - Math.Min(totalPaid, prevFeeTotal * 0.7m)),
                                    Status = computedStatus
                                },
                                new PromotedDueItemDto
                                {
                                    Id = $"item-prev-2-{st.StudentId}",
                                    FeeHeadName = "Annual Charges / Arrears",
                                    TermName = "Annual",
                                    DueDate = "2026-01-10",
                                    OriginalAmount = prevFeeTotal * 0.3m,
                                    PaidAmount = Math.Max(0m, totalPaid - (prevFeeTotal * 0.7m)),
                                    DueAmount = Math.Max(0m, (prevFeeTotal * 0.3m) - Math.Max(0m, totalPaid - (prevFeeTotal * 0.7m))),
                                    Status = computedStatus
                                }
                            }
                        }
                    }
                });
            }
        }

        return resultList;
    }

    private static string GetPreviousClassName(string currentClass)
    {
        string norm = NormalizeGrade(currentClass);
        if (norm == "10") return "Class 9";
        if (norm == "9") return "Class 8";
        if (norm == "8") return "Class 7";
        if (norm == "7") return "Class 6";
        if (norm == "6") return "Class 5";
        if (norm == "5") return "Class 4";
        if (norm == "4") return "Class 3";
        if (norm == "3") return "Class 2";
        if (norm == "2") return "Class 1";
        if (norm == "1") return "UKG";
        if (norm == "ukg") return "LKG";
        if (norm == "lkg") return "Nursery";
        return "Class 9";
    }

    public async Task<FeeReceiptsRegisterResponseDto> GetReceiptsRegisterAsync(
        string? search, string? paymentMode, string? fromDate, string? toDate, int page, int pageSize)
    {
        var query = _context.FeePayments.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(paymentMode) && !paymentMode.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.PaymentMethod == paymentMode);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(p => p.ReceiptNo.ToLower().Contains(s) || p.StudentId.ToLower().Contains(s) || p.TransactionId.ToLower().Contains(s));
        }

        int total = await query.CountAsync();
        int safePage = page <= 0 ? 1 : page;
        int safePageSize = pageSize <= 0 ? 50 : pageSize;

        var payments = await query
            .OrderByDescending(p => p.PaymentDate)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        var studentIdsStr = payments.Select(p => p.StudentId).Distinct().ToList();
        var students = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .Include(s => s.Branch)
            .Include(s => s.AcademicYear)
            .Where(s => studentIdsStr.Contains(s.StudentId.ToString()) || (s.AdmissionNumber != null && studentIdsStr.Contains(s.AdmissionNumber)))
            .ToListAsync();

        var items = new List<FeeReceiptDetailDto>();
        foreach (var p in payments)
        {
            var st = students.FirstOrDefault(s => s.StudentId.ToString() == p.StudentId || s.AdmissionNumber == p.StudentId);
            items.Add(new FeeReceiptDetailDto
            {
                PaymentId = p.Id,
                ReceiptNo = !string.IsNullOrEmpty(p.ReceiptNo) ? p.ReceiptNo : $"REC-2026-{p.Id:D4}",
                PaymentDate = p.PaymentDate,
                StudentId = st != null ? st.StudentId : 0,
                AdmissionNo = st != null ? (st.AdmissionNumber ?? $"REG-{st.StudentId}") : p.StudentId,
                StudentName = st != null ? (st.StudentName ?? $"Student #{st.StudentId}") : $"Student #{p.StudentId}",
                ClassName = st?.ClassGrade?.ClassName ?? "Class 10",
                Section = st?.ClassSection?.SectionName ?? "A",
                AcademicYear = st?.AcademicYear?.AcademicYearName ?? "2026-2027",
                Branch = st?.Branch?.BranchName ?? "Main Campus",
                AmountPaid = p.Amount,
                DiscountAmount = p.DiscountAmount,
                FineAmount = p.FineAmount,
                PaymentMethod = p.PaymentMethod ?? "Cash",
                TransactionId = p.TransactionId ?? "",
                Status = p.Status ?? "Completed",
                Remarks = "Fee Collection Receipt"
            });
        }

        decimal totalCollected = await _context.FeePayments.AsNoTracking().SumAsync(p => p.Amount);

        return new FeeReceiptsRegisterResponseDto
        {
            TotalRecords = total,
            Page = safePage,
            PageSize = safePageSize,
            TotalCollectedAmount = totalCollected,
            Items = items
        };
    }

    public async Task<FeeReceiptDetailDto?> GetReceiptByNoAsync(string receiptNo)
    {
        var payment = await _context.FeePayments.AsNoTracking()
            .FirstOrDefaultAsync(p => p.ReceiptNo == receiptNo || ($"REC-2026-{p.Id:D4}") == receiptNo);
        if (payment == null) return null;

        var st = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .Include(s => s.Branch)
            .Include(s => s.AcademicYear)
            .FirstOrDefaultAsync(s => s.StudentId.ToString() == payment.StudentId || s.AdmissionNumber == payment.StudentId);

        return new FeeReceiptDetailDto
        {
            PaymentId = payment.Id,
            ReceiptNo = !string.IsNullOrEmpty(payment.ReceiptNo) ? payment.ReceiptNo : $"REC-2026-{payment.Id:D4}",
            PaymentDate = payment.PaymentDate,
            StudentId = st != null ? st.StudentId : 0,
            AdmissionNo = st != null ? (st.AdmissionNumber ?? $"REG-{st.StudentId}") : payment.StudentId,
            StudentName = st != null ? (st.StudentName ?? $"Student #{st.StudentId}") : $"Student #{payment.StudentId}",
            ClassName = st?.ClassGrade?.ClassName ?? "Class 10",
            Section = st?.ClassSection?.SectionName ?? "A",
            AcademicYear = st?.AcademicYear?.AcademicYearName ?? "2026-2027",
            Branch = st?.Branch?.BranchName ?? "Main Campus",
            AmountPaid = payment.Amount,
            DiscountAmount = payment.DiscountAmount,
            FineAmount = payment.FineAmount,
            PaymentMethod = payment.PaymentMethod ?? "Cash",
            TransactionId = payment.TransactionId ?? "",
            Status = payment.Status ?? "Completed",
            Remarks = "Fee Collection Receipt",
            ItemizedBreakdown = new List<FeeBreakdownItemDto>
            {
                new FeeBreakdownItemDto { FeeId = "1", Title = "Tuition Fee (Term 1)", Amount = payment.Amount * 0.7m, IsDue = false },
                new FeeBreakdownItemDto { FeeId = "2", Title = "Admission Fee", Amount = payment.Amount * 0.3m, IsDue = false }
            }
        };
    }

    public async Task<bool> CancelReceiptAsync(string receiptNo, string reason)
    {
        var payment = await _context.FeePayments
            .FirstOrDefaultAsync(p => p.ReceiptNo == receiptNo || ($"REC-2026-{p.Id:D4}") == receiptNo);
        if (payment == null) return false;

        payment.Status = "Cancelled";
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<FinanceDashboardStatsDto> GetDashboardStatsAsync()
    {
        var validPayments = await _context.FeePayments.AsNoTracking().Where(p => p.Status != "Cancelled").ToListAsync();
        decimal totalCollected = validPayments.Sum(p => p.Amount);
        decimal totalDiscounts = validPayments.Sum(p => p.DiscountAmount);
        decimal fineCollection = validPayments.Sum(p => p.FineAmount);

        var activeStudents = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Where(s => !s.IsDeleted && s.Status == "Active")
            .ToListAsync();

        var assignments = await _context.StudentFeeAssignments.AsNoTracking().ToListAsync();
        decimal totalExpected = assignments.Count > 0 ? assignments.Sum(a => a.TotalAmount) : 0m;
        decimal totalOutstanding = Math.Max(0m, totalExpected - totalCollected);

        DateTime today = DateTime.UtcNow.Date;
        decimal todayCollection = validPayments
            .Where(p => p.PaymentDate.Date == today)
            .Sum(p => p.Amount);

        DateTime monthStart = new DateTime(today.Year, today.Month, 1);
        decimal monthCollection = validPayments
            .Where(p => p.PaymentDate >= monthStart)
            .Sum(p => p.Amount);

        int studentsPaidCount = validPayments.Select(p => p.StudentId).Distinct().Count();

        double efficiency = totalExpected > 0 ? Math.Round((double)(totalCollected / totalExpected) * 100, 1) : (totalCollected > 0 ? 100.0 : 0.0);

        // Class-wise breakdown sorted in natural grade sequence
        int GetClassOrder(string className)
        {
            if (string.IsNullOrWhiteSpace(className)) return 999;
            string lower = className.ToLower().Trim();
            if (lower.Contains("nursery") || lower.Contains("play")) return 1;
            if (lower.Contains("lkg") || lower.Contains("pp1") || lower.Contains("kg1")) return 2;
            if (lower.Contains("ukg") || lower.Contains("pp2") || lower.Contains("kg2")) return 3;
            var match = System.Text.RegularExpressions.Regex.Match(className, @"\d+");
            if (match.Success && int.TryParse(match.Value, out int gradeNum))
            {
                return 10 + gradeNum;
            }
            return 100;
        }

        var classWiseList = new List<ClassWiseCollectionShareDto>();
        var classGroups = activeStudents
            .GroupBy(s => s.ClassGrade?.ClassName ?? "Class 1")
            .OrderBy(g => GetClassOrder(g.Key))
            .ThenBy(g => g.Key);

        foreach (var grp in classGroups)
        {
            var studentIds = grp.Select(s => s.StudentId.ToString()).ToHashSet();
            var admNos = grp.Where(s => s.AdmissionNumber != null).Select(s => s.AdmissionNumber!).ToHashSet();

            decimal classCollected = validPayments
                .Where(p => studentIds.Contains(p.StudentId) || admNos.Contains(p.StudentId))
                .Sum(p => p.Amount);

            var classAssignments = assignments.Where(a => studentIds.Contains(a.StudentId.ToString())).ToList();
            decimal classExpected = classAssignments.Count > 0 
                ? classAssignments.Sum(a => a.TotalAmount)
                : 0m;

            classWiseList.Add(new ClassWiseCollectionShareDto
            {
                ClassName = grp.Key,
                ExpectedAmount = classExpected,
                CollectedAmount = classCollected
            });
        }

        var recentReceipts = await GetReceiptsRegisterAsync(null, null, null, null, 1, 5);

        // Dynamic Monthly Trends for past 6 months
        var monthlyTrends = new List<MonthlyCollectionTrendDto>();
        for (int i = 5; i >= 0; i--)
        {
            DateTime targetMonth = today.AddMonths(-i);
            DateTime mStart = new DateTime(targetMonth.Year, targetMonth.Month, 1);
            DateTime mEnd = mStart.AddMonths(1);
            decimal mCollected = validPayments.Where(p => p.PaymentDate >= mStart && p.PaymentDate < mEnd).Sum(p => p.Amount);
            monthlyTrends.Add(new MonthlyCollectionTrendDto
            {
                Month = targetMonth.ToString("MMM yyyy"),
                TargetAmount = 0m,
                CollectedAmount = mCollected
            });
        }

        // Headwise distribution
        decimal transportTotal = validPayments.Sum(p => p.TransportFee);
        decimal tuitionTotal = Math.Max(0m, totalCollected - transportTotal);

        var headWise = new List<FeeHeadCollectionShareDto>();
        if (totalCollected > 0)
        {
            if (tuitionTotal > 0) headWise.Add(new FeeHeadCollectionShareDto { HeadName = "Tuition Fee", Amount = tuitionTotal, Percentage = (double)Math.Round((tuitionTotal / totalCollected) * 100, 1), Color = "#3b82f6" });
            if (transportTotal > 0) headWise.Add(new FeeHeadCollectionShareDto { HeadName = "Transport Fee", Amount = transportTotal, Percentage = (double)Math.Round((transportTotal / totalCollected) * 100, 1), Color = "#f59e0b" });
        }

        return new FinanceDashboardStatsDto
        {
            TotalExpectedRevenue = totalExpected,
            TotalCollectedRevenue = totalCollected,
            TotalOutstandingDues = totalOutstanding,
            TotalConcessionsGranted = totalDiscounts,
            TodayCollectionAmount = todayCollection,
            MonthlyCollectionAmount = monthCollection,
            StudentsPaidCount = studentsPaidCount,
            CollectionEfficiencyPercentage = efficiency,

            TransportRevenue = transportTotal,
            HostelRevenue = 0m,
            UniformRevenue = 0m,
            ScholarshipsGranted = totalDiscounts,
            FineCollected = fineCollection,

            ClassWiseRevenue = classWiseList,
            MonthlyTrends = monthlyTrends,
            HeadWiseDistribution = headWise,
            PaymentModeDistribution = new List<PaymentModeSplitDto>
            {
                new PaymentModeSplitDto { Mode = "Cash", Amount = validPayments.Where(p => p.PaymentMethod == "Cash").Sum(p => p.Amount), TransactionsCount = validPayments.Count(p => p.PaymentMethod == "Cash") },
                new PaymentModeSplitDto { Mode = "Online (UPI / QR)", Amount = validPayments.Where(p => p.PaymentMethod != "Cash" && p.PaymentMethod != "Cheque").Sum(p => p.Amount), TransactionsCount = validPayments.Count(p => p.PaymentMethod != "Cash" && p.PaymentMethod != "Cheque") },
                new PaymentModeSplitDto { Mode = "Cheque / DD", Amount = validPayments.Where(p => p.PaymentMethod == "Cheque").Sum(p => p.Amount), TransactionsCount = validPayments.Count(p => p.PaymentMethod == "Cheque") }
            },
            RecentTransactions = recentReceipts.Items
        };
    }
}