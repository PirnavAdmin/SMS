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

        var matchedAdmissions = await _context.Admissions.AsNoTracking()
            .Where(a => a.ApplicationNo != null && admNos.Contains(a.ApplicationNo))
            .Select(a => new { Id = a.AdmissionId, a.ApplicationNo })
            .ToListAsync();

        var allStudentKeys = new HashSet<string>(studentIdsStr.Concat(admNos));
        foreach (var a in matchedAdmissions)
        {
            allStudentKeys.Add(a.Id.ToString());
            if (!string.IsNullOrEmpty(a.ApplicationNo)) allStudentKeys.Add(a.ApplicationNo);
        }

        var rawPayments = await _context.FeePayments.AsNoTracking()
            .Where(p => allStudentKeys.Contains(p.StudentId))
            .ToListAsync();

        var payments = rawPayments
            .GroupBy(p => !string.IsNullOrEmpty(p.ReceiptNo) ? p.ReceiptNo : p.Id.ToString())
            .Select(g => g.First())
            .ToList();

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

            string cName = st.ClassGrade?.ClassName ?? string.Empty;
            string sName = st.ClassSection?.SectionName ?? string.Empty;

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

        if (student == null)
        {
            var admission = await _context.Admissions.AsNoTracking().FirstOrDefaultAsync(a => a.AdmissionId == studentId);
            if (admission != null && !string.IsNullOrEmpty(admission.ApplicationNo))
            {
                student = await _context.Students.AsNoTracking()
                    .Include(s => s.ClassGrade)
                    .Include(s => s.ClassSection)
                    .Include(s => s.Branch)
                    .Include(s => s.AcademicYear)
                    .FirstOrDefaultAsync(s => s.AdmissionNumber == admission.ApplicationNo);
            }
        }

        if (student == null) return null;

        string admNo = student.AdmissionNumber ?? $"REG-{student.StudentId}";
        string studentIdStr = student.StudentId.ToString();
        string cName = student.ClassGrade?.ClassName ?? string.Empty;
        string sName = student.ClassSection?.SectionName ?? string.Empty;

        var matchedAdmissions = await _context.Admissions.AsNoTracking()
            .Where(a => (a.ApplicationNo != null && a.ApplicationNo == admNo) || (a.ApplicationNo != null && a.ApplicationNo == studentIdStr))
            .Select(a => a.AdmissionId.ToString())
            .ToListAsync();

        var allStudentKeys = new HashSet<string> { studentIdStr, admNo };
        foreach (var id in matchedAdmissions) allStudentKeys.Add(id);

        var rawPayments = await _context.FeePayments.AsNoTracking()
            .Where(p => allStudentKeys.Contains(p.StudentId))
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        var payments = rawPayments
            .GroupBy(p => !string.IsNullOrEmpty(p.ReceiptNo) ? p.ReceiptNo : p.Id.ToString())
            .Select(g => g.First())
            .ToList();

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
            Remarks = p.Remarks ?? "",
            TermName = p.TermName ?? "",
            FeeHeadName = p.FeeHeadName ?? "",
            PaidHeads = !string.IsNullOrEmpty(p.FeeHeadName) ? new List<string> { p.FeeHeadName } : new List<string> { "Tuition Fee" }
        }).ToList();

        var dbScholarships = await _context.Scholarships.AsNoTracking().Where(s => s.Status == "Active").ToListAsync();
        var dbDiscounts = await _context.Discounts.AsNoTracking().Where(d => d.Status == "Active").ToListAsync();

        var availableScholarships = dbScholarships.Select(s => new ConcessionOptionDto
        {
            Id = s.Id.ToString(),
            Name = s.Name,
            Type = s.DiscountType ?? "Percentage",
            Value = s.DiscountType == "Fixed" ? s.FixedAmount : s.Percentage,
            ApplicableHead = "Tuition Fee"
        }).ToList();

        var availableDiscounts = dbDiscounts.Select(d => new ConcessionOptionDto
        {
            Id = d.Id.ToString(),
            Name = d.Name,
            Type = d.Mode ?? "Percentage",
            Value = d.Value,
            ApplicableHead = "Tuition Fee"
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
            AvailableScholarships = availableScholarships,
            AvailableDiscounts = availableDiscounts,
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

        int canonicalStudentId = request.StudentId;
        var student = await _context.Students.AsNoTracking().FirstOrDefaultAsync(s => s.StudentId == request.StudentId);
        if (student == null)
        {
            var admission = await _context.Admissions.AsNoTracking().FirstOrDefaultAsync(a => a.AdmissionId == request.StudentId);
            if (admission != null && !string.IsNullOrEmpty(admission.ApplicationNo))
            {
                var resolvedStudent = await _context.Students.AsNoTracking().FirstOrDefaultAsync(s =>
                    s.AdmissionNumber == admission.ApplicationNo);
                if (resolvedStudent != null)
                {
                    canonicalStudentId = resolvedStudent.StudentId;
                }
            }
        }

        string termName = request.SelectedItems != null && request.SelectedItems.Any()
            ? string.Join(", ", request.SelectedItems.Select(i => i.TermName).Where(t => !string.IsNullOrEmpty(t)).Distinct())
            : "";
        string feeHeadName = request.SelectedItems != null && request.SelectedItems.Any()
            ? string.Join(", ", request.SelectedItems.Select(i => i.HeadName).Where(h => !string.IsNullOrEmpty(h)).Distinct())
            : "Tuition Fee";
        string itemsJson = request.SelectedItems != null && request.SelectedItems.Any()
            ? JsonSerializer.Serialize(request.SelectedItems)
            : "";

        string receiptNo = $"REC-2026-{Random.Shared.Next(1000, 9999)}";

        var payment = new FeePayment
        {
            ReceiptNo = receiptNo,
            StudentId = canonicalStudentId.ToString(),
            Amount = request.TotalAmountPaid,
            DiscountAmount = request.ConcessionDiscountAmount,
            FineAmount = request.IsFineWaived ? 0m : request.FineAmount,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = request.PaymentMethod ?? "Cash",
            TransactionId = !string.IsNullOrEmpty(request.TransactionId) ? request.TransactionId : request.ChequeNo ?? "",
            Status = "Completed",
            TermName = !string.IsNullOrEmpty(termName) ? termName : "Term Fee",
            FeeHeadName = !string.IsNullOrEmpty(feeHeadName) ? feeHeadName : "Tuition Fee",
            Remarks = !string.IsNullOrEmpty(request.Remarks) ? request.Remarks : "Fee Collection Receipt",
            PaidItemsJson = itemsJson
        };

        _context.FeePayments.Add(payment);
        await _context.SaveChangesAsync();

        var profile = await GetStudentFeeProfileAsync(canonicalStudentId, request.AcademicYear);
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
        var roster = await GetStudentRosterAsync(null, className, sectionName, null, 1, 500);
        var overdueItems = new List<DueFeeStudentDto>();

        foreach (var st in roster.Items)
        {
            if (st.TotalOutstanding > 0)
            {
                var profile = await GetStudentFeeProfileAsync(st.StudentId, st.AcademicYear);
                var overdueHeadsList = new List<string>();
                int maxDays = 0;

                if (profile != null && profile.CurrentAcademicYearFees.Count > 0)
                {
                    foreach (var item in profile.CurrentAcademicYearFees)
                    {
                        if (item.RemainingAmount > 0)
                        {
                            overdueHeadsList.Add(item.HeadName);
                            if (item.DaysOverdue > maxDays) maxDays = item.DaysOverdue;
                        }
                    }
                }

                if (overdueHeadsList.Count == 0)
                {
                    overdueHeadsList.Add("Tuition Fee");
                }

                if (minDaysOverdue > 0 && maxDays < minDaysOverdue) continue;

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
                    MaxDaysOverdue = maxDays > 0 ? maxDays : 30,
                    OverdueHeads = overdueHeadsList
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

    private static string NormalizeCategoryName(string rawName, List<SMS.Api.Models.FinanceManagement.FeeHead> activeHeads)
    {
        if (string.IsNullOrWhiteSpace(rawName)) return "Tuition Fee";
        string clean = rawName.Trim();
        string lower = clean.ToLowerInvariant();

        var exact = activeHeads.FirstOrDefault(fh =>
            (!string.IsNullOrWhiteSpace(fh.Name) && fh.Name.Trim().ToLowerInvariant() == lower) ||
            (!string.IsNullOrWhiteSpace(fh.Category) && fh.Category.Trim().ToLowerInvariant() == lower));
        if (exact != null && !string.IsNullOrWhiteSpace(exact.Name)) return exact.Name.Trim();

        string stripped = System.Text.RegularExpressions.Regex.Replace(lower, @"\s+fee$", "").Trim();
        var alias = activeHeads.FirstOrDefault(fh => {
            string hName = System.Text.RegularExpressions.Regex.Replace((fh.Name ?? "").Trim().ToLowerInvariant(), @"\s+fee$", "").Trim();
            string hCat = System.Text.RegularExpressions.Regex.Replace((fh.Category ?? "").Trim().ToLowerInvariant(), @"\s+fee$", "").Trim();
            return (hName.Length > 0 && hName == stripped) || (hCat.Length > 0 && hCat == stripped);
        });
        if (alias != null && !string.IsNullOrWhiteSpace(alias.Name)) return alias.Name.Trim();

        return clean;
    }

    public async Task<CategoryWiseDuesResponseDto> GetCategoryWiseDuesAsync(
        string? branch = null, string? academicYear = null, string? className = null, string? sectionName = null)
    {
        var activeHeads = await _context.FeeHeads.AsNoTracking()
            .Where(f => f.Status == "Active" || string.IsNullOrEmpty(f.Status))
            .ToListAsync();

        var catMap = new Dictionary<string, (string CategoryName, decimal TotalOutstanding, decimal OverdueAmount, HashSet<int> StudentIds)>(StringComparer.OrdinalIgnoreCase);

        foreach (var fh in activeHeads)
        {
            string name = !string.IsNullOrWhiteSpace(fh.Name) ? fh.Name.Trim() : (!string.IsNullOrWhiteSpace(fh.Category) ? fh.Category.Trim() : "");
            if (!string.IsNullOrEmpty(name) && !catMap.ContainsKey(name))
            {
                catMap[name] = (name, 0m, 0m, new HashSet<int>());
            }
        }

        var roster = await GetStudentRosterAsync(null, className, sectionName, null, 1, 1000);

        foreach (var st in roster.Items)
        {
            if (st.TotalOutstanding > 0)
            {
                var profile = await GetStudentFeeProfileAsync(st.StudentId, academicYear ?? st.AcademicYear);
                if (profile != null && profile.CurrentAcademicYearFees.Count > 0)
                {
                    foreach (var item in profile.CurrentAcademicYearFees)
                    {
                        if (item.RemainingAmount > 0)
                        {
                            string cName = NormalizeCategoryName(!string.IsNullOrWhiteSpace(item.HeadName) ? item.HeadName : "Tuition Fee", activeHeads);
                            if (!catMap.ContainsKey(cName))
                            {
                                catMap[cName] = (cName, 0m, 0m, new HashSet<int>());
                            }

                            var cur = catMap[cName];
                            cur.StudentIds.Add(st.StudentId);
                            decimal newOut = cur.TotalOutstanding + item.RemainingAmount;
                            decimal newOver = cur.OverdueAmount + (item.IsOverdue ? item.RemainingAmount : 0m);
                            catMap[cName] = (cName, newOut, newOver, cur.StudentIds);
                        }
                    }
                }
                else
                {
                    string cName = NormalizeCategoryName("Tuition Fee", activeHeads);
                    if (!catMap.ContainsKey(cName))
                    {
                        catMap[cName] = (cName, 0m, 0m, new HashSet<int>());
                    }
                    var cur = catMap[cName];
                    cur.StudentIds.Add(st.StudentId);
                    catMap[cName] = (cName, cur.TotalOutstanding + st.TotalOutstanding, cur.OverdueAmount + st.TotalOutstanding, cur.StudentIds);
                }
            }
        }

        var categoryList = catMap.Values
            .Where(v => v.TotalOutstanding > 0)
            .Select(v => new CategoryWiseDuesItemDto
            {
                CategoryName = v.CategoryName,
                TotalOutstanding = v.TotalOutstanding,
                OverdueAmount = v.OverdueAmount,
                StudentCount = v.StudentIds.Count
            })
            .OrderByDescending(c => c.TotalOutstanding)
            .ToList();

        return new CategoryWiseDuesResponseDto
        {
            TotalOutstanding = categoryList.Sum(c => c.TotalOutstanding),
            TotalOverdue = categoryList.Sum(c => c.OverdueAmount),
            TotalStudentsWithDues = categoryList.SelectMany(c => new[] { c.StudentCount }).DefaultIfEmpty(0).Max(),
            Categories = categoryList
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
            string cName = st.ClassGrade?.ClassName ?? string.Empty;
            string sName = st.ClassSection?.SectionName ?? string.Empty;
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
        return string.Empty;
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
                ClassName = st?.ClassGrade?.ClassName ?? string.Empty,
                Section = st?.ClassSection?.SectionName ?? string.Empty,
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
            ClassName = st?.ClassGrade?.ClassName ?? string.Empty,
            Section = st?.ClassSection?.SectionName ?? string.Empty,
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

    public async Task<FinanceDashboardStatsDto> GetDashboardStatsAsync(string? branch = null, string? academicYear = null)
    {
        var validPayments = await _context.FeePayments.AsNoTracking().Where(p => p.Status != "Cancelled").ToListAsync();
        
        // 1. Filter Active Students by Branch and Academic Year
        var studentQuery = _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.Branch)
            .Where(s => !s.IsDeleted && (s.Status == "Active" || string.IsNullOrEmpty(s.Status)));

        if (!string.IsNullOrWhiteSpace(branch) && !branch.Equals("All", StringComparison.OrdinalIgnoreCase) && !branch.Equals("All Branches", StringComparison.OrdinalIgnoreCase))
        {
            studentQuery = studentQuery.Where(s => (s.Branch != null && s.Branch.BranchName.ToLower() == branch.ToLower()) || s.BranchId.ToString() == branch);
        }

        if (!string.IsNullOrWhiteSpace(academicYear) && !academicYear.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            studentQuery = studentQuery.Where(s => s.AcademicYearId.ToString() == academicYear || (s.AcademicYear != null && s.AcademicYear.AcademicYearName.Contains(academicYear)));
        }

        var activeStudents = await studentQuery.ToListAsync();
        var studentIdsSet = activeStudents.Select(s => s.StudentId.ToString()).ToHashSet();
        var admNosSet = activeStudents.Where(s => s.AdmissionNumber != null).Select(s => s.AdmissionNumber!).ToHashSet();

        // 2. Tuition / Academic Fees Calculation
        var assignments = await _context.StudentFeeAssignments.AsNoTracking().ToListAsync();
        var dynamicStructures = await _context.DynamicFeeStructures.AsNoTracking().Where(d => d.Status == "Active" || string.IsNullOrEmpty(d.Status)).ToListAsync();
        var validStructureIds = dynamicStructures.Select(d => d.Id).ToHashSet();
        var validStructuresDict = dynamicStructures.ToDictionary(d => d.Id);

        // Filter assignments so orphan assignments pointing to deleted fee structures are never counted
        var validAssignments = assignments
            .Where(a => (a.Status == "Active" || string.IsNullOrEmpty(a.Status)) &&
                        (!a.DynamicFeeStructureId.HasValue || validStructureIds.Contains(a.DynamicFeeStructureId.Value)))
            .ToList();

        var assignmentDict = (dynamicStructures.Count > 0)
            ? validAssignments
                .GroupBy(a => a.StudentId.ToString())
                .ToDictionary(g => g.Key, g =>
                {
                    var a = g.First();
                    if (a.DynamicFeeStructureId.HasValue && validStructuresDict.TryGetValue(a.DynamicFeeStructureId.Value, out var dfs))
                    {
                        return dfs.TotalAmount;
                    }
                    return a.TotalAmount;
                })
            : new Dictionary<string, decimal>();

        decimal tuitionExpected = 0m;
        foreach (var s in activeStudents)
        {
            string sIdStr = s.StudentId.ToString();
            if (assignmentDict.TryGetValue(sIdStr, out decimal assignedAmt))
            {
                tuitionExpected += assignedAmt;
            }
            else
            {
                var matchedDfs = dynamicStructures.FirstOrDefault(d => 
                    !string.IsNullOrEmpty(d.ClassName) && 
                    !string.IsNullOrEmpty(s.ClassGrade?.ClassName) && 
                    MatchesClassName(d.ClassName, s.ClassGrade?.ClassName));
                if (matchedDfs != null)
                {
                    tuitionExpected += matchedDfs.TotalAmount;
                }
            }
        }

        // Dedicated payment totals
        decimal transportCollected = validPayments.Sum(p => p.TransportFee);
        decimal fineCollected = validPayments.Sum(p => p.FineAmount);
        
        decimal hostelCollectedFromPayments = validPayments
            .Where(p => (!string.IsNullOrEmpty(p.FeeHeadName) && p.FeeHeadName.Contains("Hostel", StringComparison.OrdinalIgnoreCase)) ||
                        (!string.IsNullOrEmpty(p.Remarks) && p.Remarks.Contains("Hostel", StringComparison.OrdinalIgnoreCase)))
            .Sum(p => p.Amount);

        decimal uniformCollectedFromPayments = validPayments
            .Where(p => (!string.IsNullOrEmpty(p.FeeHeadName) && p.FeeHeadName.Contains("Uniform", StringComparison.OrdinalIgnoreCase)) ||
                        (!string.IsNullOrEmpty(p.Remarks) && p.Remarks.Contains("Uniform", StringComparison.OrdinalIgnoreCase)))
            .Sum(p => p.Amount);

        // 3. Hostel Module Metrics
        var activeBedAllocations = await _context.StudentBedAllocations.AsNoTracking()
            .Include(b => b.Room)
            .ThenInclude(r => r!.RoomType)
            .Where(b => b.Status == "Active" || string.IsNullOrEmpty(b.Status))
            .ToListAsync();

        decimal hostelExpected = activeBedAllocations.Count > 0 
            ? activeBedAllocations.Count * 24000m
            : 0m;

        decimal hostelCollected = hostelCollectedFromPayments;
        if (hostelExpected > 0 && hostelCollected == 0m)
        {
            // Fallback estimation if hostel fees are bundled in payments
            hostelCollected = Math.Min(hostelExpected, validPayments.Sum(p => p.Amount) * 0.15m);
        }

        // 4. Transport Module Metrics
        var activeTransportAssignments = await _context.StudentTransportAssignments.AsNoTracking()
            .Include(t => t.PickupPoint)
            .Where(t => t.Status == true && !t.IsDeleted)
            .ToListAsync();

        decimal transportExpected = activeTransportAssignments.Count > 0
            ? activeTransportAssignments.Sum(t => (t.PickupPoint?.MonthlyFee ?? 1200m) * 12m)
            : (transportCollected > 0 ? transportCollected * 1.2m : 0m);

        decimal transportCollectedTotal = Math.Max(transportCollected, validPayments.Where(p => 
            (!string.IsNullOrEmpty(p.FeeHeadName) && p.FeeHeadName.Contains("Transport", StringComparison.OrdinalIgnoreCase)) ||
            (!string.IsNullOrEmpty(p.Remarks) && p.Remarks.Contains("Transport", StringComparison.OrdinalIgnoreCase))
        ).Sum(p => p.Amount));

        // 5. Uniform Module Metrics
        var uniformDistributions = await _context.StudentUniformDistributions.AsNoTracking()
            .Where(u => u.Status != "Cancelled")
            .ToListAsync();

        decimal uniformExpected = uniformDistributions.Count > 0
            ? uniformDistributions.Sum(u => u.TotalAmount)
            : 0m;

        decimal uniformCollected = uniformDistributions.Count > 0
            ? uniformDistributions.Where(u => u.PaymentStatus == "Paid").Sum(u => u.TotalAmount) + uniformCollectedFromPayments
            : uniformCollectedFromPayments;

        // 6. Fines Metrics
        var feeChargesFines = await _context.FeeCharges.AsNoTracking()
            .Where(c => c.Status != "Cancelled")
            .SumAsync(c => (decimal?)c.FineAmount) ?? 0m;

        decimal finesExpected = Math.Max(fineCollected, feeChargesFines > 0 ? feeChargesFines : fineCollected * 1.2m);
        decimal finesCollected = fineCollected;

        // 7. Tuition Collected Calculation
        decimal tuitionCollected = Math.Max(0m, validPayments.Sum(p => p.Amount) - (transportCollectedTotal + hostelCollected + uniformCollected + finesCollected));
        if (tuitionCollected == 0m && validPayments.Count > 0)
        {
            tuitionCollected = validPayments.Sum(p => p.Amount);
        }

        // 8. Main Dashboard Financial Totals Aggregation
        decimal totalExpected = tuitionExpected + hostelExpected + transportExpected + uniformExpected + finesExpected;
        decimal totalCollected = validPayments.Sum(p => p.Amount);
        if (totalCollected < (tuitionCollected + hostelCollected + transportCollectedTotal + uniformCollected + finesCollected))
        {
            totalCollected = tuitionCollected + hostelCollected + transportCollectedTotal + uniformCollected + finesCollected;
        }

        // If total expected is smaller than collected, balance expected
        if (totalExpected < totalCollected)
        {
            totalExpected = totalCollected;
        }

        decimal totalOutstanding = Math.Max(0m, totalExpected - totalCollected);
        decimal totalDiscounts = validPayments.Sum(p => p.DiscountAmount);

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

        // 9. Class-wise Revenue Breakdown
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

        var activeClassesList = await _context.Classes.AsNoTracking()
            .Where(c => c.Status == "Active" || string.IsNullOrEmpty(c.Status))
            .ToListAsync();

        var classIdToNameDict = activeClassesList.ToDictionary(c => c.ClassId, c => c.ClassName, EqualityComparer<int>.Default);

        string GetStudentClassName(SMS.Api.Models.Student st)
        {
            if (st.ClassGrade != null && !string.IsNullOrWhiteSpace(st.ClassGrade.ClassName))
                return st.ClassGrade.ClassName;
            if (classIdToNameDict.TryGetValue(st.ClassId, out var name) && !string.IsNullOrWhiteSpace(name))
                return name;
            return string.Empty;
        }

        var dbClassNames = activeClassesList
            .Select(c => c.ClassName)
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Distinct()
            .ToList();

        var studentClassNames = activeStudents
            .Select(GetStudentClassName)
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Distinct()
            .ToList();

        var allClassNames = dbClassNames
            .Concat(studentClassNames)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(c => GetClassOrder(c))
            .ThenBy(c => c)
            .ToList();

        var defaultStructureAmount = dynamicStructures.FirstOrDefault()?.TotalAmount ?? 0m;

        var classWiseList = new List<ClassWiseCollectionShareDto>();

        foreach (var cName in allClassNames)
        {
            var matchingStudents = activeStudents
                .Where(st => MatchesClassName(GetStudentClassName(st), cName))
                .ToList();

            var stIds = matchingStudents.Select(s => s.StudentId.ToString()).ToHashSet();
            var admNos = matchingStudents.Where(s => s.AdmissionNumber != null).Select(s => s.AdmissionNumber!).ToHashSet();

            decimal classCollected = validPayments
                .Where(p => stIds.Contains(p.StudentId) || admNos.Contains(p.StudentId))
                .Sum(p => p.Amount);

            decimal classExpected = 0m;
            if (matchingStudents.Count > 0)
            {
                foreach (var st in matchingStudents)
                {
                    string stIdStr = st.StudentId.ToString();
                    if (assignmentDict.TryGetValue(stIdStr, out decimal aAmt))
                    {
                        classExpected += aAmt;
                    }
                    else
                    {
                        var matchedDfs = dynamicStructures.FirstOrDefault(d => 
                            !string.IsNullOrEmpty(d.ClassName) && 
                            MatchesClassName(d.ClassName, cName));
                        if (matchedDfs != null)
                        {
                            classExpected += matchedDfs.TotalAmount;
                        }
                        else
                        {
                            classExpected += defaultStructureAmount;
                        }
                    }
                }
            }
            else
            {
                var matchedDfs = dynamicStructures.FirstOrDefault(d => 
                    !string.IsNullOrEmpty(d.ClassName) && 
                    MatchesClassName(d.ClassName, cName));
                if (matchedDfs != null)
                {
                    classExpected = matchedDfs.TotalAmount;
                }
            }

            if (classExpected < classCollected) classExpected = classCollected;

            classWiseList.Add(new ClassWiseCollectionShareDto
            {
                ClassName = cName,
                ExpectedAmount = classExpected,
                CollectedAmount = classCollected
            });
        }

        // 10. Fee Collection Category Breakdown (100% Dynamic from configured Fee Heads / Fee Types)
        var activeFeeHeadsList = await _context.FeeHeads.AsNoTracking()
            .Where(f => f.Status == "Active" || string.IsNullOrEmpty(f.Status))
            .ToListAsync();

        var catSummaryDict = new Dictionary<string, (string Name, decimal Expected, decimal Collected)>(StringComparer.OrdinalIgnoreCase);

        // Initialize from configured active Fee Heads
        foreach (var fh in activeFeeHeadsList)
        {
            string normName = NormalizeCategoryName(fh.Name, activeFeeHeadsList);
            if (!catSummaryDict.ContainsKey(normName))
            {
                catSummaryDict[normName] = (normName, 0m, 0m);
            }
        }

        // Calculate expected per Fee Head across active students
        foreach (var st in activeStudents)
        {
            string stIdStr = st.StudentId.ToString();
            string cName = GetStudentClassName(st);

            var matchedDfs = dynamicStructures.FirstOrDefault(d =>
                !string.IsNullOrEmpty(d.ClassName) &&
                MatchesClassName(d.ClassName, cName));

            List<(string HeadName, decimal Amount)> studentItems = new();

            if (matchedDfs?.ItemsJson != null)
            {
                try
                {
                    var items = JsonSerializer.Deserialize<List<FeeStructureItemDto>>(matchedDfs.ItemsJson);
                    if (items != null && items.Count > 0)
                    {
                        foreach (var item in items)
                        {
                            studentItems.Add((item.FeeHeadName, item.Amount));
                        }
                    }
                }
                catch { }
            }

            if (studentItems.Count == 0 && matchedDfs != null && matchedDfs.TotalAmount > 0)
            {
                studentItems.Add(("Tuition Fee", matchedDfs.TotalAmount));
            }
            else if (studentItems.Count == 0)
            {
                studentItems.Add(("Tuition Fee", defaultStructureAmount));
            }

            foreach (var sItem in studentItems)
            {
                string normName = NormalizeCategoryName(sItem.HeadName, activeFeeHeadsList);
                if (!catSummaryDict.ContainsKey(normName))
                {
                    catSummaryDict[normName] = (normName, 0m, 0m);
                }
                var cur = catSummaryDict[normName];
                catSummaryDict[normName] = (cur.Name, cur.Expected + sItem.Amount, cur.Collected);
            }
        }

        // Calculate collected per Fee Head from validPayments
        foreach (var p in validPayments)
        {
            string headName = !string.IsNullOrWhiteSpace(p.FeeHeadName) ? p.FeeHeadName : "Tuition Fee";
            string normName = NormalizeCategoryName(headName, activeFeeHeadsList);

            if (!catSummaryDict.ContainsKey(normName))
            {
                catSummaryDict[normName] = (normName, 0m, 0m);
            }
            var cur = catSummaryDict[normName];
            catSummaryDict[normName] = (cur.Name, cur.Expected, cur.Collected + p.Amount);
        }

        // Include active module categories if expected or collected > 0
        if (hostelExpected > 0 || hostelCollected > 0)
        {
            string hKey = "Hostel Accommodation";
            if (!catSummaryDict.ContainsKey(hKey)) catSummaryDict[hKey] = (hKey, hostelExpected, hostelCollected);
        }

        if (transportExpected > 0 || transportCollectedTotal > 0)
        {
            string tKey = "Transport & Conveyance";
            if (!catSummaryDict.ContainsKey(tKey)) catSummaryDict[tKey] = (tKey, transportExpected, transportCollectedTotal);
        }

        if (uniformExpected > 0 || uniformCollected > 0)
        {
            string uKey = "Uniform & Merchandise";
            if (!catSummaryDict.ContainsKey(uKey)) catSummaryDict[uKey] = (uKey, uniformExpected, uniformCollected);
        }

        if (finesExpected > 0 || finesCollected > 0)
        {
            string fKey = "Late Fines & Penalties";
            if (!catSummaryDict.ContainsKey(fKey)) catSummaryDict[fKey] = (fKey, finesExpected, finesCollected);
        }

        var categoryBreakdown = new List<FeeCategoryCollectionSummaryDto>();
        var headWise = new List<FeeHeadCollectionShareDto>();
        string[] chartColors = new[] { "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f43f5e" };
        int colorIdx = 0;

        foreach (var entry in catSummaryDict.Values)
        {
            decimal exp = entry.Expected;
            decimal coll = entry.Collected;
            if (exp < coll) exp = coll;

            categoryBreakdown.Add(new FeeCategoryCollectionSummaryDto
            {
                CategoryName = entry.Name,
                ExpectedAmount = exp,
                CollectedAmount = coll
            });

            if (coll > 0)
            {
                double pct = totalCollected > 0 ? (double)Math.Round((coll / totalCollected) * 100, 1) : 0;
                headWise.Add(new FeeHeadCollectionShareDto
                {
                    HeadName = entry.Name,
                    Amount = coll,
                    Percentage = pct,
                    Color = chartColors[colorIdx % chartColors.Length]
                });
                colorIdx++;
            }
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

            HostelExpected = hostelExpected,
            HostelCollected = hostelCollected,
            TransportExpected = transportExpected,
            TransportCollected = transportCollectedTotal,
            UniformExpected = uniformExpected,
            UniformCollected = uniformCollected,
            FinesExpected = finesExpected,
            FinesCollected = finesCollected,

            TransportRevenue = transportCollectedTotal,
            HostelRevenue = hostelCollected,
            UniformRevenue = uniformCollected,
            ScholarshipsGranted = totalDiscounts,
            FineCollected = finesCollected,

            ClassWiseRevenue = classWiseList,
            MonthlyTrends = monthlyTrends,
            HeadWiseDistribution = headWise,
            PaymentModeDistribution = new List<PaymentModeSplitDto>
            {
                new PaymentModeSplitDto { Mode = "Cash", Amount = validPayments.Where(p => p.PaymentMethod == "Cash").Sum(p => p.Amount), TransactionsCount = validPayments.Count(p => p.PaymentMethod == "Cash") },
                new PaymentModeSplitDto { Mode = "Online (UPI / QR)", Amount = validPayments.Where(p => p.PaymentMethod != "Cash" && p.PaymentMethod != "Cheque").Sum(p => p.Amount), TransactionsCount = validPayments.Count(p => p.PaymentMethod != "Cash" && p.PaymentMethod != "Cheque") },
                new PaymentModeSplitDto { Mode = "Cheque / DD", Amount = validPayments.Where(p => p.PaymentMethod == "Cheque").Sum(p => p.Amount), TransactionsCount = validPayments.Count(p => p.PaymentMethod == "Cheque") }
            },
            RecentTransactions = recentReceipts.Items,
            CategoryBreakdown = categoryBreakdown
        };
    }
}