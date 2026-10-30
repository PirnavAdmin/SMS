namespace SMS.Api.Repositories.Implementations.FinanceManagement;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models;
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

        var match = System.Text.RegularExpressions.Regex.Match(lower, @"^(?:class|grade|std|standard)?\s*(\d+)(?:st|nd|rd|th)?(?:[-\s]+[a-z0-9]+)?$");
        if (match.Success)
        {
            return match.Groups[1].Value;
        }

        string clean = System.Text.RegularExpressions.Regex.Replace(lower, @"^(class|grade|std|standard)\s+", "");
        clean = System.Text.RegularExpressions.Regex.Replace(clean, @"[-\s]+[a-z]$", "");
        clean = System.Text.RegularExpressions.Regex.Replace(clean, @"(st|nd|rd|th)$", "");
        return clean.Trim();
    }

    private static bool MatchesClassName(string? classA, string? classB)
    {
        if (string.IsNullOrWhiteSpace(classA) || string.IsNullOrWhiteSpace(classB)) return false;
        if (classA.Trim().Equals(classB.Trim(), StringComparison.OrdinalIgnoreCase)) return true;
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

    private static Dictionary<string, int> BuildClassOrderMap(IEnumerable<SMS.Api.Models.AcademicManagement.ClassGrade>? dbClasses)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        if (dbClasses == null) return map;

        int seq = 1;
        foreach (var c in dbClasses)
        {
            if (string.IsNullOrWhiteSpace(c.ClassName)) continue;
            int order = c.DisplayOrder ?? seq++;
            string cName = c.ClassName.Trim();
            map[cName] = order;

            string norm = NormalizeGrade(cName);
            if (!string.IsNullOrEmpty(norm) && !map.ContainsKey(norm))
            {
                map[norm] = order;
            }
        }
        return map;
    }

    private static int GetClassOrder(string? className, Dictionary<string, int>? classOrderMap = null)
    {
        if (string.IsNullOrWhiteSpace(className)) return 999;
        string trimmed = className.Trim();

        if (classOrderMap != null)
        {
            if (classOrderMap.TryGetValue(trimmed, out int ord)) return ord;
            string norm = NormalizeGrade(trimmed);
            if (!string.IsNullOrEmpty(norm) && classOrderMap.TryGetValue(norm, out int normOrd)) return normOrd;
        }

        var match = System.Text.RegularExpressions.Regex.Match(trimmed, @"\d+");
        if (match.Success && int.TryParse(match.Value, out int gradeNum))
        {
            return 100 + gradeNum;
        }
        return 999;
    }

    private static string CleanRoomNumber(string? r) => (r ?? "").ToLower().Replace("room", "").Trim();

    private static bool MatchesClassRange(
        string? studentClass, 
        SMS.Api.Models.FinanceManagement.HostelFeeConfig cfg,
        Dictionary<string, int>? classOrderMap = null)
    {
        if (string.IsNullOrWhiteSpace(studentClass)) return true;
        if (string.IsNullOrWhiteSpace(cfg.StartClass) && string.IsNullOrWhiteSpace(cfg.EndClass) && 
            (string.IsNullOrWhiteSpace(cfg.ClassRange) || cfg.ClassRange == "All Classes" || cfg.ClassRange == "All"))
            return true;

        if (!string.IsNullOrWhiteSpace(cfg.ApplicableClasses))
        {
            var classes = cfg.ApplicableClasses.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (classes.Any(c => MatchesClassName(c, studentClass)))
                return true;
        }

        string sClass = cfg.StartClass ?? "";
        string eClass = cfg.EndClass ?? "";
        if (string.IsNullOrWhiteSpace(sClass) && !string.IsNullOrWhiteSpace(cfg.ClassRange) && cfg.ClassRange.Contains('-'))
        {
            var parts = cfg.ClassRange.Split('-');
            sClass = parts[0].Trim();
            eClass = parts[1].Trim();
        }

        if (!string.IsNullOrWhiteSpace(sClass) && !string.IsNullOrWhiteSpace(eClass))
        {
            int stOrder = GetClassOrder(studentClass, classOrderMap);
            int startOrder = GetClassOrder(sClass, classOrderMap);
            int endOrder = GetClassOrder(eClass, classOrderMap);
            int minOrder = Math.Min(startOrder, endOrder);
            int maxOrder = Math.Max(startOrder, endOrder);
            return stOrder >= minOrder && stOrder <= maxOrder;
        }
        else if (!string.IsNullOrWhiteSpace(sClass))
        {
            return MatchesClassName(sClass, studentClass);
        }

        return false;
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
            .Include(b => b.Room)
            .ThenInclude(r => r!.RoomType)
            .Include(b => b.Hostel)
            .Where(b => b.StudentId.HasValue && studentIntIds.Contains(b.StudentId.Value) && (b.Status == "Active" || b.Status == "Occupied" || string.IsNullOrEmpty(b.Status)))
            .ToListAsync();

        var hostelApps = await _context.AdmissionApplications.AsNoTracking()
            .Where(a => !a.IsDeleted && a.StudentType == "Residential" && a.Status != "Rejected" && a.Status != "Deleted" && a.Status != "Withdrawn")
            .ToListAsync();

        var allHostelConfigs = await _context.HostelFeeConfigs.AsNoTracking()
            .Where(h => h.Status == "Active" || string.IsNullOrEmpty(h.Status))
            .ToListAsync();

        var allDbClasses = await _context.Classes.AsNoTracking()
            .Where(c => c.Status == "Active")
            .OrderBy(c => c.DisplayOrder ?? c.ClassId)
            .ToListAsync();
        var classOrderMap = BuildClassOrderMap(allDbClasses);

        var transportAssignments = await _context.StudentTransportAssignments.AsNoTracking()
            .Include(t => t.Route)
            .Include(t => t.PickupPoint)
            .Where(t => t.Status && !t.IsDeleted)
            .ToListAsync();

        var transportApps = await _context.AdmissionApplications.AsNoTracking()
            .Where(a => a.TransportRequired == true)
            .ToListAsync();

        var allRoutes = await _context.TransportRoutes.AsNoTracking().ToListAsync();
        var allPickups = await _context.PickupPoints.AsNoTracking().ToListAsync();
        var allAssignments = await _context.StudentFeeAssignments.AsNoTracking()
            .Where(a => a.Status == "Active" || string.IsNullOrEmpty(a.Status))
            .ToListAsync();

        var items = new List<FeeCollectionStudentSummaryDto>();

        foreach (var st in students)
        {
            var alloc = hostelAllocations.FirstOrDefault(b => b.StudentId == st.StudentId || (st.AdmissionNumber != null && b.RegistrationNo == st.AdmissionNumber));
            var hApp = hostelApps.FirstOrDefault(a => st.AdmissionNumber != null && (a.AdmissionNo == st.AdmissionNumber || a.RegistrationNo == st.AdmissionNumber));
            bool isHosteller = (hApp != null && hApp.StudentType == "Residential") || (alloc != null && (alloc.Status == "Active" || alloc.Status == "Occupied"));
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

            decimal transportFee = 0m;
            if (!isHosteller)
            {
                var ta = transportAssignments.FirstOrDefault(t => t.StudentId == st.StudentId || (st.AdmissionNumber != null && t.AdmissionNo == st.AdmissionNumber));
                var app = transportApps.FirstOrDefault(a => st.AdmissionNumber != null && (a.AdmissionNo == st.AdmissionNumber || a.RegistrationNo == st.AdmissionNumber));
                if (ta != null || app != null)
                {
                    var r = ta?.Route ?? allRoutes.FirstOrDefault(x => x.RouteName == app?.BusRoute || x.RouteId.ToString() == app?.BusRoute);
                    var p = ta?.PickupPoint ?? allPickups.FirstOrDefault(x => x.PickupPointName == app?.PickupPoint || x.PickupPointId.ToString() == app?.PickupPoint);
                    decimal distance = p?.DistanceFromStart ?? (r?.DistanceKm ?? 0m);
                    decimal minKm = r?.MinRangeKm ?? 5m;
                    string trpType = ta?.TransportType ?? app?.TransportType ?? "AC";
                    bool isAc = trpType.Contains("AC", StringComparison.OrdinalIgnoreCase) && !trpType.Contains("Non", StringComparison.OrdinalIgnoreCase);
                    decimal baseFare = isAc ? (r?.AcBaseFare ?? 1200m) : (r?.NonAcBaseFare ?? 1000m);
                    decimal ratePerKm = isAc ? (r?.AcRatePerKm ?? 150m) : (r?.NonAcRatePerKm ?? 100m);
                    decimal monthlyFare = baseFare + Math.Max(0m, distance - minKm) * ratePerKm;
                    transportFee = monthlyFare * 12m;
                }
            }

            decimal hostelFee = 0m;
            if (isHosteller)
            {
                string bName = alloc?.Hostel?.HostelName ?? hApp?.HostelBlock ?? "";
                string rNo = alloc?.Room?.RoomNumber ?? hApp?.HostelRoom ?? "";
                string acType = alloc?.Room?.RoomType?.AcType ?? "";
                int bedCap = alloc?.Room?.RoomType?.BedCapacity ?? 0;

                var matchedCfg = allHostelConfigs.FirstOrDefault(c => 
                    MatchesClassRange(cName, c, classOrderMap) &&
                    (string.IsNullOrEmpty(bName) || c.HostelName == "All" || c.HostelName.Equals(bName, StringComparison.OrdinalIgnoreCase) || bName.Contains(c.HostelName, StringComparison.OrdinalIgnoreCase)) &&
                    (string.IsNullOrEmpty(rNo) || c.RoomNo == "All Rooms" || c.RoomNo == "All" || CleanRoomNumber(c.RoomNo) == CleanRoomNumber(rNo))
                ) ?? allHostelConfigs.FirstOrDefault(c => MatchesClassRange(cName, c, classOrderMap)) ?? allHostelConfigs.FirstOrDefault();

                if (matchedCfg != null)
                {
                    hostelFee = matchedCfg.HostelFee + matchedCfg.SecurityDeposit;
                }
            }

            var stPayments = payments.Where(p => p.StudentId == st.StudentId.ToString() || p.StudentId == st.AdmissionNumber).ToList();
            decimal paidAmt = stPayments.Sum(p => p.Amount);
            decimal discountAmt = stPayments.Sum(p => p.DiscountAmount);
            decimal fineAmt = stPayments.Sum(p => p.FineAmount);

            string sIdStr = st.StudentId.ToString();
            string sAdmNo = st.AdmissionNumber ?? "";
            string sRollNo = st.RollNumber ?? "";
            var stAssign = allAssignments.FirstOrDefault(a =>
                a.StudentId == sIdStr ||
                (!string.IsNullOrEmpty(sAdmNo) && a.StudentId == sAdmNo) ||
                (!string.IsNullOrEmpty(sRollNo) && a.StudentId == sRollNo));

            string stPolicy = stAssign?.FeePolicy ?? "Full Annual Fee";
            bool isAnnualPolicy = string.IsNullOrEmpty(stPolicy) ||
                stPolicy.Contains("Annual", StringComparison.OrdinalIgnoreCase) ||
                stPolicy.Contains("Full", StringComparison.OrdinalIgnoreCase) ||
                stPolicy.Contains("One Time", StringComparison.OrdinalIgnoreCase) ||
                stPolicy.Contains("One-Time", StringComparison.OrdinalIgnoreCase);

            decimal totalStudentFee = (stAssign != null && stAssign.TotalAmount > 0 ? stAssign.TotalAmount : baseClassFee) + transportFee + hostelFee;
            decimal outstanding = 0m;
            if (isAnnualPolicy)
            {
                outstanding = Math.Max(0m, totalStudentFee - paidAmt - discountAmt + fineAmt);
            }
            else
            {
                int termCount = 4;
                decimal runningPaid = paidAmt + discountAmt;
                decimal pendingArrived = 0m;
                decimal prevTermsSum = 0m;
                for (int t = 0; t < termCount; t++)
                {
                    decimal termAmt = (t == termCount - 1) ? Math.Max(0m, totalStudentFee - prevTermsSum) : Math.Round(totalStudentFee / termCount, 2);
                    prevTermsSum += termAmt;
                    decimal paidForTerm = Math.Min(termAmt, runningPaid);
                    runningPaid -= paidForTerm;
                    decimal unpaidTerm = Math.Max(0m, termAmt - paidForTerm);
                    if (t == 0)
                    {
                        pendingArrived += unpaidTerm;
                    }
                }
                outstanding = pendingArrived;
            }

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
                Branch = st.Branch?.BranchName ?? string.Empty,
                AcademicYear = st.AcademicYear?.AcademicYearName ?? $"{DateTime.UtcNow.Year}-{(DateTime.UtcNow.Year + 1)}",
                FatherName = st.FatherName ?? "",
                FatherMobile = st.FatherMobile ?? "",
                TotalFee = totalStudentFee,
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

    public Task<StudentFeeProfileResponseDto?> GetStudentFeeProfileAsync(int studentId, string? academicYear)
    {
        return GetStudentFeeProfileAsync(studentId.ToString(), academicYear);
    }

    public async Task<StudentFeeProfileResponseDto?> GetStudentFeeProfileAsync(string studentIdOrAdm, string? academicYear)
    {
        string idStr = (studentIdOrAdm ?? "").Trim();
        bool isNumeric = int.TryParse(idStr, out int studentId);

        var student = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .Include(s => s.Branch)
            .Include(s => s.AcademicYear)
            .FirstOrDefaultAsync(s => (isNumeric && s.StudentId == studentId) || (s.AdmissionNumber != null && s.AdmissionNumber == idStr) || (s.RollNumber != null && s.RollNumber == idStr));

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
            if (student == null)
            {
                var app = await _context.AdmissionApplications.AsNoTracking().FirstOrDefaultAsync(a => a.Id == studentId);
                if (app != null && !string.IsNullOrEmpty(app.AdmissionNo))
                {
                    student = await _context.Students.AsNoTracking()
                        .Include(s => s.ClassGrade)
                        .Include(s => s.ClassSection)
                        .Include(s => s.Branch)
                        .Include(s => s.AcademicYear)
                        .FirstOrDefaultAsync(s => s.AdmissionNumber == app.AdmissionNo);
                }
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

        // Check residential / hosteller status
        bool isHosteller = await _context.StudentBedAllocations.AsNoTracking()
            .AnyAsync(b => (b.StudentId == student.StudentId || (student.AdmissionNumber != null && b.RegistrationNo == student.AdmissionNumber)) && 
                           (b.Status == "Active" || b.Status == "Occupied" || string.IsNullOrEmpty(b.Status)));

        var appRecord = await _context.AdmissionApplications.AsNoTracking()
            .FirstOrDefaultAsync(a => !a.IsDeleted && student.AdmissionNumber != null && (a.AdmissionNo == student.AdmissionNumber || a.RegistrationNo == student.AdmissionNumber));

        if (!isHosteller && appRecord != null)
        {
            isHosteller = appRecord.StudentType == "Residential";
        }

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

        string activeAYName = student.AcademicYear?.AcademicYearName ?? academicYear ?? $"{DateTime.UtcNow.Year}-{(DateTime.UtcNow.Year + 1)}";
        var matchYear = System.Text.RegularExpressions.Regex.Match(activeAYName, @"\d{4}");
        string yearPrefix = matchYear.Success ? matchYear.Value : activeAYName;

        // Dynamic Student Fee Policy resolution
        string sIdStr = student.StudentId.ToString();
        string sAdmNo = student.AdmissionNumber ?? string.Empty;

        string sRollNo = student.RollNumber ?? string.Empty;
        var feeAssignment = await _context.StudentFeeAssignments.AsNoTracking()
            .FirstOrDefaultAsync(a => (a.StudentId == sIdStr || (sAdmNo != "" && a.StudentId == sAdmNo) || (sRollNo != "" && a.StudentId == sRollNo)) &&
                                      (a.Status == "Active" || string.IsNullOrEmpty(a.Status)));

        string studentPolicy = feeAssignment?.FeePolicy ?? "Default Annual";

        string polLower = studentPolicy.Trim().ToLower();
        bool isAnnualPolicy = polLower == "default annual" ||
                              polLower == "full annual fee" ||
                              polLower == "full annual" ||
                              polLower == "annual" ||
                              polLower == "one time" ||
                              polLower == "one-time" ||
                              (!polLower.Contains("term") && !polLower.Contains("quarter") && !polLower.Contains("pro-rata") && !polLower.Contains("prorated") && !polLower.Contains("monthly"));

        var schedule = await _context.FeeSchedules.AsNoTracking()
            .Include(s => s.Terms)
            .FirstOrDefaultAsync(s => s.AcademicYear.Contains(yearPrefix) || s.Status == "Active" || s.Status == "Published");

        var scheduleTerms = schedule?.Terms?.OrderBy(t => t.Sequence).ToList() ?? new List<FeeScheduleTerm>();
        if (scheduleTerms.Count == 0)
        {
            scheduleTerms = new List<FeeScheduleTerm>
            {
                new FeeScheduleTerm { Id = "term-1", TermName = "Term 1", Sequence = 1, DueDate = $"{yearPrefix}-06-15", PercentageShare = 25m },
                new FeeScheduleTerm { Id = "term-2", TermName = "Term 2", Sequence = 2, DueDate = $"{yearPrefix}-09-15", PercentageShare = 25m },
                new FeeScheduleTerm { Id = "term-3", TermName = "Term 3", Sequence = 3, DueDate = $"{yearPrefix}-12-15", PercentageShare = 25m },
                new FeeScheduleTerm { Id = "term-4", TermName = "Term 4", Sequence = 4, DueDate = $"{int.Parse(yearPrefix) + 1}-03-15", PercentageShare = 25m },
            };
        }
        string defaultDueDate = !string.IsNullOrEmpty(schedule?.AnnualDueDate)
            ? schedule.AnnualDueDate
            : (scheduleTerms.FirstOrDefault()?.DueDate ?? DateTime.UtcNow.AddMonths(1).ToString("yyyy-MM-dd"));
        string dynamicFrequency = !isAnnualPolicy ? $"Term-Wise ({scheduleTerms.Count} Terms)" : "Annual";

        var tuitionHead = await _context.FeeHeads.AsNoTracking()
            .FirstOrDefaultAsync(h => h.Category.Contains("Tuition") || h.Name.Contains("Tuition"));
        string tuitionHeadId = tuitionHead?.Code ?? (!string.IsNullOrEmpty(tuitionHead?.Id.ToString()) ? tuitionHead.Id.ToString() : "FH-101");
        string tuitionHeadName = tuitionHead?.Name ?? "Academic Fee";
        string tuitionFrequency = isAnnualPolicy ? "Annual" : "Term-wise";

        List<FeeTermItemDto> BuildDynamicTerms(decimal totalAmount, decimal paidAmount, string prefix = "")
        {
            var terms = new List<FeeTermItemDto>();
            decimal runningPaidTerm = paidAmount;

            if (isAnnualPolicy)
            {
                DateTime dueDt = DateTime.UtcNow.AddMonths(1);
                bool hasDue = DateTime.TryParse(defaultDueDate, out dueDt);
                bool isTermOverdue = totalAmount > paidAmount && hasDue && DateTime.UtcNow.Date > dueDt.Date;
                int daysOverdue = isTermOverdue ? Math.Max(0, (DateTime.UtcNow.Date - dueDt.Date).Days) : 0;

                terms.Add(new FeeTermItemDto
                {
                    TermId = string.IsNullOrEmpty(prefix) ? "term-1" : $"{prefix}-term-1",
                    TermNumber = 1,
                    TermName = "Full Annual Fee",
                    DueDate = defaultDueDate,
                    Amount = totalAmount,
                    PaidAmount = paidAmount,
                    RemainingAmount = Math.Max(0m, totalAmount - paidAmount),
                    Status = (totalAmount <= paidAmount) ? "PAID" : (paidAmount > 0 ? "PARTIAL" : (isTermOverdue ? "OVERDUE" : "PENDING")),
                    IsOverdue = isTermOverdue,
                    DaysOverdue = daysOverdue
                });
            }
            else
            {
                int count = scheduleTerms.Count;
                for (int i = 0; i < count; i++)
                {
                    var curTerm = scheduleTerms[i];
                    decimal sharePct = curTerm.PercentageShare > 0 ? curTerm.PercentageShare : (100m / count);
                    decimal termAmt = (i == count - 1)
                        ? (totalAmount - terms.Sum(t => t.Amount))
                        : Math.Round(totalAmount * (sharePct / 100m), 2);

                    decimal termPaid = Math.Min(termAmt, runningPaidTerm);
                    runningPaidTerm -= termPaid;
                    decimal termRemaining = Math.Max(0m, termAmt - termPaid);

                    DateTime termDue;
                    bool hasDue = DateTime.TryParse(curTerm.DueDate, out termDue);
                    bool isTermOverdue = termRemaining > 0 && hasDue && DateTime.UtcNow.Date > termDue.Date;
                    int daysOverdue = isTermOverdue ? Math.Max(0, (DateTime.UtcNow.Date - termDue.Date).Days) : 0;

                    terms.Add(new FeeTermItemDto
                    {
                        TermId = string.IsNullOrEmpty(prefix) ? curTerm.Id.ToString() : $"{prefix}-{curTerm.Id}",
                        TermNumber = curTerm.Sequence,
                        TermName = curTerm.TermName,
                        DueDate = curTerm.DueDate,
                        Amount = termAmt,
                        PaidAmount = termPaid,
                        RemainingAmount = termRemaining,
                        Status = termRemaining == 0 ? "PAID" : (termPaid > 0 ? "PARTIAL" : (isTermOverdue ? "OVERDUE" : "PENDING")),
                        IsOverdue = isTermOverdue,
                        DaysOverdue = daysOverdue
                    });
                }
            }
            return terms;
        }

        // ==========================================
        // 1. TUITION & ACADEMIC LINE ITEMS
        // ==========================================
        decimal tuitionAssessed = 0m;
        decimal tuitionPaid = 0m;

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

                    tuitionAssessed += itemTotal;
                    tuitionPaid += itemPaid;

                    var itemTerms = BuildDynamicTerms(itemTotal, itemPaid);
                    bool isOverdue = itemRemaining > 0 && itemTerms.Any(t => t.IsOverdue);
                    int daysOverdue = isOverdue ? itemTerms.Max(t => t.DaysOverdue) : 0;

                    lineItems.Add(new FeeLineItemDto
                    {
                        FeeHeadId = !string.IsNullOrEmpty(pi.FeeHeadId) ? pi.FeeHeadId : tuitionHeadId,
                        HeadName = !string.IsNullOrEmpty(pi.FeeHeadName) ? pi.FeeHeadName : tuitionHeadName,
                        Frequency = tuitionFrequency,
                        DueDate = defaultDueDate,
                        TotalAmount = itemTotal,
                        PaidAmount = itemPaid,
                        RemainingAmount = itemRemaining,
                        Status = itemRemaining == 0 ? "PAID" : (itemPaid > 0 ? "PARTIAL" : (isOverdue ? "OVERDUE" : "PENDING")),
                        IsOverdue = isOverdue,
                        DaysOverdue = daysOverdue,
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

                tuitionAssessed = itemTotal;
                tuitionPaid = itemPaid;

                var itemTerms = BuildDynamicTerms(itemTotal, itemPaid);
                bool isOverdue = itemRemaining > 0 && itemTerms.Any(t => t.IsOverdue);
                int daysOverdue = isOverdue ? itemTerms.Max(t => t.DaysOverdue) : 0;

                lineItems.Add(new FeeLineItemDto
                {
                    FeeHeadId = tuitionHeadId,
                    HeadName = tuitionHeadName,
                    Frequency = tuitionFrequency,
                    DueDate = defaultDueDate,
                    TotalAmount = itemTotal,
                    PaidAmount = itemPaid,
                    RemainingAmount = itemRemaining,
                    Status = itemRemaining == 0 ? "PAID" : (itemPaid > 0 ? "PARTIAL" : (isOverdue ? "OVERDUE" : "PENDING")),
                    IsOverdue = isOverdue,
                    DaysOverdue = daysOverdue,
                    Terms = itemTerms
                });
            }
        }
        decimal tuitionRemainingDue = Math.Max(0m, tuitionAssessed - tuitionPaid);

        // ==========================================
        // 2. PAYMENT BREAKDOWN BY CATEGORY
        // ==========================================
        decimal rawTransportPaid = 0m;
        decimal rawDepositPaid = 0m;
        decimal rawHostelPaid = 0m;

        foreach (var p in payments)
        {
            bool handledInJson = false;
            if (!string.IsNullOrEmpty(p.PaidItemsJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(p.PaidItemsJson);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var elem in doc.RootElement.EnumerateArray())
                        {
                            string hn = "";
                            if (elem.TryGetProperty("headName", out var hnProp)) hn = hnProp.GetString() ?? "";
                            else if (elem.TryGetProperty("feeHeadName", out var hnProp2)) hn = hnProp2.GetString() ?? "";

                            decimal itmAmt = 0m;
                            if (elem.TryGetProperty("amount", out var aProp) && aProp.TryGetDecimal(out decimal av)) itmAmt = av;

                            if (hn.Contains("Security Deposit", StringComparison.OrdinalIgnoreCase))
                            {
                                rawDepositPaid += itmAmt;
                                handledInJson = true;
                            }
                            else if (hn.Contains("Hostel", StringComparison.OrdinalIgnoreCase))
                            {
                                rawHostelPaid += itmAmt;
                                handledInJson = true;
                            }
                            else if (hn.Contains("Transport", StringComparison.OrdinalIgnoreCase))
                            {
                                rawTransportPaid += itmAmt;
                                handledInJson = true;
                            }
                        }
                    }
                }
                catch { }
            }

            if (!handledInJson)
            {
                string combinedRef = $"{p.FeeHeadName} {p.TermName} {p.Remarks}".ToLowerInvariant();
                if (combinedRef.Contains("security deposit"))
                {
                    rawDepositPaid += p.Amount;
                }
                else if (combinedRef.Contains("hostel"))
                {
                    rawHostelPaid += p.Amount;
                }
                else if (combinedRef.Contains("transport"))
                {
                    rawTransportPaid += p.Amount;
                }
            }
        }

        // ==========================================
        // 3. TRANSPORT SERVICE (ACTIVE OR PRORATED USAGE)
        // ==========================================
        var ta = await _context.StudentTransportAssignments.AsNoTracking()
            .Include(t => t.Route)
            .Include(t => t.PickupPoint)
            .Where(t => (t.StudentId == student.StudentId || (student.AdmissionNumber != null && t.AdmissionNo == student.AdmissionNumber)) && !t.IsDeleted)
            .OrderByDescending(t => t.Status)
            .ThenByDescending(t => t.EffectiveTo ?? t.EffectiveFrom)
            .FirstOrDefaultAsync();

        bool hasTransportUsage = ta != null || (appRecord != null && (appRecord.TransportRequired == true || !string.IsNullOrEmpty(appRecord.BusRoute))) || rawTransportPaid > 0m;

        decimal transportAssessed = 0m;
        decimal transportPaidAmount = 0m;
        decimal transportRemaining = 0m;
        decimal transportCredit = 0m;
        string transportUsageSummary = "None";
        int transportMonthsUsed = 0;

        if (hasTransportUsage)
        {
            var route = ta?.Route;
            if (route == null && appRecord != null && !string.IsNullOrEmpty(appRecord.BusRoute))
            {
                route = await _context.TransportRoutes.AsNoTracking()
                    .FirstOrDefaultAsync(r => r.RouteName == appRecord.BusRoute || r.RouteId.ToString() == appRecord.BusRoute);
            }

            var pickup = ta?.PickupPoint;
            if (pickup == null && appRecord != null && !string.IsNullOrEmpty(appRecord.PickupPoint))
            {
                pickup = await _context.PickupPoints.AsNoTracking()
                    .FirstOrDefaultAsync(p => p.PickupPointName == appRecord.PickupPoint || p.PickupPointId.ToString() == appRecord.PickupPoint);
            }

            decimal distance = pickup?.DistanceFromStart ?? (route?.DistanceKm ?? 0m);
            decimal minKm = route?.MinRangeKm ?? 5m;
            string trpType = ta?.TransportType ?? appRecord?.TransportType ?? "AC";
            bool isAc = trpType.Contains("AC", StringComparison.OrdinalIgnoreCase) && !trpType.Contains("Non", StringComparison.OrdinalIgnoreCase);
            decimal baseFare = isAc ? (route?.AcBaseFare ?? 1200m) : (route?.NonAcBaseFare ?? 1000m);
            decimal ratePerKm = isAc ? (route?.AcRatePerKm ?? 150m) : (route?.NonAcRatePerKm ?? 100m);
            decimal monthlyFare = baseFare + Math.Max(0m, distance - minKm) * ratePerKm;

            bool isTransportEnded = (ta != null && (!ta.Status || ta.EffectiveTo.HasValue)) || isHosteller;

            if (isTransportEnded)
            {
                DateTime startDate = ta?.EffectiveFrom ?? appRecord?.CreatedAt ?? DateTime.UtcNow.AddMonths(-3);
                DateTime endDate = ta?.EffectiveTo ?? DateTime.UtcNow;
                if (endDate < startDate) endDate = startDate;

                int daysUsed = (int)(endDate.Date - startDate.Date).TotalDays;
                transportMonthsUsed = Math.Max(1, (int)Math.Round((double)Math.Max(0, daysUsed) / 30.4375, MidpointRounding.AwayFromZero));
                if (transportMonthsUsed > 12) transportMonthsUsed = 12;

                transportAssessed = Math.Round(monthlyFare * transportMonthsUsed, 2);
                transportPaidAmount = Math.Min(transportAssessed, rawTransportPaid);
                transportRemaining = Math.Max(0m, transportAssessed - rawTransportPaid);
                transportCredit = Math.Max(0m, rawTransportPaid - transportAssessed);

                transportUsageSummary = $"Used: {startDate:MMM yyyy} to {endDate:MMM yyyy} ({transportMonthsUsed} mo{(transportMonthsUsed > 1 ? "s" : "")}) @ ₹{monthlyFare:N0}/mo";

                var trpTerms = BuildDynamicTerms(transportAssessed, transportPaidAmount, "trp");
                bool isTrpOverdue = transportRemaining > 0 && trpTerms.Any(t => t.IsOverdue);
                int trpDaysOverdue = isTrpOverdue ? trpTerms.Max(t => t.DaysOverdue) : 0;

                string rName = route?.RouteName ?? appRecord?.BusRoute ?? "Route";
                string pName = pickup?.PickupPointName ?? appRecord?.PickupPoint ?? "Stop";

                lineItems.Add(new FeeLineItemDto
                {
                    FeeHeadId = "FH-TRP",
                    HeadName = $"Transport Fee ({rName} - {pName}) [{transportMonthsUsed} mos prorated]",
                    Frequency = $"{transportMonthsUsed} Months (Prorated)",
                    DueDate = defaultDueDate,
                    TotalAmount = transportAssessed,
                    PaidAmount = transportPaidAmount,
                    RemainingAmount = transportRemaining,
                    Status = transportRemaining == 0 ? "PAID" : (transportPaidAmount > 0 ? "PARTIAL" : (isTrpOverdue ? "OVERDUE" : "PENDING")),
                    IsOverdue = isTrpOverdue,
                    DaysOverdue = trpDaysOverdue,
                    Terms = trpTerms
                });
            }
            else
            {
                transportMonthsUsed = 12;
                transportAssessed = Math.Round(monthlyFare * 12m, 2);
                transportPaidAmount = Math.Min(transportAssessed, rawTransportPaid);
                transportRemaining = Math.Max(0m, transportAssessed - rawTransportPaid);
                transportCredit = Math.Max(0m, rawTransportPaid - transportAssessed);

                string rName = route?.RouteName ?? appRecord?.BusRoute ?? "Route";
                string pName = pickup?.PickupPointName ?? appRecord?.PickupPoint ?? "Stop";
                transportUsageSummary = $"Active: {rName} - {pName} @ ₹{monthlyFare:N0}/mo";

                var trpTerms = BuildDynamicTerms(transportAssessed, transportPaidAmount, "trp");
                bool isTrpOverdue = transportRemaining > 0 && trpTerms.Any(t => t.IsOverdue);
                int trpDaysOverdue = isTrpOverdue ? trpTerms.Max(t => t.DaysOverdue) : 0;

                lineItems.Add(new FeeLineItemDto
                {
                    FeeHeadId = "FH-TRP",
                    HeadName = $"Transport Fee ({rName} - {pName})",
                    Frequency = dynamicFrequency,
                    DueDate = defaultDueDate,
                    TotalAmount = transportAssessed,
                    PaidAmount = transportPaidAmount,
                    RemainingAmount = transportRemaining,
                    Status = transportRemaining == 0 ? "PAID" : (transportPaidAmount > 0 ? "PARTIAL" : (isTrpOverdue ? "OVERDUE" : "PENDING")),
                    IsOverdue = isTrpOverdue,
                    DaysOverdue = trpDaysOverdue,
                    Terms = trpTerms
                });
            }
        }

        // ==========================================
        // 4. HOSTEL ACCOMMODATION & SECURITY DEPOSIT
        // ==========================================
        decimal hostelAccommodationAssessed = 0m;
        decimal hostelAccommodationPaid = 0m;
        decimal hostelAccommodationRemaining = 0m;
        string hostelStaySummary = "None";

        decimal securityDepositAssessed = 0m;
        decimal securityDepositPaid = 0m;
        decimal securityDepositRemaining = 0m;

        if (isHosteller)
        {
            var alloc = await _context.StudentBedAllocations.AsNoTracking()
                .Include(b => b.Room)
                .ThenInclude(r => r!.RoomType)
                .Include(b => b.Hostel)
                .FirstOrDefaultAsync(b => (b.StudentId == student.StudentId || (student.AdmissionNumber != null && b.RegistrationNo == student.AdmissionNumber)) &&
                                          (b.Status == "Active" || b.Status == "Occupied" || string.IsNullOrEmpty(b.Status)));

            string blockName = alloc?.Hostel?.HostelName ?? appRecord?.HostelBlock ?? "";
            string blockId = alloc?.HostelId.ToString() ?? "";
            string roomNo = alloc?.Room?.RoomNumber ?? appRecord?.HostelRoom ?? "";
            string acType = alloc?.Room?.RoomType?.AcType ?? "";
            int bedCap = alloc?.Room?.RoomType?.BedCapacity ?? 0;
            string roomTypeSpec = alloc?.Room?.RoomType?.RoomTypeSpecification ?? "";

            if (alloc == null && appRecord != null && !string.IsNullOrEmpty(appRecord.HostelRoom))
            {
                var matchedRoom = await _context.RoomMasters.AsNoTracking()
                    .Include(r => r.RoomType)
                    .Include(r => r.Hostel)
                    .FirstOrDefaultAsync(r => 
                        (r.RoomNumber != null && CleanRoomNumber(r.RoomNumber) == CleanRoomNumber(appRecord.HostelRoom)) &&
                        (string.IsNullOrEmpty(appRecord.HostelBlock) || (r.Hostel != null && r.Hostel.HostelName != null && r.Hostel.HostelName.Equals(appRecord.HostelBlock, StringComparison.OrdinalIgnoreCase))));
                if (matchedRoom != null)
                {
                    if (string.IsNullOrEmpty(acType) && matchedRoom.RoomType != null) acType = matchedRoom.RoomType.AcType ?? "";
                    if (bedCap == 0 && matchedRoom.RoomType != null) bedCap = matchedRoom.RoomType.BedCapacity;
                    if (string.IsNullOrEmpty(roomTypeSpec) && matchedRoom.RoomType != null) roomTypeSpec = matchedRoom.RoomType.RoomTypeSpecification ?? "";
                }
            }

            var allHostelConfigs = await _context.HostelFeeConfigs.AsNoTracking()
                .Where(h => h.Status == "Active" || string.IsNullOrEmpty(h.Status))
                .ToListAsync();

            var allDbClasses = await _context.Classes.AsNoTracking()
                .Where(c => c.Status == "Active")
                .OrderBy(c => c.DisplayOrder ?? c.ClassId)
                .ToListAsync();
            var classOrderMap = BuildClassOrderMap(allDbClasses);

            var candidateConfigs = allHostelConfigs.Where(c => 
            {
                if (!MatchesClassRange(cName, c, classOrderMap)) return false;
                if (!string.IsNullOrEmpty(blockName) || !string.IsNullOrEmpty(blockId))
                {
                    bool bMatch = (c.HostelId == "All" || c.HostelName == "All" || string.IsNullOrWhiteSpace(c.HostelName) ||
                                   (!string.IsNullOrEmpty(blockId) && c.HostelId == blockId) ||
                                   (!string.IsNullOrEmpty(blockName) && c.HostelName.Equals(blockName, StringComparison.OrdinalIgnoreCase)) ||
                                   (!string.IsNullOrEmpty(blockName) && blockName.Contains(c.HostelName, StringComparison.OrdinalIgnoreCase)) ||
                                   (!string.IsNullOrEmpty(blockName) && c.HostelName.Contains(blockName, StringComparison.OrdinalIgnoreCase)));
                    if (!bMatch) return false;
                }
                if (!string.IsNullOrEmpty(roomNo) && c.RoomNo != "All Rooms" && c.RoomNo != "All" && !string.IsNullOrWhiteSpace(c.RoomNo))
                {
                    bool rMatch = (CleanRoomNumber(c.RoomNo) == CleanRoomNumber(roomNo)) ||
                                  (!string.IsNullOrEmpty(c.RoomId) && alloc != null && c.RoomId == alloc.RoomId.ToString());
                    if (!rMatch) return false;
                }
                if (!string.IsNullOrEmpty(acType) && c.AcType != "All" && !string.IsNullOrWhiteSpace(c.AcType))
                {
                    bool isAcStudent = acType.Contains("AC", StringComparison.OrdinalIgnoreCase) && !acType.Contains("Non", StringComparison.OrdinalIgnoreCase);
                    bool isAcConfig = c.AcType.Contains("AC", StringComparison.OrdinalIgnoreCase) && !c.AcType.Contains("Non", StringComparison.OrdinalIgnoreCase);
                    if (isAcStudent != isAcConfig) return false;
                }
                if (bedCap > 0 && c.SharingType != "All" && !string.IsNullOrWhiteSpace(c.SharingType))
                {
                    bool capMatch = c.SharingType.Contains(bedCap.ToString()) ||
                                    (bedCap == 1 && c.SharingType.Contains("single", StringComparison.OrdinalIgnoreCase)) ||
                                    (bedCap == 2 && c.SharingType.Contains("double", StringComparison.OrdinalIgnoreCase)) ||
                                    (bedCap == 3 && c.SharingType.Contains("triple", StringComparison.OrdinalIgnoreCase)) ||
                                    (bedCap == 4 && c.SharingType.Contains("4", StringComparison.OrdinalIgnoreCase));
                    if (!capMatch) return false;
                }
                return true;
            })
            .OrderByDescending(c => (c.RoomNo != "All Rooms" && c.RoomNo != "All" && !string.IsNullOrWhiteSpace(c.RoomNo)) ? 10 : 0)
            .ThenByDescending(c => (c.RoomTypeName != "All Room Types" && !string.IsNullOrWhiteSpace(c.RoomTypeName)) ? 5 : 0)
            .ThenByDescending(c => (c.AcType != "All" && !string.IsNullOrWhiteSpace(c.AcType)) ? 2 : 0)
            .ToList();

            var matchedCfg = candidateConfigs.FirstOrDefault() ??
                             allHostelConfigs.FirstOrDefault(c => MatchesClassRange(cName, c, classOrderMap)) ??
                             allHostelConfigs.FirstOrDefault();

            if (matchedCfg != null)
            {
                // Prorate accommodation if joined mid-year / transitioned from transport
                int hostelMonths = (transportMonthsUsed > 0 && transportMonthsUsed < 12) 
                    ? Math.Max(1, 12 - transportMonthsUsed) 
                    : 12;

                if (string.Equals(matchedCfg.FeePlan, "Monthly", StringComparison.OrdinalIgnoreCase))
                {
                    hostelAccommodationAssessed = matchedCfg.HostelFee * hostelMonths;
                }
                else
                {
                    hostelAccommodationAssessed = (hostelMonths < 12) 
                        ? Math.Round((matchedCfg.HostelFee / 12m) * hostelMonths, 2) 
                        : matchedCfg.HostelFee;
                }

                securityDepositAssessed = matchedCfg.SecurityDeposit;
            }

            // Security Deposit line item (Independent obligation)
            securityDepositPaid = rawDepositPaid;
            securityDepositRemaining = Math.Max(0m, securityDepositAssessed - securityDepositPaid);

            if (securityDepositAssessed > 0m || securityDepositPaid > 0m)
            {
                lineItems.Add(new FeeLineItemDto
                {
                    FeeHeadId = "FH-HST-DEP",
                    HeadName = "Hostel Security Deposit (Refundable)",
                    Frequency = "One Time",
                    DueDate = defaultDueDate,
                    TotalAmount = securityDepositAssessed,
                    PaidAmount = securityDepositPaid,
                    RemainingAmount = securityDepositRemaining,
                    Status = securityDepositRemaining == 0 ? "PAID" : (securityDepositPaid > 0 ? "PARTIAL" : "PENDING"),
                    IsOverdue = false,
                    DaysOverdue = 0,
                    Terms = new List<FeeTermItemDto>
                    {
                        new FeeTermItemDto
                        {
                            TermId = "deposit-onetime",
                            TermNumber = 1,
                            TermName = "One Time",
                            DueDate = defaultDueDate,
                            Amount = securityDepositAssessed,
                            PaidAmount = securityDepositPaid,
                            RemainingAmount = securityDepositRemaining,
                            Status = securityDepositRemaining == 0 ? "PAID" : (securityDepositPaid > 0 ? "PARTIAL" : "PENDING"),
                            IsOverdue = false,
                            DaysOverdue = 0
                        }
                    }
                });
            }

            // Hostel Accommodation line item
            hostelAccommodationPaid = rawHostelPaid;
            hostelAccommodationRemaining = Math.Max(0m, hostelAccommodationAssessed - hostelAccommodationPaid);

            if (hostelAccommodationAssessed > 0m || hostelAccommodationPaid > 0m)
            {
                var hstTerms = BuildDynamicTerms(hostelAccommodationAssessed, hostelAccommodationPaid, "Hostel Fee - ");
                bool isHstOverdue = hostelAccommodationRemaining > 0 && hstTerms.Any(t => t.IsOverdue);
                int hstDaysOverdue = isHstOverdue ? hstTerms.Max(t => t.DaysOverdue) : 0;

                string rNoDisplay = !string.IsNullOrEmpty(roomNo) ? $", Room {roomNo}" : "";
                string blockDisplay = !string.IsNullOrEmpty(blockName) ? blockName : "Hostel Block";
                int hstMonths = (transportMonthsUsed > 0 && transportMonthsUsed < 12) ? Math.Max(1, 12 - transportMonthsUsed) : 12;
                hostelStaySummary = $"{blockDisplay}{rNoDisplay} ({hstMonths} mos stay)";

                lineItems.Add(new FeeLineItemDto
                {
                    FeeHeadId = "FH-HST",
                    HeadName = $"Hostel Accommodation ({hostelStaySummary})",
                    Frequency = $"{hstMonths} Months (Prorated)",
                    DueDate = defaultDueDate,
                    TotalAmount = hostelAccommodationAssessed,
                    PaidAmount = hostelAccommodationPaid,
                    RemainingAmount = hostelAccommodationRemaining,
                    Status = hostelAccommodationRemaining == 0 ? "PAID" : (hostelAccommodationPaid > 0 ? "PARTIAL" : (isHstOverdue ? "OVERDUE" : "PENDING")),
                    IsOverdue = isHstOverdue,
                    DaysOverdue = hstDaysOverdue,
                    Terms = hstTerms
                });
            }
        }

        decimal totalOutstanding = lineItems.Sum(l => l.RemainingAmount);

        var receiptDtos = payments.Select(p => new StudentPaymentReceiptSummaryDto
        {
            ReceiptNo = !string.IsNullOrEmpty(p.ReceiptNo) ? p.ReceiptNo : $"REC-{p.PaymentDate.Year}-{p.Id:D4}",
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
            Branch = student.Branch?.BranchName ?? string.Empty,
            AcademicYear = student.AcademicYear?.AcademicYearName ?? $"{DateTime.UtcNow.Year}-{(DateTime.UtcNow.Year + 1)}",
            FatherName = student.FatherName ?? "",
            FatherMobile = student.FatherMobile ?? "",
            FeePolicy = studentPolicy,
            CurrentYearDues = totalOutstanding,
            PreviousYearsArrears = 0m,
            TotalConcessions = totalDiscounts,
            TotalOutstandingBalance = totalOutstanding,

            // Granular breakdown fields
            TuitionAssessedFee = tuitionAssessed,
            TuitionPaidAmount = tuitionPaid,
            TuitionRemainingDue = tuitionRemainingDue,

            TransportAssessedFee = transportAssessed,
            TransportPaidAmount = transportPaidAmount,
            TransportRemainingDue = transportRemaining,
            TransportCreditAmount = transportCredit,
            TransportUsageSummary = transportUsageSummary,

            HostelAssessedFee = hostelAccommodationAssessed,
            HostelPaidAmount = hostelAccommodationPaid,
            HostelRemainingDue = hostelAccommodationRemaining,
            HostelStaySummary = hostelStaySummary,

            SecurityDepositAssessed = securityDepositAssessed,
            SecurityDepositPaid = securityDepositPaid,
            SecurityDepositRemainingDue = securityDepositRemaining,
            SecurityDepositRefundable = securityDepositPaid,

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
            else
            {
                var app = await _context.AdmissionApplications.AsNoTracking().FirstOrDefaultAsync(a => a.Id == request.StudentId);
                if (app != null && !string.IsNullOrEmpty(app.AdmissionNo))
                {
                    var resolvedStudent = await _context.Students.AsNoTracking().FirstOrDefaultAsync(s =>
                        s.AdmissionNumber == app.AdmissionNo);
                    if (resolvedStudent != null)
                    {
                        canonicalStudentId = resolvedStudent.StudentId;
                    }
                }
            }
        }

        var existingProfile = await GetStudentFeeProfileAsync(canonicalStudentId, request.AcademicYear);
        if (existingProfile == null || existingProfile.TotalOutstandingBalance <= 0)
        {
            throw new InvalidOperationException("All fees for this student are already fully paid. No further payments can be collected.");
        }

        if (request.SelectedItems == null || !request.SelectedItems.Any())
        {
            throw new ArgumentException("Please select at least one pending fee component to collect.");
        }

        decimal maxAllowed = existingProfile.TotalOutstandingBalance + (request.IsFineWaived ? 0m : request.FineAmount) - request.ConcessionDiscountAmount;
        if (maxAllowed <= 0 || request.TotalAmountPaid > maxAllowed)
        {
            throw new InvalidOperationException($"Paying amount (₹{request.TotalAmountPaid:N2}) cannot exceed the remaining due balance of ₹{Math.Max(0m, maxAllowed):N2}.");
        }

        string termName = request.SelectedItems != null && request.SelectedItems.Any()
            ? string.Join(", ", request.SelectedItems.Select(i => i.TermName).Where(t => !string.IsNullOrEmpty(t)).Distinct())
            : "";
        string feeHeadName = request.SelectedItems != null && request.SelectedItems.Any()
            ? string.Join(", ", request.SelectedItems.Select(i => i.GetEffectiveHeadName()).Where(h => !string.IsNullOrEmpty(h)).Distinct())
            : "Tuition Fee";
        string itemsJson = request.SelectedItems != null && request.SelectedItems.Any()
            ? JsonSerializer.Serialize(request.SelectedItems)
            : "";

        string receiptNo = $"REC-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";

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
                            bool isAnnual = profile.FeePolicy == null ||
                                profile.FeePolicy.Contains("Annual", StringComparison.OrdinalIgnoreCase) ||
                                profile.FeePolicy.Contains("Full", StringComparison.OrdinalIgnoreCase) ||
                                profile.FeePolicy.Contains("One Time", StringComparison.OrdinalIgnoreCase) ||
                                profile.FeePolicy.Contains("One-Time", StringComparison.OrdinalIgnoreCase);

                            if (!isAnnual)
                            {
                                bool isDueOrArrived = item.IsOverdue || (!string.IsNullOrEmpty(item.DueDate) && DateTime.TryParse(item.DueDate, out var dDate) && dDate.Date <= DateTime.UtcNow.Date);
                                if (!isDueOrArrived) continue;
                            }
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

        // 1. Transport canonical detection
        if (lower.Contains("transport") || lower.Contains("conveyance") || lower.Contains("bus route") || lower.StartsWith("route") || lower.Contains("van"))
        {
            return "Transport Fee";
        }

        // 2. Hostel canonical detection
        if (lower.Contains("hostel") || lower.Contains("boarding") || lower.Contains("mess") || lower.Contains("block fee") || lower.Contains("bed fee"))
        {
            return "Hostel Fee";
        }

        // 3. Uniform canonical detection
        if (lower.Contains("uniform") || lower.Contains("merchandise") || lower.Contains("dress"))
        {
            return "Uniform Fee";
        }

        // 4. Late Fines detection
        if (lower.Contains("fine") || lower.Contains("penalty"))
        {
            return "Late Fines & Penalties";
        }

        // 5. Check exact match in configured Fee Heads
        var exact = activeHeads.FirstOrDefault(fh =>
            (!string.IsNullOrWhiteSpace(fh.Name) && fh.Name.Trim().ToLowerInvariant() == lower) ||
            (!string.IsNullOrWhiteSpace(fh.Category) && fh.Category.Trim().ToLowerInvariant() == lower));
        if (exact != null)
        {
            if (!string.IsNullOrWhiteSpace(exact.Category))
            {
                string catLower = exact.Category.Trim().ToLowerInvariant();
                if (catLower.Contains("hostel")) return "Hostel Fee";
                if (catLower.Contains("transport")) return "Transport Fee";
                if (catLower.Contains("uniform")) return "Uniform Fee";
                if (catLower.Contains("tuition") || catLower.Contains("academic")) return "Tuition Fee";
                return exact.Category.Trim();
            }
            return !string.IsNullOrWhiteSpace(exact.Name) ? exact.Name.Trim() : clean;
        }

        // 6. Check stripped alias
        string stripped = System.Text.RegularExpressions.Regex.Replace(lower, @"\s+fee$", "").Trim();
        var alias = activeHeads.FirstOrDefault(fh => {
            string hName = System.Text.RegularExpressions.Regex.Replace((fh.Name ?? "").Trim().ToLowerInvariant(), @"\s+fee$", "").Trim();
            string hCat = System.Text.RegularExpressions.Regex.Replace((fh.Category ?? "").Trim().ToLowerInvariant(), @"\s+fee$", "").Trim();
            return (hName.Length > 0 && hName == stripped) || (hCat.Length > 0 && hCat == stripped);
        });
        if (alias != null)
        {
            if (!string.IsNullOrWhiteSpace(alias.Category))
            {
                string catLower = alias.Category.Trim().ToLowerInvariant();
                if (catLower.Contains("hostel")) return "Hostel Fee";
                if (catLower.Contains("transport")) return "Transport Fee";
                if (catLower.Contains("uniform")) return "Uniform Fee";
                if (catLower.Contains("tuition") || catLower.Contains("academic")) return "Tuition Fee";
                return alias.Category.Trim();
            }
            return !string.IsNullOrWhiteSpace(alias.Name) ? alias.Name.Trim() : clean;
        }

        // 7. Admission detection
        if (lower.Contains("admission") || lower.Contains("registration") || lower.Contains("application"))
        {
            return "Admission Fee";
        }

        // 8. Tuition canonical detection
        if (lower.Contains("tuition") || lower.Contains("term") || lower.Contains("academic"))
        {
            return "Tuition Fee";
        }

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
                            bool isAnnual = profile.FeePolicy == null ||
                                profile.FeePolicy.Contains("Annual", StringComparison.OrdinalIgnoreCase) ||
                                profile.FeePolicy.Contains("Full", StringComparison.OrdinalIgnoreCase) ||
                                profile.FeePolicy.Contains("One Time", StringComparison.OrdinalIgnoreCase) ||
                                profile.FeePolicy.Contains("One-Time", StringComparison.OrdinalIgnoreCase);

                            if (!isAnnual)
                            {
                                bool isDueOrArrived = item.IsOverdue || (!string.IsNullOrEmpty(item.DueDate) && DateTime.TryParse(item.DueDate, out var dDate) && dDate.Date <= DateTime.UtcNow.Date);
                                if (!isDueOrArrived) continue;
                            }
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
        var allDbClasses = await _context.Classes.AsNoTracking()
            .Where(c => c.Status == "Active")
            .OrderBy(c => c.DisplayOrder ?? c.ClassId)
            .ToListAsync();

        var resultList = new List<PromotedDueStudentDto>();

        foreach (var st in students)
        {
            string cName = st.ClassGrade?.ClassName ?? string.Empty;
            string sName = st.ClassSection?.SectionName ?? string.Empty;
            string prevClass = GetPreviousClassName(cName, allDbClasses);
            string defaultPrevAY = $"{(DateTime.UtcNow.Year - 1)}-{DateTime.UtcNow.Year}";
            var prevYears = new List<string> { string.IsNullOrWhiteSpace(previousAcademicYear) || previousAcademicYear.Equals("ALL", StringComparison.OrdinalIgnoreCase) ? defaultPrevAY : previousAcademicYear };

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
                prevFeeTotal = 0m;
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

                List<FeeStructureItemDto>? parsedPrevItems = null;
                if (!string.IsNullOrEmpty(prevStructure?.ItemsJson))
                {
                    try
                    {
                        parsedPrevItems = JsonSerializer.Deserialize<List<FeeStructureItemDto>>(prevStructure.ItemsJson);
                    }
                    catch { }
                }

                var promotedItems = new List<PromotedDueItemDto>();
                if (parsedPrevItems != null && parsedPrevItems.Count > 0)
                {
                    decimal runningPaid = totalPaid;
                    int idx = 1;
                    foreach (var item in parsedPrevItems)
                    {
                        decimal itemAmt = item.Amount;
                        decimal itemPaid = Math.Min(itemAmt, runningPaid);
                        runningPaid -= itemPaid;
                        decimal itemDue = Math.Max(0m, itemAmt - itemPaid);

                        promotedItems.Add(new PromotedDueItemDto
                        {
                            Id = $"item-prev-{idx}-{st.StudentId}",
                            FeeHeadName = $"{item.FeeHeadName} Arrears",
                            TermName = "Annual",
                            DueDate = DateTime.UtcNow.AddMonths(-idx).ToString("yyyy-MM-dd"),
                            OriginalAmount = itemAmt,
                            PaidAmount = itemPaid,
                            DueAmount = itemDue,
                            Status = itemDue == 0 ? "Paid" : (itemPaid > 0 ? "Partially Paid" : "Due")
                        });
                        idx++;
                    }
                }
                else
                {
                    promotedItems.Add(new PromotedDueItemDto
                    {
                        Id = $"item-prev-1-{st.StudentId}",
                        FeeHeadName = "Previous Class Fee Arrears",
                        TermName = "Annual",
                        DueDate = DateTime.UtcNow.AddMonths(-1).ToString("yyyy-MM-dd"),
                        OriginalAmount = prevFeeTotal,
                        PaidAmount = totalPaid,
                        DueAmount = previousArrears,
                        Status = computedStatus
                    });
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
                    PreviousAcademicYear = prevYears.FirstOrDefault() ?? defaultPrevAY,
                    PreviousArrearsAmount = previousArrears,
                    PendingComponentsCount = promotedItems.Count(i => i.DueAmount > 0),
                    Status = computedStatus,
                    FatherName = st.FatherName ?? "",
                    FatherMobile = st.FatherMobile ?? "",
                    BreakdownByYear = new List<PromotedDueBreakdownGroupDto>
                    {
                        new PromotedDueBreakdownGroupDto
                        {
                            AcademicYear = prevYears.FirstOrDefault() ?? defaultPrevAY,
                            ClassName = prevClass,
                            TotalPending = previousArrears,
                            Items = promotedItems
                        }
                    }
                });
            }
        }

        return resultList;
    }

    private static string GetPreviousClassName(string currentClass, List<SMS.Api.Models.AcademicManagement.ClassGrade>? orderedClasses)
    {
        if (string.IsNullOrWhiteSpace(currentClass) || orderedClasses == null || orderedClasses.Count == 0)
            return string.Empty;

        int idx = orderedClasses.FindIndex(c => MatchesClassName(c.ClassName, currentClass));
        if (idx > 0)
        {
            return orderedClasses[idx - 1].ClassName ?? string.Empty;
        }
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

        var registerAdmissions = await _context.AdmissionApplications.AsNoTracking()
            .Include(a => a.AppliedClass)
            .Where(a => studentIdsStr.Contains(a.Id.ToString()) || (a.AdmissionNo != null && studentIdsStr.Contains(a.AdmissionNo)) || (a.RegistrationNo != null && studentIdsStr.Contains(a.RegistrationNo)))
            .ToListAsync();

        var items = new List<FeeReceiptDetailDto>();
        foreach (var p in payments)
        {
            var st = students.FirstOrDefault(s => s.StudentId.ToString() == p.StudentId || s.AdmissionNumber == p.StudentId);
            var adm = registerAdmissions.FirstOrDefault(a => a.Id.ToString() == p.StudentId || a.AdmissionNo == p.StudentId || a.RegistrationNo == p.StudentId);
            if (st == null && adm != null)
            {
                st = students.FirstOrDefault(s => (adm.AdmissionNo != null && s.AdmissionNumber == adm.AdmissionNo) || (adm.RegistrationNo != null && s.AdmissionNumber == adm.RegistrationNo));
            }

            string displayName = st?.StudentName ?? (adm != null ? $"{adm.FirstName} {adm.LastName}".Trim() : $"Student #{p.StudentId}");
            string displayAdm = st?.AdmissionNumber ?? adm?.AdmissionNo ?? adm?.RegistrationNo ?? p.StudentId;
            string displayClass = st?.ClassGrade?.ClassName ?? adm?.AppliedClass?.ClassName ?? string.Empty;

            items.Add(new FeeReceiptDetailDto
            {
                PaymentId = p.Id,
                ReceiptNo = !string.IsNullOrEmpty(p.ReceiptNo) ? p.ReceiptNo : $"REC-{p.PaymentDate.Year}-{p.Id:D4}",
                PaymentDate = p.PaymentDate,
                StudentId = st != null ? st.StudentId : (adm != null ? adm.Id : 0),
                AdmissionNo = displayAdm,
                StudentName = displayName,
                ClassName = displayClass,
                Section = st?.ClassSection?.SectionName ?? "A",
                AcademicYear = st?.AcademicYear?.AcademicYearName ?? $"{DateTime.UtcNow.Year}-{(DateTime.UtcNow.Year + 1)}",
                Branch = st?.Branch?.BranchName ?? adm?.BranchName ?? string.Empty,
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
            .FirstOrDefaultAsync(p => p.ReceiptNo == receiptNo || ($"REC-{p.PaymentDate.Year}-{p.Id:D4}") == receiptNo || ($"REC-2026-{p.Id:D4}") == receiptNo);
        if (payment == null) return null;

        var st = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .Include(s => s.Branch)
            .Include(s => s.AcademicYear)
            .FirstOrDefaultAsync(s => s.StudentId.ToString() == payment.StudentId || s.AdmissionNumber == payment.StudentId);

        var adm = await _context.AdmissionApplications.AsNoTracking()
            .Include(a => a.AppliedClass)
            .FirstOrDefaultAsync(a => a.Id.ToString() == payment.StudentId || a.AdmissionNo == payment.StudentId || a.RegistrationNo == payment.StudentId);

        if (st == null && adm != null)
        {
            st = await _context.Students.AsNoTracking()
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .Include(s => s.Branch)
                .Include(s => s.AcademicYear)
                .FirstOrDefaultAsync(s => (adm.AdmissionNo != null && s.AdmissionNumber == adm.AdmissionNo) || (adm.RegistrationNo != null && s.AdmissionNumber == adm.RegistrationNo));
        }

        var breakdown = new List<FeeBreakdownItemDto>();
        if (!string.IsNullOrEmpty(payment.PaidItemsJson))
        {
            try
            {
                var parsedItems = JsonSerializer.Deserialize<List<SelectedFeeItemPaymentDto>>(payment.PaidItemsJson);
                if (parsedItems != null && parsedItems.Count > 0)
                {
                    int idx = 1;
                    foreach (var it in parsedItems)
                    {
                        breakdown.Add(new FeeBreakdownItemDto
                        {
                            FeeId = idx.ToString(),
                            Title = !string.IsNullOrEmpty(it.TermName) ? $"{it.HeadName} ({it.TermName})" : it.HeadName,
                            Amount = it.Amount,
                            IsDue = false
                        });
                        idx++;
                    }
                }
            }
            catch { }
        }

        if (breakdown.Count == 0)
        {
            breakdown.Add(new FeeBreakdownItemDto
            {
                FeeId = "1",
                Title = !string.IsNullOrEmpty(payment.TermName)
                    ? $"{payment.FeeHeadName ?? "Fee"} ({payment.TermName})"
                    : (payment.FeeHeadName ?? "Tuition Fee"),
                Amount = payment.Amount,
                IsDue = false
            });
        }

        return new FeeReceiptDetailDto
        {
            PaymentId = payment.Id,
            ReceiptNo = !string.IsNullOrEmpty(payment.ReceiptNo) ? payment.ReceiptNo : $"REC-{payment.PaymentDate.Year}-{payment.Id:D4}",
            PaymentDate = payment.PaymentDate,
            StudentId = st != null ? st.StudentId : 0,
            AdmissionNo = st != null ? (st.AdmissionNumber ?? $"REG-{st.StudentId}") : payment.StudentId,
            StudentName = st != null ? (st.StudentName ?? $"Student #{st.StudentId}") : $"Student #{payment.StudentId}",
            ClassName = st?.ClassGrade?.ClassName ?? string.Empty,
            Section = st?.ClassSection?.SectionName ?? string.Empty,
            AcademicYear = st?.AcademicYear?.AcademicYearName ?? $"{DateTime.UtcNow.Year}-{(DateTime.UtcNow.Year + 1)}",
            Branch = st?.Branch?.BranchName ?? string.Empty,
            AmountPaid = payment.Amount,
            DiscountAmount = payment.DiscountAmount,
            FineAmount = payment.FineAmount,
            PaymentMethod = payment.PaymentMethod ?? "Cash",
            TransactionId = payment.TransactionId ?? "",
            Status = payment.Status ?? "Completed",
            Remarks = "Fee Collection Receipt",
            ItemizedBreakdown = breakdown
        };
    }

    public async Task<bool> CancelReceiptAsync(string receiptNo, string reason)
    {
        var payment = await _context.FeePayments
            .FirstOrDefaultAsync(p => p.ReceiptNo == receiptNo || ($"REC-{p.PaymentDate.Year}-{p.Id:D4}") == receiptNo || ($"REC-2026-{p.Id:D4}") == receiptNo);
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
            .Include(s => s.AcademicYear)
            .Where(s => !s.IsDeleted && (s.Status == "Active" || string.IsNullOrEmpty(s.Status)));

        var allBranches = await _context.Branches.AsNoTracking().ToListAsync();
        List<int> matchedBranchIds = new();

        if (!string.IsNullOrWhiteSpace(branch) && !branch.Equals("All", StringComparison.OrdinalIgnoreCase) && !branch.Equals("All Branches", StringComparison.OrdinalIgnoreCase))
        {
            string bClean = branch.Trim().ToLower();
            string bKeyword = System.Text.RegularExpressions.Regex.Replace(bClean, @"\b(branch|campus|school)\b", "").Trim();

            matchedBranchIds = allBranches
                .Where(b => b.BranchId.ToString() == branch ||
                            b.BranchName.ToLower() == bClean ||
                            b.BranchName.ToLower().Contains(bClean) ||
                            bClean.Contains(b.BranchName.ToLower()) ||
                            (!string.IsNullOrEmpty(bKeyword) && (b.BranchName.ToLower().Contains(bKeyword) || bKeyword.Contains(b.BranchName.ToLower()))) ||
                            (!string.IsNullOrEmpty(bKeyword) && b.Address != null && (b.Address.ToLower().Contains(bKeyword) || bKeyword.Contains(b.Address.ToLower()))) ||
                            (!string.IsNullOrEmpty(b.BranchCode) && b.BranchCode.ToLower() == bClean))
                .Select(b => b.BranchId)
                .Distinct()
                .ToList();

            if (matchedBranchIds.Count > 0)
            {
                studentQuery = studentQuery.Where(s => matchedBranchIds.Contains(s.BranchId));
            }
            else if (allBranches.Count == 1)
            {
                matchedBranchIds.Add(allBranches[0].BranchId);
                studentQuery = studentQuery.Where(s => s.BranchId == allBranches[0].BranchId);
            }
        }

        if (!string.IsNullOrWhiteSpace(academicYear) && !academicYear.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var matchYear = System.Text.RegularExpressions.Regex.Match(academicYear, @"\d{4}");
            string yearSub = matchYear.Success ? matchYear.Value : academicYear;

            studentQuery = studentQuery.Where(s => 
                s.AcademicYearId.ToString() == academicYear || 
                (s.AcademicYear != null && (s.AcademicYear.AcademicYearName.Contains(academicYear) || s.AcademicYear.AcademicYearName.Contains(yearSub))));

        }

        var activeStudents = await studentQuery.ToListAsync();
        var studentIdsSet = activeStudents.Select(s => s.StudentId.ToString()).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var admNosSet = activeStudents.Where(s => s.AdmissionNumber != null).Select(s => s.AdmissionNumber!).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var allActiveAdmissions = await _context.AdmissionApplications.AsNoTracking()
            .Include(a => a.AppliedClass)
            .Where(a => !a.IsDeleted && a.Status != "Rejected" && a.Status != "Deleted" && a.Status != "Withdrawn")
            .ToListAsync();

        foreach (var s in activeStudents)
        {
            var matchedApps = allActiveAdmissions.Where(a => 
                (s.AdmissionNumber != null && (a.AdmissionNo == s.AdmissionNumber || a.RegistrationNo == s.AdmissionNumber)) ||
                a.Id == s.StudentId ||
                (!string.IsNullOrEmpty(s.StudentName) && $"{a.FirstName} {a.LastName}".Trim().Equals(s.StudentName, StringComparison.OrdinalIgnoreCase)));
            foreach (var ma in matchedApps)
            {
                studentIdsSet.Add(ma.Id.ToString());
                if (!string.IsNullOrEmpty(ma.AdmissionNo)) admNosSet.Add(ma.AdmissionNo);
                if (!string.IsNullOrEmpty(ma.RegistrationNo)) admNosSet.Add(ma.RegistrationNo);
            }
        }

        string admBranchClean = !string.IsNullOrWhiteSpace(branch) ? branch.Trim().ToLower() : "";
        string admYearSub = !string.IsNullOrWhiteSpace(academicYear) && System.Text.RegularExpressions.Regex.IsMatch(academicYear, @"\d{4}")
            ? System.Text.RegularExpressions.Regex.Match(academicYear, @"\d{4}").Value
            : (academicYear ?? "");

        foreach (var adm in allActiveAdmissions)
        {
            string admIdStr = adm.Id.ToString();
            string admNo = adm.AdmissionNo ?? "";
            string regNo = adm.RegistrationNo ?? "";

            bool alreadyInActive = studentIdsSet.Contains(admIdStr) || 
                                   (!string.IsNullOrEmpty(admNo) && admNosSet.Contains(admNo)) ||
                                   (!string.IsNullOrEmpty(regNo) && admNosSet.Contains(regNo));

            if (!alreadyInActive)
            {
                bool branchMatches = string.IsNullOrWhiteSpace(branch) || branch.Equals("All", StringComparison.OrdinalIgnoreCase) || branch.Equals("All Branches", StringComparison.OrdinalIgnoreCase) ||
                    (!string.IsNullOrEmpty(adm.BranchName) && (adm.BranchName.ToLower().Contains(admBranchClean) || admBranchClean.Contains(adm.BranchName.ToLower())));

                if (branchMatches)
                {
                    string appliedClassName = adm.AppliedClass?.ClassName ?? "Nursery";

                    activeStudents.Add(new SMS.Api.Models.Student
                    {
                        StudentId = adm.Id,
                        AdmissionNumber = !string.IsNullOrEmpty(admNo) ? admNo : regNo,
                        StudentName = $"{adm.FirstName} {adm.LastName}".Trim(),
                        ClassGrade = new SMS.Api.Models.AcademicManagement.ClassGrade { ClassName = appliedClassName },
                        Status = "Active"
                    });
                    studentIdsSet.Add(admIdStr);
                    if (!string.IsNullOrEmpty(admNo)) admNosSet.Add(admNo);
                    if (!string.IsNullOrEmpty(regNo)) admNosSet.Add(regNo);
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(branch) && !branch.Equals("All", StringComparison.OrdinalIgnoreCase) && !branch.Equals("All Branches", StringComparison.OrdinalIgnoreCase))
        {
            if (activeStudents.Count > 0)
            {
                validPayments = validPayments
                    .Where(p => studentIdsSet.Contains(p.StudentId) || admNosSet.Contains(p.StudentId))
                    .ToList();
            }
            else
            {
                validPayments = new List<SMS.Api.Models.FinanceManagement.FeePayment>();
            }
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

        // 2. Tuition / Academic Fees Calculation
        var assignments = await _context.StudentFeeAssignments.AsNoTracking().ToListAsync();
        var allStructures = await _context.DynamicFeeStructures.AsNoTracking()
            .Where(d => d.Status == "Active" || string.IsNullOrEmpty(d.Status))
            .ToListAsync();

        var dynamicStructuresEnumerable = allStructures.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(branch) && !branch.Equals("All", StringComparison.OrdinalIgnoreCase) && !branch.Equals("All Branches", StringComparison.OrdinalIgnoreCase))
        {
            string bClean = branch.Trim().ToLower();
            string bKeyword = System.Text.RegularExpressions.Regex.Replace(bClean, @"\b(branch|campus|school)\b", "").Trim();

            dynamicStructuresEnumerable = dynamicStructuresEnumerable.Where(d =>
                string.IsNullOrEmpty(d.Branch) ||
                d.Branch.Equals("All", StringComparison.OrdinalIgnoreCase) ||
                d.Branch.Equals("All Branches", StringComparison.OrdinalIgnoreCase) ||
                d.Branch.ToLower() == bClean ||
                d.Branch.ToLower().Contains(bClean) ||
                bClean.Contains(d.Branch.ToLower()) ||
                (!string.IsNullOrEmpty(bKeyword) && (d.Branch.ToLower().Contains(bKeyword) || bKeyword.Contains(d.Branch.ToLower()))));
        }

        if (!string.IsNullOrWhiteSpace(academicYear) && !academicYear.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var matchYear = System.Text.RegularExpressions.Regex.Match(academicYear, @"\d{4}");
            string yearSub = matchYear.Success ? matchYear.Value : academicYear;

            dynamicStructuresEnumerable = dynamicStructuresEnumerable.Where(d =>
                string.IsNullOrEmpty(d.AcademicYear) ||
                d.AcademicYear.Equals("All", StringComparison.OrdinalIgnoreCase) ||
                d.AcademicYear.Contains(academicYear, StringComparison.OrdinalIgnoreCase) ||
                d.AcademicYear.Contains(yearSub, StringComparison.OrdinalIgnoreCase));
        }

        var dynamicStructures = dynamicStructuresEnumerable.ToList();
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
            string sAdmNo = s.AdmissionNumber ?? "";
            if (assignmentDict.TryGetValue(sIdStr, out decimal assignedAmt) || (!string.IsNullOrEmpty(sAdmNo) && assignmentDict.TryGetValue(sAdmNo, out assignedAmt)) || (!string.IsNullOrEmpty(s.RollNumber) && assignmentDict.TryGetValue(s.RollNumber, out assignedAmt)))
            {
                tuitionExpected += assignedAmt;
            }
            else
            {
                string stClassName = GetStudentClassName(s);
                var matchedDfs = dynamicStructures.FirstOrDefault(d => 
                    !string.IsNullOrEmpty(d.ClassName) && 
                    !string.IsNullOrEmpty(stClassName) && 
                    MatchesClassName(d.ClassName, stClassName));
                if (matchedDfs != null)
                {
                    tuitionExpected += matchedDfs.TotalAmount;
                }
            }
        }

        // Dedicated payment totals (parsed dynamically from individual paid items or payment heads)
        decimal transportCollected = 0m;
        decimal fineCollected = validPayments.Sum(p => p.FineAmount);
        decimal hostelCollectedFromPayments = 0m;
        decimal uniformCollectedFromPayments = 0m;
        decimal tuitionCollectedFromPayments = 0m;

        foreach (var p in validPayments)
        {
            bool hasItemBreakdown = false;
            if (!string.IsNullOrEmpty(p.PaidItemsJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(p.PaidItemsJson);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var elem in doc.RootElement.EnumerateArray())
                        {
                            decimal itemAmt = 0m;
                            if (elem.TryGetProperty("amount", out var amtProp) && amtProp.TryGetDecimal(out decimal aVal))
                                itemAmt = aVal;
                            else if (elem.TryGetProperty("Amount", out var amtProp2) && amtProp2.TryGetDecimal(out decimal aVal2))
                                itemAmt = aVal2;

                            string hName = "";
                            if (elem.TryGetProperty("feeHeadName", out var hnProp)) hName = hnProp.GetString() ?? "";
                            else if (elem.TryGetProperty("HeadName", out var hnProp2)) hName = hnProp2.GetString() ?? "";
                            else if (elem.TryGetProperty("headName", out var hnProp3)) hName = hnProp3.GetString() ?? "";

                            if (itemAmt > 0)
                            {
                                hasItemBreakdown = true;
                                if (hName.Contains("Transport", StringComparison.OrdinalIgnoreCase))
                                {
                                    transportCollected += itemAmt;
                                }
                                else if (hName.Contains("Hostel", StringComparison.OrdinalIgnoreCase))
                                {
                                    hostelCollectedFromPayments += itemAmt;
                                }
                                else if (hName.Contains("Uniform", StringComparison.OrdinalIgnoreCase))
                                {
                                    uniformCollectedFromPayments += itemAmt;
                                }
                                else
                                {
                                    tuitionCollectedFromPayments += itemAmt;
                                }
                            }
                        }
                    }
                }
                catch
                {
                    hasItemBreakdown = false;
                }
            }

            if (!hasItemBreakdown)
            {
                if (p.TransportFee > 0)
                {
                    transportCollected += p.TransportFee;
                }
                string hName = p.FeeHeadName ?? "";
                string rem = p.Remarks ?? "";
                if (hName.Contains("Hostel", StringComparison.OrdinalIgnoreCase) || rem.Contains("Hostel", StringComparison.OrdinalIgnoreCase))
                {
                    hostelCollectedFromPayments += p.Amount;
                }
                else if (hName.Contains("Uniform", StringComparison.OrdinalIgnoreCase) || rem.Contains("Uniform", StringComparison.OrdinalIgnoreCase))
                {
                    uniformCollectedFromPayments += p.Amount;
                }
                else if (hName.Contains("Transport", StringComparison.OrdinalIgnoreCase) || rem.Contains("Transport", StringComparison.OrdinalIgnoreCase))
                {
                    transportCollected += p.Amount;
                }
                else if (hName.Contains("Tuition", StringComparison.OrdinalIgnoreCase) || rem.Contains("Tuition", StringComparison.OrdinalIgnoreCase) || (tuitionExpected > 0 && !hName.Contains("Admission", StringComparison.OrdinalIgnoreCase) && !rem.Contains("Admission", StringComparison.OrdinalIgnoreCase)))
                {
                    tuitionCollectedFromPayments += Math.Max(0m, p.Amount - p.TransportFee - p.FineAmount);
                }
            }
        }

        // 3. Hostel Module Metrics (100% Dynamic from active bed allocations, residential admissions, and hostel fee configs)
        var activeBedAllocations = await _context.StudentBedAllocations.AsNoTracking()
            .Include(b => b.Room)
            .ThenInclude(r => r!.RoomType)
            .Include(b => b.Hostel)
            .Where(b => b.Status == "Active" || b.Status == "Occupied" || string.IsNullOrEmpty(b.Status))
            .ToListAsync();

        var hostelAdmissions = allActiveAdmissions
            .Where(a => a.StudentType == "Residential")
            .ToList();

        var allHostelConfigs = await _context.HostelFeeConfigs.AsNoTracking()
            .Where(h => h.Status == "Active" || string.IsNullOrEmpty(h.Status))
            .ToListAsync();

        var allDbClasses = await _context.Classes.AsNoTracking()
            .Where(c => c.Status == "Active")
            .OrderBy(c => c.DisplayOrder ?? c.ClassId)
            .ToListAsync();
        var classOrderMap = BuildClassOrderMap(allDbClasses);

        var allHostelBlocks = await _context.HostelBlocks.AsNoTracking().ToListAsync();
        var allHostelRooms = await _context.RoomMasters.AsNoTracking()
            .Include(r => r.RoomType)
            .Include(r => r.Hostel)
            .ToListAsync();

        decimal hostelExpected = 0m;
        var studentHostelMap = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        foreach (var s in activeStudents)
        {
            string sIdStr = s.StudentId.ToString();
            string admNo = s.AdmissionNumber ?? "";
            string stClassName = GetStudentClassName(s);

            var alloc = activeBedAllocations.FirstOrDefault(b => 
                (b.StudentId.HasValue && b.StudentId.Value == s.StudentId) ||
                (!string.IsNullOrEmpty(admNo) && (b.RegistrationNo == admNo || b.StudentName == s.StudentName)));

            var app = hostelAdmissions.FirstOrDefault(a => 
                (!string.IsNullOrEmpty(admNo) && (a.AdmissionNo == admNo || a.RegistrationNo == admNo)) ||
                a.Id == s.StudentId);

            bool isResident = (app != null && app.StudentType == "Residential") ||
                              (alloc != null && (alloc.Status == "Active" || alloc.Status == "Occupied"));
            if (app != null && app.StudentType == "Non-Residential" && (alloc == null || alloc.Status == "Vacated"))
            {
                isResident = false;
            }
            if (isResident)
            {
                string blockName = alloc?.Hostel?.HostelName ?? app?.HostelBlock ?? "";
                string blockId = alloc?.HostelId.ToString() ?? "";
                string roomNo = alloc?.Room?.RoomNumber ?? app?.HostelRoom ?? "";
                string acType = alloc?.Room?.RoomType?.AcType ?? "";
                int bedCap = alloc?.Room?.RoomType?.BedCapacity ?? 0;
                string roomTypeSpec = alloc?.Room?.RoomType?.RoomTypeSpecification ?? "";

                if (alloc == null && app != null && !string.IsNullOrEmpty(app.HostelRoom))
                {
                    var matchedRoom = allHostelRooms.FirstOrDefault(r => 
                        CleanRoomNumber(r.RoomNumber) == CleanRoomNumber(app.HostelRoom) &&
                        (string.IsNullOrEmpty(app.HostelBlock) || (r.Hostel != null && r.Hostel.HostelName != null && r.Hostel.HostelName.Equals(app.HostelBlock, StringComparison.OrdinalIgnoreCase))));
                    if (matchedRoom != null)
                    {
                        if (string.IsNullOrEmpty(acType) && matchedRoom.RoomType != null) acType = matchedRoom.RoomType.AcType ?? "";
                        if (bedCap == 0 && matchedRoom.RoomType != null) bedCap = matchedRoom.RoomType.BedCapacity;
                        if (string.IsNullOrEmpty(roomTypeSpec) && matchedRoom.RoomType != null) roomTypeSpec = matchedRoom.RoomType.RoomTypeSpecification ?? "";
                    }
                }

                var candidateConfigs = allHostelConfigs.Where(c => 
                {
                    if (!MatchesClassRange(stClassName, c, classOrderMap)) return false;

                    if (!string.IsNullOrEmpty(blockName) || !string.IsNullOrEmpty(blockId))
                    {
                        bool bMatch = (c.HostelId == "All" || c.HostelName == "All" || string.IsNullOrWhiteSpace(c.HostelName) ||
                                       (!string.IsNullOrEmpty(blockId) && c.HostelId == blockId) ||
                                       (!string.IsNullOrEmpty(blockName) && c.HostelName.Equals(blockName, StringComparison.OrdinalIgnoreCase)) ||
                                       (!string.IsNullOrEmpty(blockName) && blockName.Contains(c.HostelName, StringComparison.OrdinalIgnoreCase)) ||
                                       (!string.IsNullOrEmpty(blockName) && c.HostelName.Contains(blockName, StringComparison.OrdinalIgnoreCase)));
                        if (!bMatch) return false;
                    }

                    if (!string.IsNullOrEmpty(roomNo) && c.RoomNo != "All Rooms" && c.RoomNo != "All" && !string.IsNullOrWhiteSpace(c.RoomNo))
                    {
                        bool rMatch = CleanRoomNumber(c.RoomNo) == CleanRoomNumber(roomNo) ||
                                      (!string.IsNullOrEmpty(c.RoomId) && alloc != null && c.RoomId == alloc.RoomId.ToString());
                        if (!rMatch) return false;
                    }

                    if (!string.IsNullOrEmpty(acType) && c.AcType != "All" && !string.IsNullOrWhiteSpace(c.AcType))
                    {
                        bool isAcStudent = acType.Contains("AC", StringComparison.OrdinalIgnoreCase) && !acType.Contains("Non", StringComparison.OrdinalIgnoreCase);
                        bool isAcConfig = c.AcType.Contains("AC", StringComparison.OrdinalIgnoreCase) && !c.AcType.Contains("Non", StringComparison.OrdinalIgnoreCase);
                        if (isAcStudent != isAcConfig) return false;
                    }

                    if (bedCap > 0 && c.SharingType != "All" && !string.IsNullOrWhiteSpace(c.SharingType))
                    {
                        bool capMatch = c.SharingType.Contains(bedCap.ToString()) ||
                                        (bedCap == 1 && c.SharingType.Contains("single", StringComparison.OrdinalIgnoreCase)) ||
                                        (bedCap == 2 && c.SharingType.Contains("double", StringComparison.OrdinalIgnoreCase)) ||
                                        (bedCap == 3 && c.SharingType.Contains("triple", StringComparison.OrdinalIgnoreCase)) ||
                                        (bedCap == 4 && c.SharingType.Contains("4", StringComparison.OrdinalIgnoreCase));
                        if (!capMatch) return false;
                    }

                    return true;
                })
                .OrderByDescending(c => (c.RoomNo != "All Rooms" && c.RoomNo != "All" && !string.IsNullOrWhiteSpace(c.RoomNo)) ? 10 : 0)
                .ThenByDescending(c => (c.RoomTypeName != "All Room Types" && !string.IsNullOrWhiteSpace(c.RoomTypeName)) ? 5 : 0)
                .ThenByDescending(c => (c.AcType != "All" && !string.IsNullOrWhiteSpace(c.AcType)) ? 2 : 0)
                .ToList();

                var matchedCfg = candidateConfigs.FirstOrDefault();
                decimal annualHostelFee = 0m;

                if (matchedCfg != null)
                {
                    decimal hFee = matchedCfg.HostelFee;
                    decimal sDep = matchedCfg.SecurityDeposit;
                    if (string.Equals(matchedCfg.FeePlan, "Monthly", StringComparison.OrdinalIgnoreCase))
                    {
                        annualHostelFee = (hFee * 12m) + sDep;
                    }
                    else
                    {
                        annualHostelFee = hFee + sDep;
                    }
                }
                else if (allHostelConfigs.Count > 0)
                {
                    var classCfg = allHostelConfigs.FirstOrDefault(c => MatchesClassRange(stClassName, c, classOrderMap)) ?? allHostelConfigs.First();
                    annualHostelFee = classCfg.HostelFee + classCfg.SecurityDeposit;
                }

                if (annualHostelFee > 0m)
                {
                    studentHostelMap[sIdStr] = annualHostelFee;
                    if (!string.IsNullOrEmpty(admNo)) studentHostelMap[admNo] = annualHostelFee;
                    hostelExpected += annualHostelFee;
                }
            }
        }

        decimal hostelCollected = hostelCollectedFromPayments;

        // 4. Transport Module Metrics
        var activeTransportAssignments = await _context.StudentTransportAssignments.AsNoTracking()
            .Include(t => t.Route)
            .Include(t => t.PickupPoint)
            .Where(t => t.Status == true && !t.IsDeleted)
            .ToListAsync();

        var transportAdmissions = allActiveAdmissions
            .Where(a => a.TransportRequired == true)
            .ToList();

        var allRoutes = await _context.TransportRoutes.AsNoTracking().ToListAsync();
        var allPickupPoints = await _context.PickupPoints.AsNoTracking().ToListAsync();

        decimal transportExpected = 0m;
        var studentTransportMap = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        foreach (var s in activeStudents)
        {
            string sIdStr = s.StudentId.ToString();
            string admNo = s.AdmissionNumber ?? "";

            var ta = activeTransportAssignments.FirstOrDefault(t => 
                (t.StudentId.HasValue && t.StudentId.Value == s.StudentId) ||
                (!string.IsNullOrEmpty(admNo) && t.AdmissionNo == admNo));

            var app = transportAdmissions.FirstOrDefault(a => 
                (!string.IsNullOrEmpty(admNo) && (a.AdmissionNo == admNo || a.RegistrationNo == admNo)) ||
                a.Id == s.StudentId);

            bool requiresTransport = ta != null || (app != null && app.TransportRequired == true);

            if (requiresTransport)
            {
                var route = ta?.Route;
                if (route == null && app != null && !string.IsNullOrEmpty(app.BusRoute))
                {
                    string cleanAppRoute = System.Text.RegularExpressions.Regex.Replace(app.BusRoute.Trim().ToLower(), @"\s+", " ");
                    route = allRoutes.FirstOrDefault(r => 
                        System.Text.RegularExpressions.Regex.Replace((r.RouteName ?? "").Trim().ToLower(), @"\s+", " ") == cleanAppRoute || 
                        r.RouteId.ToString() == app.BusRoute);
                }

                var pickup = ta?.PickupPoint;
                if (pickup == null && app != null && !string.IsNullOrEmpty(app.PickupPoint))
                {
                    string cleanAppPickup = System.Text.RegularExpressions.Regex.Replace(app.PickupPoint.Trim().ToLower(), @"\s+", " ");
                    pickup = allPickupPoints.FirstOrDefault(p => 
                        System.Text.RegularExpressions.Regex.Replace((p.PickupPointName ?? "").Trim().ToLower(), @"\s+", " ") == cleanAppPickup || 
                        p.PickupPointId.ToString() == app.PickupPoint);
                }

                decimal distance = pickup?.DistanceFromStart ?? (route?.DistanceKm ?? 0m);
                decimal minKm = route?.MinRangeKm ?? 35m;
                string trpType = ta?.TransportType ?? app?.TransportType ?? "AC";
                bool isAc = trpType.Contains("AC", StringComparison.OrdinalIgnoreCase) && !trpType.Contains("Non", StringComparison.OrdinalIgnoreCase);
                decimal baseFare = isAc ? (route?.AcBaseFare ?? 1500m) : (route?.NonAcBaseFare ?? 1200m);
                decimal ratePerKm = isAc ? (route?.AcRatePerKm ?? 150m) : (route?.NonAcRatePerKm ?? 100m);
                decimal monthlyFare = baseFare + Math.Max(0m, distance - minKm) * ratePerKm;
                decimal annualTransportFare = monthlyFare * 12m;

                if (annualTransportFare == 0m)
                {
                    annualTransportFare = (pickup?.MonthlyFee ?? 1200m) * 12m;
                }

                studentTransportMap[sIdStr] = annualTransportFare;
                if (!string.IsNullOrEmpty(admNo)) studentTransportMap[admNo] = annualTransportFare;

                transportExpected += annualTransportFare;
            }
        }

        if (transportExpected == 0m && (string.IsNullOrWhiteSpace(branch) || branch.Equals("All", StringComparison.OrdinalIgnoreCase) || branch.Equals("All Branches", StringComparison.OrdinalIgnoreCase)) && activeTransportAssignments.Count > 0)
        {
            transportExpected = activeTransportAssignments.Sum(t => (t.PickupPoint?.MonthlyFee ?? 1200m) * 12m);
        }
        else if (transportExpected == 0m && transportCollected > 0)
        {
            transportExpected = transportCollected;
        }

        decimal transportCollectedTotal = transportCollected;

        // 5. Uniform Module Metrics (100% Dynamic from active students in selected branch & academic year)
        var uniformDistributionsQuery = _context.StudentUniformDistributions.AsNoTracking()
            .Where(u => u.Status != "Cancelled");

        List<SMS.Api.Models.StudentUniformDistribution> uniformDistributions;
        if (!string.IsNullOrWhiteSpace(branch) && !branch.Equals("All", StringComparison.OrdinalIgnoreCase) && !branch.Equals("All Branches", StringComparison.OrdinalIgnoreCase))
        {
            if (activeStudents.Count > 0)
            {
                var activeStudentIds = activeStudents.Select(s => (int?)s.StudentId).Where(id => id.HasValue).ToHashSet();
                uniformDistributions = await uniformDistributionsQuery
                    .Where(u => (u.StudentId.HasValue && activeStudentIds.Contains(u.StudentId)) ||
                                (!string.IsNullOrEmpty(u.AdmissionNo) && admNosSet.Contains(u.AdmissionNo)))
                    .ToListAsync();
            }
            else
            {
                uniformDistributions = new List<SMS.Api.Models.StudentUniformDistribution>();
            }
        }
        else
        {
            // If All Branches, only count distributions belonging to actual valid non-deleted students
            var allValidStudents = await _context.Students.AsNoTracking()
                .Where(s => !s.IsDeleted && (s.Status == "Active" || string.IsNullOrEmpty(s.Status)))
                .Select(s => new { s.StudentId, s.AdmissionNumber })
                .ToListAsync();

            var validStudentIdsSet = allValidStudents.Select(s => s.StudentId).ToHashSet();
            var validAdmNosSet = allValidStudents.Where(s => !string.IsNullOrEmpty(s.AdmissionNumber)).Select(s => s.AdmissionNumber!).ToHashSet(StringComparer.OrdinalIgnoreCase);

            uniformDistributions = await uniformDistributionsQuery
                .Where(u => (u.StudentId.HasValue && validStudentIdsSet.Contains(u.StudentId.Value)) ||
                            (!string.IsNullOrEmpty(u.AdmissionNo) && validAdmNosSet.Contains(u.AdmissionNo)))
                .ToListAsync();
        }

        decimal uniformExpected = uniformDistributions.Count > 0
            ? uniformDistributions.Sum(u => u.TotalAmount)
            : 0m;

        decimal uniformCollected = uniformDistributions.Count > 0
            ? uniformDistributions.Where(u => u.PaymentStatus == "Paid").Sum(u => u.TotalAmount) + uniformCollectedFromPayments
            : uniformCollectedFromPayments;

        // 6. Fines Metrics
        decimal feeChargesFines = 0m;

        decimal finesExpected = Math.Max(fineCollected, feeChargesFines);
        decimal finesCollected = fineCollected;

        // 7. Tuition Collected Calculation
        decimal tuitionCollected = tuitionCollectedFromPayments;
        if (tuitionCollected == 0m && tuitionExpected > 0 && validPayments.Count > 0 && (hostelCollected + transportCollectedTotal + uniformCollected + finesCollected) == 0m)
        {
            tuitionCollected = validPayments.Sum(p => p.Amount);
        }
        if (tuitionExpected > 0m && tuitionCollected > tuitionExpected)
        {
            tuitionCollected = tuitionExpected;
        }

        // 8. Main Dashboard Financial Totals Aggregation
        decimal totalExpected = tuitionExpected + hostelExpected + transportExpected + uniformExpected + finesExpected;
        decimal rawPaymentsTotal = validPayments.Sum(p => p.Amount);
        decimal sumModuleCollected = tuitionCollected + hostelCollected + transportCollectedTotal + uniformCollected + finesCollected;
        decimal totalCollected = Math.Max(rawPaymentsTotal, sumModuleCollected);

        // A school or student can never collect more than the expected fee dynamically
        if (totalExpected > 0m && totalCollected > totalExpected)
        {
            totalCollected = totalExpected;
        }
        if (transportExpected > 0m && transportCollectedTotal > transportExpected)
        {
            transportCollectedTotal = transportExpected;
        }
        if (hostelExpected > 0m && hostelCollected > hostelExpected)
        {
            hostelCollected = hostelExpected;
        }
        if (uniformExpected > 0m && uniformCollected > uniformExpected)
        {
            uniformCollected = uniformExpected;
        }
        if (finesExpected > 0m && finesCollected > finesExpected)
        {
            finesCollected = finesExpected;
        }

        // Student-Wise Fee Payment Policy & Term-Wise Pending Dues Calculation
        string yearPrefix = !string.IsNullOrWhiteSpace(academicYear) && !academicYear.Equals("All", StringComparison.OrdinalIgnoreCase)
            ? (System.Text.RegularExpressions.Regex.IsMatch(academicYear, @"\d{4}") ? System.Text.RegularExpressions.Regex.Match(academicYear, @"\d{4}").Value : academicYear)
            : "2026";

        var schedule = await _context.FeeSchedules.AsNoTracking()
            .Include(s => s.Terms)
            .FirstOrDefaultAsync(s => s.AcademicYear.Contains(yearPrefix) || s.Status == "Active" || s.Status == "Published");

        var scheduleTerms = schedule?.Terms?.OrderBy(t => t.Sequence).ToList() ?? new List<FeeScheduleTerm>();

        if (scheduleTerms.Count == 0)
        {
            var ayEntity = await _context.AcademicYears.AsNoTracking()
                .FirstOrDefaultAsync(y => y.AcademicYearName.Contains(yearPrefix) || y.IsCurrent);
            if (ayEntity != null)
            {
                var generatedTerms = SMS.Api.Services.Implementations.FinanceManagement.AcademicYearTermCalculator.GenerateTermsFromAcademicYear(ayEntity, 4, 15);
                foreach (var gt in generatedTerms)
                {
                    scheduleTerms.Add(new FeeScheduleTerm
                    {
                        TermName = gt.TermName,
                        Sequence = gt.Sequence,
                        DueDate = gt.DueDate,
                        PercentageShare = gt.PercentageShare > 0 ? (decimal)gt.PercentageShare : 25m
                    });
                }
            }
            else
            {
                scheduleTerms = new List<FeeScheduleTerm>
                {
                    new FeeScheduleTerm { TermName = "Term 1", Sequence = 1, DueDate = $"{yearPrefix}-06-15", PercentageShare = 25m },
                    new FeeScheduleTerm { TermName = "Term 2", Sequence = 2, DueDate = $"{yearPrefix}-09-15", PercentageShare = 25m },
                    new FeeScheduleTerm { TermName = "Term 3", Sequence = 3, DueDate = $"{yearPrefix}-12-15", PercentageShare = 25m },
                    new FeeScheduleTerm { TermName = "Term 4", Sequence = 4, DueDate = $"{int.Parse(yearPrefix) + 1}-03-15", PercentageShare = 25m },
                };
            }
        }

        DateTime today = DateTime.UtcNow.Date;
        DateTime todayIst = DateTime.UtcNow.AddHours(5.5).Date;
        DateTime effectiveToday = todayIst;

        decimal totalPendingDues = 0m;

        foreach (var s in activeStudents)
        {
            string sIdStr = s.StudentId.ToString();
            string sAdmNo = s.AdmissionNumber ?? "";

            decimal stTuition = 0m;
            if (assignmentDict.TryGetValue(sIdStr, out decimal assignedAmt))
            {
                stTuition = assignedAmt;
            }
            else
            {
                string stClassName = GetStudentClassName(s);
                var matchedDfs = dynamicStructures.FirstOrDefault(d => 
                    !string.IsNullOrEmpty(d.ClassName) && 
                    !string.IsNullOrEmpty(stClassName) && 
                    MatchesClassName(d.ClassName, stClassName));
                if (matchedDfs != null)
                {
                    stTuition = matchedDfs.TotalAmount;
                }
            }

            decimal stTransport = 0m;
            if (studentTransportMap.TryGetValue(sIdStr, out decimal tAmt))
            {
                stTransport = tAmt;
            }
            else if (!string.IsNullOrEmpty(sAdmNo) && studentTransportMap.TryGetValue(sAdmNo, out decimal tAmt2))
            {
                stTransport = tAmt2;
            }

            decimal stHostel = 0m;
            if (studentHostelMap.TryGetValue(sIdStr, out decimal hAmt))
            {
                stHostel = hAmt;
            }
            else if (!string.IsNullOrEmpty(sAdmNo) && studentHostelMap.TryGetValue(sAdmNo, out decimal hAmt2))
            {
                stHostel = hAmt2;
            }

            decimal stUniform = uniformDistributions
                .Where(u => (u.StudentId.HasValue && u.StudentId.Value == s.StudentId) ||
                            (!string.IsNullOrEmpty(sAdmNo) && !string.IsNullOrEmpty(u.AdmissionNo) && u.AdmissionNo.Equals(sAdmNo, StringComparison.OrdinalIgnoreCase)))
                .Sum(u => u.TotalAmount);

            decimal stFines = validPayments
                .Where(p => p.StudentId == sIdStr || (!string.IsNullOrEmpty(sAdmNo) && p.StudentId == sAdmNo))
                .Sum(p => p.FineAmount);

            decimal stTotalAnnual = stTuition + stTransport + stHostel + stUniform + stFines;

            decimal stPaid = validPayments
                .Where(p => p.StudentId == sIdStr || (!string.IsNullOrEmpty(sAdmNo) && p.StudentId == sAdmNo))
                .Sum(p => p.Amount);

            decimal directUniformPaid = uniformDistributions
                .Where(u => u.PaymentStatus == "Paid" &&
                            ((u.StudentId.HasValue && u.StudentId.Value == s.StudentId) ||
                             (!string.IsNullOrEmpty(sAdmNo) && !string.IsNullOrEmpty(u.AdmissionNo) && u.AdmissionNo.Equals(sAdmNo, StringComparison.OrdinalIgnoreCase))))
                .Sum(u => u.TotalAmount);

            if (directUniformPaid > 0 && uniformCollectedFromPayments == 0m)
            {
                stPaid += directUniformPaid;
            }

            if (stTotalAnnual > 0m && stPaid > stTotalAnnual)
            {
                stPaid = stTotalAnnual;
            }

            var studentAssignment = validAssignments.FirstOrDefault(a => (a.StudentId != null && a.StudentId.Trim().ToLower() == sIdStr) || (!string.IsNullOrEmpty(sAdmNo) && a.StudentId != null && a.StudentId.Trim().ToLower() == sAdmNo.ToLower()) || (!string.IsNullOrEmpty(s.RollNumber) && a.StudentId != null && a.StudentId.Trim().ToLower() == s.RollNumber.ToLower()));
            var studentAdmApp = allActiveAdmissions.FirstOrDefault(a => 
                a.Id == s.StudentId ||
                (!string.IsNullOrEmpty(sAdmNo) && (a.AdmissionNo == sAdmNo || a.RegistrationNo == sAdmNo)));

            string rawPolicy = studentAssignment?.FeePolicy ?? "Full Annual Fee";
            string policyNorm = rawPolicy.Trim().ToLower();

            bool isAnnualPolicy = policyNorm.Contains("annual") || 
                                  policyNorm.Contains("full") || 
                                  policyNorm.Contains("one time") || 
                                  policyNorm.Contains("one-time") ||
                                  (!policyNorm.Contains("term") && !policyNorm.Contains("quarter") && !policyNorm.Contains("monthly") && !policyNorm.Contains("pro-rata"));

            decimal stPending = 0m;

            if (isAnnualPolicy)
            {
                // ANNUAL FEE POLICY:
                // Pending Amount = Total Annual Fee - Total Amount Paid
                // Display remaining unpaid annual fee as pending regardless of term due dates.
                stPending = Math.Max(0m, stTotalAnnual - stPaid);
            }
            else
            {
                // TERM-WISE FEE POLICY:
                // Calculate pending dues based on configured installment due dates.
                // Include ONLY installments whose due dates have arrived (Due Date <= Current Date).
                // Exclude future installments from pending dues.
                // Subtract payments already made against each installment.
                // Support partial payments and fully paid installments.
                int termCount = Math.Max(1, scheduleTerms.Count);
                decimal runningPaidForTerms = stPaid;
                decimal previousTermsSum = 0m;

                for (int tIdx = 0; tIdx < termCount; tIdx++)
                {
                    var termConfig = scheduleTerms[tIdx];
                    decimal share = termConfig.PercentageShare > 0 ? termConfig.PercentageShare : (100m / termCount);

                    decimal recurringTotal = stTuition + stTransport + stHostel;
                    decimal termAmount = (tIdx == termCount - 1)
                        ? Math.Max(0m, recurringTotal - previousTermsSum)
                        : Math.Round(recurringTotal * (share / 100m), 2);

                    if (tIdx == 0)
                    {
                        termAmount += (stUniform + stFines);
                    }
                    previousTermsSum += Math.Round(recurringTotal * (share / 100m), 2);

                    decimal paidForTerm = Math.Min(termAmount, runningPaidForTerms);
                    runningPaidForTerms -= paidForTerm;
                    decimal unpaidTerm = Math.Max(0m, termAmount - paidForTerm);

                    DateTime termDueDate;
                    bool parsedDate = DateTime.TryParse(termConfig.DueDate, out termDueDate);
                    bool isDueOrPast = parsedDate ? (termDueDate.Date <= effectiveToday) : (termConfig.Sequence == 1);

                    if (isDueOrPast)
                    {
                        stPending += unpaidTerm;
                    }
                }
            }

            totalPendingDues += stPending;
        }

        if (totalExpected > 0m && totalPendingDues > (totalExpected - totalCollected))
        {
            totalPendingDues = Math.Max(0m, totalExpected - totalCollected);
        }

        decimal totalOutstanding = totalPendingDues;
        decimal totalDiscounts = validPayments.Sum(p => p.DiscountAmount);

        // Dynamic Liquidity Accounts from database
        var accounts = await _context.FinancialAccounts.AsNoTracking()
            .Where(a => a.Status == "Active" || string.IsNullOrEmpty(a.Status))
            .ToListAsync();

        decimal cashBal = accounts.Count > 0
            ? accounts.Where(a => a.Type.Equals("Cash", StringComparison.OrdinalIgnoreCase) || a.Type.Contains("Petty", StringComparison.OrdinalIgnoreCase)).Sum(a => a.CurrentBalance)
            : validPayments.Where(p => p.PaymentMethod == "Cash").Sum(p => p.Amount);

        decimal bankBal = accounts.Count > 0
            ? accounts.Where(a => !a.Type.Equals("Cash", StringComparison.OrdinalIgnoreCase) && !a.Type.Contains("Petty", StringComparison.OrdinalIgnoreCase)).Sum(a => a.CurrentBalance)
            : validPayments.Where(p => p.PaymentMethod != "Cash").Sum(p => p.Amount);

        decimal scholarshipsUtilized = validPayments.Sum(p => p.DiscountAmount);
        decimal scholarshipsAllocated = await _context.StudentScholarships.AsNoTracking()
            .Where(s => s.Status == "Active" || string.IsNullOrEmpty(s.Status))
            .SumAsync(s => s.DiscountValue);
        if (scholarshipsAllocated == 0m) scholarshipsAllocated = scholarshipsUtilized;

        DateTime todayUtc = today;
        decimal todayCollection = validPayments
            .Where(p => p.PaymentDate.Date == todayUtc || p.PaymentDate.Date == todayIst || p.PaymentDate.AddHours(5.5).Date == todayIst)
            .Sum(p => p.Amount);

        DateTime monthStart = new DateTime(today.Year, today.Month, 1);
        decimal monthCollection = validPayments
            .Where(p => p.PaymentDate >= monthStart)
            .Sum(p => p.Amount);

        int studentsPaidCount = validPayments.Select(p => p.StudentId).Distinct().Count();
        double efficiency = totalExpected > 0 ? Math.Round((double)(totalCollected / totalExpected) * 100, 1) : (totalCollected > 0 ? 100.0 : 0.0);

        // 9. Class-wise Revenue Breakdown
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

        var admissionClassNames = allActiveAdmissions
            .Select(a => a.AppliedClass?.ClassName)
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Distinct()
            .ToList();

        var allClassNames = dbClassNames
            .Concat(studentClassNames)
            .Concat(admissionClassNames)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(c => GetClassOrder(c))
            .ThenBy(c => c)
            .ToList();


        var classWiseList = new List<ClassWiseCollectionShareDto>();

        foreach (var cName in allClassNames)
        {
            var matchingStudents = activeStudents
                .Where(st => MatchesClassName(GetStudentClassName(st), cName))
                .ToList();

            var stIds = matchingStudents.Select(s => s.StudentId.ToString()).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var admNos = matchingStudents.Where(s => s.AdmissionNumber != null).Select(s => s.AdmissionNumber!).ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var st in matchingStudents)
            {
                var matchedApps = allActiveAdmissions.Where(a => 
                    (st.AdmissionNumber != null && (a.AdmissionNo == st.AdmissionNumber || a.RegistrationNo == st.AdmissionNumber)) ||
                    a.Id == st.StudentId ||
                    (!string.IsNullOrEmpty(st.StudentName) && $"{a.FirstName} {a.LastName}".Trim().Equals(st.StudentName, StringComparison.OrdinalIgnoreCase)));
                foreach (var ma in matchedApps)
                {
                    stIds.Add(ma.Id.ToString());
                    if (!string.IsNullOrEmpty(ma.AdmissionNo)) admNos.Add(ma.AdmissionNo);
                    if (!string.IsNullOrEmpty(ma.RegistrationNo)) admNos.Add(ma.RegistrationNo);
                }
            }

            decimal classCollected = validPayments
                .Where(p => stIds.Contains(p.StudentId) || admNos.Contains(p.StudentId))
                .Sum(p => p.Amount);

            decimal classExpected = 0m;
            if (matchingStudents.Count > 0)
            {
                foreach (var st in matchingStudents)
                {
                    string stIdStr = st.StudentId.ToString();
                    string stAdmNo = st.AdmissionNumber ?? "";

                    decimal stTuition = 0m;
                    if (assignmentDict.TryGetValue(stIdStr, out decimal aAmt) || (!string.IsNullOrEmpty(stAdmNo) && assignmentDict.TryGetValue(stAdmNo, out aAmt)) || (!string.IsNullOrEmpty(st.RollNumber) && assignmentDict.TryGetValue(st.RollNumber, out aAmt)))
                    {
                        stTuition = aAmt;
                    }
                    else
                    {
                        var matchedDfs = dynamicStructures.FirstOrDefault(d => 
                            !string.IsNullOrEmpty(d.ClassName) && 
                            MatchesClassName(d.ClassName, cName));
                        if (matchedDfs != null)
                        {
                            stTuition = matchedDfs.TotalAmount;
                        }
                        else
                        {
                            stTuition = 0m;
                        }
                    }

                    decimal stTransport = 0m;
                    if (studentTransportMap.TryGetValue(stIdStr, out decimal tAmt))
                    {
                        stTransport = tAmt;
                    }
                    else if (!string.IsNullOrEmpty(stAdmNo) && studentTransportMap.TryGetValue(stAdmNo, out decimal tAmt2))
                    {
                        stTransport = tAmt2;
                    }

                    decimal stHostel = 0m;
                    if (studentHostelMap.TryGetValue(stIdStr, out decimal hAmt))
                    {
                        stHostel = hAmt;
                    }
                    else if (!string.IsNullOrEmpty(stAdmNo) && studentHostelMap.TryGetValue(stAdmNo, out decimal hAmt2))
                    {
                        stHostel = hAmt2;
                    }

                    classExpected += (stTuition + stTransport + stHostel);
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

            if (classExpected > 0m && classCollected > classExpected) classCollected = classExpected;

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

        // Calculate collected per Fee Head dynamically from validPayments and PaidItemsJson
        foreach (var p in validPayments)
        {
            bool hasItemBreakdown = false;
            if (!string.IsNullOrEmpty(p.PaidItemsJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(p.PaidItemsJson);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var elem in doc.RootElement.EnumerateArray())
                        {
                            decimal itemAmt = 0m;
                            if (elem.TryGetProperty("amount", out var amtProp) && amtProp.TryGetDecimal(out decimal aVal))
                                itemAmt = aVal;
                            else if (elem.TryGetProperty("Amount", out var amtProp2) && amtProp2.TryGetDecimal(out decimal aVal2))
                                itemAmt = aVal2;

                            string hName = "";
                            if (elem.TryGetProperty("feeHeadName", out var hnProp)) hName = hnProp.GetString() ?? "";
                            else if (elem.TryGetProperty("HeadName", out var hnProp2)) hName = hnProp2.GetString() ?? "";
                            else if (elem.TryGetProperty("headName", out var hnProp3)) hName = hnProp3.GetString() ?? "";

                            if (itemAmt > 0 && !string.IsNullOrWhiteSpace(hName))
                            {
                                hasItemBreakdown = true;
                                string normName = NormalizeCategoryName(hName, activeFeeHeadsList);
                                if (!catSummaryDict.ContainsKey(normName))
                                {
                                    catSummaryDict[normName] = (normName, 0m, 0m);
                                }
                                var cur = catSummaryDict[normName];
                                catSummaryDict[normName] = (cur.Name, cur.Expected, cur.Collected + itemAmt);
                            }
                        }
                    }
                }
                catch { hasItemBreakdown = false; }
            }

            if (!hasItemBreakdown)
            {
                string headName = !string.IsNullOrWhiteSpace(p.FeeHeadName) ? p.FeeHeadName : (!string.IsNullOrWhiteSpace(p.Remarks) ? p.Remarks : (tuitionExpected > 0 ? "Tuition Fee" : "General Fee"));
                string normName = NormalizeCategoryName(headName, activeFeeHeadsList);

                if (!catSummaryDict.ContainsKey(normName))
                {
                    catSummaryDict[normName] = (normName, 0m, 0m);
                }
                var cur = catSummaryDict[normName];
                catSummaryDict[normName] = (cur.Name, cur.Expected, cur.Collected + p.Amount);
            }
        }

        // Include active module categories if expected or collected > 0 (Deduplicating any existing aliases)
        if (hostelExpected > 0 || hostelCollected > 0)
        {
            string hKey = "Hostel Fee";
            var existingKey = catSummaryDict.Keys.FirstOrDefault(k =>
                k.Contains("hostel", StringComparison.OrdinalIgnoreCase) ||
                k.Contains("boarding", StringComparison.OrdinalIgnoreCase) ||
                k.Contains("mess", StringComparison.OrdinalIgnoreCase) ||
                k.Contains("block", StringComparison.OrdinalIgnoreCase));

            string targetKey = existingKey ?? hKey;
            if (!catSummaryDict.ContainsKey(targetKey))
            {
                catSummaryDict[targetKey] = (targetKey, hostelExpected, hostelCollected);
            }
            else
            {
                var cur = catSummaryDict[targetKey];
                catSummaryDict[targetKey] = (cur.Name, Math.Max(cur.Expected, hostelExpected), Math.Max(cur.Collected, hostelCollected));
            }
        }

        if (transportExpected > 0 || transportCollectedTotal > 0)
        {
            string tKey = "Transport Fee";
            var existingKey = catSummaryDict.Keys.FirstOrDefault(k =>
                k.Contains("transport", StringComparison.OrdinalIgnoreCase) ||
                k.Contains("conveyance", StringComparison.OrdinalIgnoreCase) ||
                k.Contains("bus", StringComparison.OrdinalIgnoreCase) ||
                k.Contains("route", StringComparison.OrdinalIgnoreCase));

            string targetKey = existingKey ?? tKey;
            if (!catSummaryDict.ContainsKey(targetKey))
            {
                catSummaryDict[targetKey] = (targetKey, transportExpected, transportCollectedTotal);
            }
            else
            {
                var cur = catSummaryDict[targetKey];
                catSummaryDict[targetKey] = (cur.Name, Math.Max(cur.Expected, transportExpected), Math.Max(cur.Collected, transportCollectedTotal));
            }
        }

        if (uniformExpected > 0 || uniformCollected > 0)
        {
            string uKey = "Uniform Fee";
            var existingKey = catSummaryDict.Keys.FirstOrDefault(k =>
                k.Contains("uniform", StringComparison.OrdinalIgnoreCase) ||
                k.Contains("merchandise", StringComparison.OrdinalIgnoreCase));

            string targetKey = existingKey ?? uKey;
            if (!catSummaryDict.ContainsKey(targetKey))
            {
                catSummaryDict[targetKey] = (targetKey, uniformExpected, uniformCollected);
            }
            else
            {
                var cur = catSummaryDict[targetKey];
                catSummaryDict[targetKey] = (cur.Name, Math.Max(cur.Expected, uniformExpected), Math.Max(cur.Collected, uniformCollected));
            }
        }

        if (finesExpected > 0 || finesCollected > 0)
        {
            string fKey = "Late Fines & Penalties";
            var existingKey = catSummaryDict.Keys.FirstOrDefault(k =>
                k.Contains("fine", StringComparison.OrdinalIgnoreCase) ||
                k.Contains("penalty", StringComparison.OrdinalIgnoreCase));

            string targetKey = existingKey ?? fKey;
            if (!catSummaryDict.ContainsKey(targetKey))
            {
                catSummaryDict[targetKey] = (targetKey, finesExpected, finesCollected);
            }
            else
            {
                var cur = catSummaryDict[targetKey];
                catSummaryDict[targetKey] = (cur.Name, Math.Max(cur.Expected, finesExpected), Math.Max(cur.Collected, finesCollected));
            }
        }

        var categoryBreakdown = new List<FeeCategoryCollectionSummaryDto>();
        var headWise = new List<FeeHeadCollectionShareDto>();
        string[] chartColors = new[] { "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f43f5e" };
        int colorIdx = 0;

        foreach (var entry in catSummaryDict.Values)
        {
            decimal exp = entry.Expected;
            decimal coll = entry.Collected;
            if (exp > 0m && coll > exp) coll = exp;

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
            TotalOutstandingDues = totalPendingDues,
            TotalPendingDues = totalPendingDues,
            TotalConcessionsGranted = totalDiscounts,
            CashBalance = cashBal,
            BankBalance = bankBal,
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
            ScholarshipsGranted = Math.Max(scholarshipsAllocated, scholarshipsUtilized),
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

    // =========================================================================
    // STUDENT CATEGORY TRANSITION & CREDIT ADJUSTMENT IMPLEMENTATION
    // =========================================================================

    public async Task<StudentCategoryTransitionResponseDto> TransitionStudentCategoryAsync(StudentCategoryTransitionRequestDto request)
    {
        if (request == null || request.StudentId <= 0)
        {
            return new StudentCategoryTransitionResponseDto
            {
                Success = false,
                Message = "Invalid student ID provided for transition."
            };
        }

        int canonicalStudentId = request.StudentId;
        var student = await _context.Students
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .Include(s => s.Branch)
            .Include(s => s.AcademicYear)
            .FirstOrDefaultAsync(s => s.StudentId == request.StudentId);

        AdmissionApplication? app = null;
        if (student != null && !string.IsNullOrEmpty(student.AdmissionNumber))
        {
            app = await _context.AdmissionApplications
                .FirstOrDefaultAsync(a => !a.IsDeleted && (a.AdmissionNo == student.AdmissionNumber || a.RegistrationNo == student.AdmissionNumber));
        }
        else
        {
            app = await _context.AdmissionApplications
                .FirstOrDefaultAsync(a => !a.IsDeleted && a.Id == request.StudentId);
            if (app != null && !string.IsNullOrEmpty(app.AdmissionNo))
            {
                student = await _context.Students
                    .Include(s => s.ClassGrade)
                    .Include(s => s.ClassSection)
                    .Include(s => s.Branch)
                    .Include(s => s.AcademicYear)
                    .FirstOrDefaultAsync(s => s.AdmissionNumber == app.AdmissionNo);
                if (student != null) canonicalStudentId = student.StudentId;
            }
        }

        if (student == null && app == null)
        {
            return new StudentCategoryTransitionResponseDto
            {
                Success = false,
                Message = $"Student record not found for ID {request.StudentId}."
            };
        }

        string admNo = student?.AdmissionNumber ?? app?.AdmissionNo ?? app?.RegistrationNo ?? request.AdmissionNo ?? $"STU-{canonicalStudentId}";
        string previousType = (app?.StudentType == "Residential" || (app == null && await _context.StudentBedAllocations.AnyAsync(b => (b.StudentId == canonicalStudentId || b.RegistrationNo == admNo) && b.Status == "Active")))
            ? "Residential" : "Non-Residential";

        DateTime transitionDate = request.EffectiveDate != default ? request.EffectiveDate : DateTime.UtcNow;
        DateTime transportEndDate = request.TransportEndDate ?? transitionDate;
        DateTime hostelJoiningDate = request.HostelJoiningDate ?? transitionDate;

        // Locate transport assignment
        var transportAssignment = await _context.StudentTransportAssignments
            .Include(t => t.Route)
            .Include(t => t.PickupPoint)
            .FirstOrDefaultAsync(t => (t.StudentId == canonicalStudentId || (!string.IsNullOrEmpty(admNo) && t.AdmissionNo == admNo)) && !t.IsDeleted && t.Status);

        if (transportAssignment == null)
        {
            transportAssignment = await _context.StudentTransportAssignments
                .Include(t => t.Route)
                .Include(t => t.PickupPoint)
                .OrderByDescending(t => t.EffectiveTo ?? t.EffectiveFrom)
                .FirstOrDefaultAsync(t => (t.StudentId == canonicalStudentId || (!string.IsNullOrEmpty(admNo) && t.AdmissionNo == admNo)) && !t.IsDeleted);
        }

        decimal finalizedTransportFee = 0m;
        string transportUsagePeriod = "None";
        decimal monthlyFare = 0m;

        if (transportAssignment != null || (app != null && app.TransportRequired == true))
        {
            var route = transportAssignment?.Route;
            if (route == null && app != null && !string.IsNullOrEmpty(app.BusRoute))
            {
                route = await _context.TransportRoutes.FirstOrDefaultAsync(r => r.RouteName == app.BusRoute || r.RouteId.ToString() == app.BusRoute);
            }

            var pickup = transportAssignment?.PickupPoint;
            if (pickup == null && app != null && !string.IsNullOrEmpty(app.PickupPoint))
            {
                pickup = await _context.PickupPoints.FirstOrDefaultAsync(p => p.PickupPointName == app.PickupPoint || p.PickupPointId.ToString() == app.PickupPoint);
            }

            decimal distance = pickup?.DistanceFromStart ?? (route?.DistanceKm ?? 0m);
            decimal minKm = route?.MinRangeKm ?? 5m;
            string trpType = transportAssignment?.TransportType ?? app?.TransportType ?? "AC";
            bool isAc = trpType.Contains("AC", StringComparison.OrdinalIgnoreCase) && !trpType.Contains("Non", StringComparison.OrdinalIgnoreCase);
            decimal baseFare = isAc ? (route?.AcBaseFare ?? 1200m) : (route?.NonAcBaseFare ?? 1000m);
            decimal ratePerKm = isAc ? (route?.AcRatePerKm ?? 150m) : (route?.NonAcRatePerKm ?? 100m);
            monthlyFare = baseFare + Math.Max(0m, distance - minKm) * ratePerKm;

            DateTime startDate = transportAssignment?.EffectiveFrom ?? app?.CreatedAt ?? DateTime.UtcNow.AddMonths(-3);
            if (transportEndDate < startDate) transportEndDate = startDate;

            int daysUsed = (int)(transportEndDate.Date - startDate.Date).TotalDays;
            int monthsUsed = Math.Max(1, (int)Math.Round((double)Math.Max(0, daysUsed) / 30.4375, MidpointRounding.AwayFromZero));
            if (monthsUsed > 12) monthsUsed = 12;

            finalizedTransportFee = Math.Round(monthlyFare * monthsUsed, 2);
            transportUsagePeriod = $"{startDate:yyyy-MM-dd} to {transportEndDate:yyyy-MM-dd} ({monthsUsed} month{(monthsUsed > 1 ? "s" : "")})";

            // Stop transport service
            if (transportAssignment != null)
            {
                transportAssignment.EffectiveTo = transportEndDate;
                transportAssignment.Status = false;
                transportAssignment.Remarks = $"Ceased on {transportEndDate:yyyy-MM-dd} due to transition to Residential. Finalized prorated fee: {finalizedTransportFee:C}";
            }
        }

        if (app != null)
        {
            app.TransportRequired = false;
            app.StudentType = request.NewStudentType;
        }

        // Calculate paid transport
        var allStudentPayments = await _context.FeePayments
            .Where(p => p.StudentId == canonicalStudentId.ToString() || (!string.IsNullOrEmpty(admNo) && p.StudentId == admNo))
            .Where(p => (p.Status == "Completed" || p.Status == "Paid" || string.IsNullOrEmpty(p.Status)) && p.Status != "Failed" && p.Status != "Cancelled")
            .ToListAsync();

        decimal transportPaid = 0m;
        foreach (var p in allStudentPayments)
        {
            if (!string.IsNullOrEmpty(p.PaidItemsJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(p.PaidItemsJson);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var elem in doc.RootElement.EnumerateArray())
                        {
                            string hn = "";
                            if (elem.TryGetProperty("headName", out var hnProp)) hn = hnProp.GetString() ?? "";
                            else if (elem.TryGetProperty("feeHeadName", out var hnProp2)) hn = hnProp2.GetString() ?? "";

                            decimal itmAmt = 0m;
                            if (elem.TryGetProperty("amount", out var aProp) && aProp.TryGetDecimal(out decimal av)) itmAmt = av;

                            if (hn.Contains("Transport", StringComparison.OrdinalIgnoreCase)) transportPaid += itmAmt;
                        }
                    }
                }
                catch { }
            }
            else if ((p.FeeHeadName != null && p.FeeHeadName.Contains("Transport", StringComparison.OrdinalIgnoreCase)) ||
                     (p.TermName != null && p.TermName.Contains("Transport", StringComparison.OrdinalIgnoreCase)))
            {
                transportPaid += p.Amount;
            }
        }

        decimal unusedTransportCredit = Math.Max(0m, transportPaid - finalizedTransportFee);
        decimal remainingTransportDue = Math.Max(0m, finalizedTransportFee - transportPaid);
        decimal creditAppliedToHostel = 0m;

        // Hostel Allocation & Security Deposit
        decimal hostelAccommodationFee = 0m;
        decimal securityDepositAmount = 0m;

        string cName = student?.ClassGrade?.ClassName ?? "";
        var allHostelConfigs = await _context.HostelFeeConfigs.AsNoTracking()
            .Where(h => h.Status == "Active" || string.IsNullOrEmpty(h.Status))
            .ToListAsync();

        var allDbClasses = await _context.Classes.AsNoTracking().Where(c => c.Status == "Active").OrderBy(c => c.DisplayOrder ?? c.ClassId).ToListAsync();
        var classOrderMap = BuildClassOrderMap(allDbClasses);

        HostelBlock? hostelBlock = null;
        RoomMaster? room = null;
        if (request.HostelId.HasValue && request.HostelId > 0)
        {
            hostelBlock = await _context.HostelBlocks.FirstOrDefaultAsync(h => h.HostelId == request.HostelId.Value);
        }
        if (request.RoomId.HasValue && request.RoomId > 0)
        {
            room = await _context.RoomMasters.Include(r => r.RoomType).FirstOrDefaultAsync(r => r.RoomId == request.RoomId.Value);
            if (hostelBlock == null && room != null)
            {
                hostelBlock = await _context.HostelBlocks.FirstOrDefaultAsync(h => h.HostelId == room.HostelId);
            }
        }

        string blockName = hostelBlock?.HostelName ?? app?.HostelBlock ?? "";
        string roomNo = room?.RoomNumber ?? app?.HostelRoom ?? "";

        var matchedCfg = allHostelConfigs.FirstOrDefault(c =>
            MatchesClassRange(cName, c, classOrderMap) &&
            (string.IsNullOrEmpty(blockName) || c.HostelName == "All" || c.HostelName.Equals(blockName, StringComparison.OrdinalIgnoreCase) || blockName.Contains(c.HostelName, StringComparison.OrdinalIgnoreCase)) &&
            (string.IsNullOrEmpty(roomNo) || c.RoomNo == "All Rooms" || c.RoomNo == "All" || CleanRoomNumber(c.RoomNo) == CleanRoomNumber(roomNo))
        ) ?? allHostelConfigs.FirstOrDefault(c => MatchesClassRange(cName, c, classOrderMap)) ?? allHostelConfigs.FirstOrDefault();

        if (matchedCfg != null)
        {
            int transportMonths = (transportAssignment != null || finalizedTransportFee > 0) 
                ? Math.Max(1, (int)Math.Ceiling(Math.Max(0, (transportEndDate.Date - (transportAssignment?.EffectiveFrom ?? DateTime.UtcNow.AddMonths(-3)).Date).TotalDays) / 30.4375)) 
                : 0;
            int hostelRemainingMonths = Math.Max(1, 12 - transportMonths);

            if (string.Equals(matchedCfg.FeePlan, "Monthly", StringComparison.OrdinalIgnoreCase))
            {
                hostelAccommodationFee = matchedCfg.HostelFee * hostelRemainingMonths;
            }
            else
            {
                hostelAccommodationFee = Math.Round((matchedCfg.HostelFee / 12m) * hostelRemainingMonths, 2);
            }

            securityDepositAmount = matchedCfg.SecurityDeposit;
        }

        // Allocate Bed if requested
        if (hostelBlock != null && room != null)
        {
            var existingAlloc = await _context.StudentBedAllocations
                .FirstOrDefaultAsync(b => (b.StudentId == canonicalStudentId || (!string.IsNullOrEmpty(admNo) && b.RegistrationNo == admNo)) && (b.Status == "Active" || b.Status == "Occupied"));

            string bedNo = !string.IsNullOrWhiteSpace(request.BedNumber) ? request.BedNumber : "Bed #1";

            if (existingAlloc != null)
            {
                existingAlloc.HostelId = hostelBlock.HostelId;
                existingAlloc.RoomId = room.RoomId;
                existingAlloc.BedNumber = bedNo;
                existingAlloc.JoiningDate = hostelJoiningDate;
                existingAlloc.Status = "Active";
            }
            else
            {
                var newAlloc = new StudentBedAllocation
                {
                    StudentId = canonicalStudentId,
                    RegistrationNo = admNo,
                    StudentName = student?.StudentName ?? (app != null ? $"{app.FirstName} {app.LastName}".Trim() : $"Student #{canonicalStudentId}"),
                    HostelId = hostelBlock.HostelId,
                    RoomId = room.RoomId,
                    BedNumber = bedNo,
                    JoiningDate = hostelJoiningDate,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };
                _context.StudentBedAllocations.Add(newAlloc);
            }

            if (app != null)
            {
                app.HostelBlock = hostelBlock.HostelName;
                app.HostelRoom = room.RoomNumber;
                app.AllocatedBedId = bedNo;
                app.SecurityDepositAmount = securityDepositAmount;
            }
        }

        // Apply Transport Credit to Hostel if requested
        if (request.ApplyTransportCreditToHostel && unusedTransportCredit > 0)
        {
            creditAppliedToHostel = unusedTransportCredit;

            var ledgerEntry = new LedgerEntry
            {
                TransactionDate = DateTime.UtcNow,
                TransactionType = "Credit Transfer",
                Category = "Transfer",
                ReferenceNo = $"ADJ-TRP-HST-{canonicalStudentId}-{DateTime.UtcNow.Ticks % 100000}",
                StudentId = canonicalStudentId,
                AdmissionNo = admNo,
                Debit = unusedTransportCredit,
                Credit = unusedTransportCredit,
                Particulars = $"Transfer of unused transport fee credit ({unusedTransportCredit:C}) to Hostel account upon transition to Residential on {transitionDate:yyyy-MM-dd}",
                AcademicYearId = student?.AcademicYearId ?? 1,
                BranchId = student?.BranchId ?? 1
            };
            _context.LedgerEntries.Add(ledgerEntry);

            var adjPayment = new FeePayment
            {
                ReceiptNo = $"CR-TRP-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
                StudentId = canonicalStudentId.ToString(),
                Amount = unusedTransportCredit,
                DiscountAmount = 0m,
                FineAmount = 0m,
                PaymentDate = DateTime.UtcNow,
                PaymentMethod = "Credit Adjustment",
                Status = "Completed",
                TermName = "Hostel Accommodation",
                FeeHeadName = "Hostel Accommodation",
                Remarks = $"Unused transport fee credit applied ({unusedTransportCredit:C}) to Hostel Accommodation fee upon category change",
                PaidItemsJson = JsonSerializer.Serialize(new[]
                {
                    new { headName = "Hostel Accommodation", feeHeadName = "Hostel Accommodation", amount = unusedTransportCredit }
                })
            };
            _context.FeePayments.Add(adjPayment);
        }

        await _context.SaveChangesAsync();

        var updatedProfile = await GetStudentFeeProfileAsync(canonicalStudentId, student?.AcademicYear?.AcademicYearName);

        return new StudentCategoryTransitionResponseDto
        {
            Success = true,
            Message = $"Student successfully transitioned to {request.NewStudentType}. Transport stopped on {transportEndDate:yyyy-MM-dd}. Hostel allocated effective {hostelJoiningDate:yyyy-MM-dd}.",
            PreviousStudentType = previousType,
            NewStudentType = request.NewStudentType,
            TransportUsagePeriod = transportUsagePeriod,
            FinalizedTransportFee = finalizedTransportFee,
            TransportPaid = transportPaid,
            UnusedTransportCredit = unusedTransportCredit,
            CreditAppliedToHostel = creditAppliedToHostel,
            RemainingTransportDue = remainingTransportDue,
            HostelAccommodationFee = hostelAccommodationFee,
            SecurityDepositAmount = securityDepositAmount,
            NetOutstandingBalance = updatedProfile?.TotalOutstandingBalance ?? 0m,
            UpdatedProfile = updatedProfile
        };
    }

    public async Task<bool> ApplyTransportCreditAsync(ApplyTransportCreditRequestDto request)
    {
        if (request == null || request.StudentId <= 0 || request.Amount <= 0) return false;

        int canonicalStudentId = request.StudentId;
        var student = await _context.Students
            .Include(s => s.AcademicYear)
            .Include(s => s.Branch)
            .FirstOrDefaultAsync(s => s.StudentId == request.StudentId);
        string admNo = student?.AdmissionNumber ?? request.AdmissionNo ?? $"STU-{canonicalStudentId}";

        var profile = await GetStudentFeeProfileAsync(canonicalStudentId, student?.AcademicYear?.AcademicYearName);
        if (profile == null) return false;

        decimal availableCredit = profile.TransportCreditAmount;
        if (availableCredit < request.Amount)
        {
            throw new InvalidOperationException($"Requested credit application ({request.Amount:C}) exceeds available transport credit ({availableCredit:C}).");
        }

        string targetHead = !string.IsNullOrWhiteSpace(request.TargetFeeHead) ? request.TargetFeeHead : "Hostel Accommodation";

        var ledger = new LedgerEntry
        {
            TransactionDate = DateTime.UtcNow,
            TransactionType = "Credit Transfer",
            Category = "Transfer",
            ReferenceNo = $"ADJ-CR-{canonicalStudentId}-{DateTime.UtcNow.Ticks % 100000}",
            StudentId = canonicalStudentId,
            AdmissionNo = admNo,
            Debit = request.Amount,
            Credit = request.Amount,
            Particulars = $"Transport credit reallocated to {targetHead}. Reason: {request.Reason ?? "Manual reallocation"}. Authorized by: {request.AuthorizedBy ?? "Admin"}",
            AcademicYearId = student?.AcademicYearId ?? 1,
            BranchId = student?.BranchId ?? 1
        };
        _context.LedgerEntries.Add(ledger);

        var payment = new FeePayment
        {
            ReceiptNo = $"CR-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            StudentId = canonicalStudentId.ToString(),
            Amount = request.Amount,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Credit Adjustment",
            Status = "Completed",
            TermName = targetHead,
            FeeHeadName = targetHead,
            Remarks = $"Credit adjustment transferred from Transport to {targetHead}. {request.Reason ?? ""}",
            PaidItemsJson = JsonSerializer.Serialize(new[]
            {
                new { headName = targetHead, feeHeadName = targetHead, amount = request.Amount }
            })
        };
        _context.FeePayments.Add(payment);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ProcessDepositRefundAsync(ProcessDepositRefundRequestDto request)
    {
        if (request == null || request.StudentId <= 0 || request.RefundAmount <= 0) return false;

        int canonicalStudentId = request.StudentId;
        var student = await _context.Students
            .Include(s => s.AcademicYear)
            .Include(s => s.Branch)
            .FirstOrDefaultAsync(s => s.StudentId == request.StudentId);
        string admNo = student?.AdmissionNumber ?? request.AdmissionNo ?? $"STU-{canonicalStudentId}";

        decimal netRefund = Math.Max(0m, request.RefundAmount - request.DeductionAmount);

        var ledger = new LedgerEntry
        {
            TransactionDate = DateTime.UtcNow,
            TransactionType = "Refund",
            Category = "Expense",
            ReferenceNo = $"REF-HST-DEP-{canonicalStudentId}-{DateTime.UtcNow.Ticks % 100000}",
            StudentId = canonicalStudentId,
            AdmissionNo = admNo,
            Debit = netRefund,
            Credit = 0m,
            Particulars = $"Refund of Hostel Security Deposit (Gross: {request.RefundAmount:C}, Deductions: {request.DeductionAmount:C} for {request.DeductionReason ?? "None"}). Authorized by: {request.AuthorizedBy ?? "Admin"}",
            AcademicYearId = student?.AcademicYearId ?? 1,
            BranchId = student?.BranchId ?? 1
        };
        _context.LedgerEntries.Add(ledger);

        var payment = new FeePayment
        {
            ReceiptNo = $"REF-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            StudentId = canonicalStudentId.ToString(),
            Amount = -netRefund,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = request.PaymentMode ?? "Bank Transfer",
            Status = "Refunded",
            TermName = "Hostel Security Deposit",
            FeeHeadName = "Hostel Security Deposit",
            Remarks = $"Refund of Security Deposit. Deductions: {request.DeductionAmount:C}. Remarks: {request.Remarks ?? ""}",
            PaidItemsJson = JsonSerializer.Serialize(new[]
            {
                new { headName = "Hostel Security Deposit", feeHeadName = "Hostel Security Deposit", amount = -netRefund }
            })
        };
        _context.FeePayments.Add(payment);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<StudentFeeProfileResponseDto?> RecalculateStudentFeeProfileAsync(string studentId, string? academicYear)
    {
        return await GetStudentFeeProfileAsync(studentId, academicYear);
    }

    public async Task<StudentFeeProfileResponseDto?> RecalculateStudentFeeProfileAsync(int studentId, string? academicYear)
    {
        return await GetStudentFeeProfileAsync(studentId, academicYear);
    }
}
