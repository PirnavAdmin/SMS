namespace SMS.Api.Repositories.Implementations.FinanceManagement;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class FinanceMasterRepository : IFinanceMasterRepository
{
    private readonly AppDbContext _context;

    // Thread-safe in-memory stores for extended financial operational items
    private static readonly ConcurrentDictionary<int, FinanceTransactionDto> _manualTransactions = new();
    private static readonly List<FinancialAccountDto> _accounts = new();
    private static readonly List<FinancialCategoryDto> _categories = new();
    private static readonly List<FinancialBudgetDto> _budgets = new();
    private static readonly ConcurrentDictionary<int, FeeRefundRequestDto> _refunds = new();
    private static FeeScheduleConfigDto _feeSchedule = new();
    private static FinanceSettingsDto _financeSettings = new();
    private static readonly ConcurrentDictionary<int, ScholarshipMasterDto> _scholarships = new();
    private static readonly ConcurrentDictionary<int, StudentScholarshipAwardDto> _studentScholarships = new();
    private static readonly ConcurrentDictionary<int, DiscountRuleDto> _discounts = new();
    private static readonly ConcurrentDictionary<int, StudentDiscountDto> _studentDiscounts = new();
    private static readonly ConcurrentDictionary<int, FineRuleDto> _fineRules = new();
    private static readonly ConcurrentDictionary<int, FinanceHostelConfigDto> _hostelFeeConfigs = new();
    private static readonly ConcurrentDictionary<int, FinanceUniformConfigDto> _uniformFeeConfigs = new();

    public FinanceMasterRepository(AppDbContext context)
    {
        _context = context;
    }

    // =========================================================================
    // 1. GENERAL LEDGER & TRANSACTIONS
    // =========================================================================

    public async Task<List<FinanceTransactionDto>> GetTransactionsAsync(
        string? search, string? type, string? module, string? category, string? paymentMode, string? status, int page, int pageSize)
    {
        var result = new List<FinanceTransactionDto>();

        // 1. Convert live FeePayments to Income transactions
        var payments = await _context.FeePayments.AsNoTracking().ToListAsync();
        var students = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .ToListAsync();

        foreach (var p in payments)
        {
            var st = students.FirstOrDefault(s => s.StudentId.ToString() == p.StudentId || s.AdmissionNumber == p.StudentId);
            string stName = st?.StudentName ?? $"Student #{p.StudentId}";
            string cName = st?.ClassGrade?.ClassName ?? "Class 10";

            result.Add(new FinanceTransactionDto
            {
                Id = p.Id,
                TransactionId = !string.IsNullOrEmpty(p.ReceiptNo) ? p.ReceiptNo : $"TXN-FEE-{p.Id:D4}",
                Type = "Income",
                SourceModule = "Fees",
                Category = "Tuition & Academic Fees",
                Description = $"Fee Collection — {stName} ({cName})",
                Amount = p.Amount,
                PaymentMode = p.PaymentMethod ?? "Cash",
                Account = (p.PaymentMethod == "Cash") ? "School Petty Cash" : "Main Operating Account",
                TransactionDate = p.PaymentDate,
                Status = p.Status == "Cancelled" ? "Cancelled" : "Completed",
                ReferenceNumber = p.TransactionId ?? "",
                CreatedBy = "Accounts Counter",
                Branch = "Main Campus",
                AcademicYear = "2026-2027"
            });
        }

        // 2. Add in-memory manual transactions
        result.AddRange(_manualTransactions.Values);

        // Filters
        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            result = result.Where(t => t.Type.Equals(type, StringComparison.OrdinalIgnoreCase)).ToList();

        if (!string.IsNullOrWhiteSpace(module) && !module.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            result = result.Where(t => t.SourceModule.Equals(module, StringComparison.OrdinalIgnoreCase)).ToList();

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            result = result.Where(t => t.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();

        if (!string.IsNullOrWhiteSpace(paymentMode) && !paymentMode.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            result = result.Where(t => t.PaymentMode.Equals(paymentMode, StringComparison.OrdinalIgnoreCase)).ToList();

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            result = result.Where(t => t.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            result = result.Where(t =>
                t.TransactionId.ToLower().Contains(s) ||
                t.Description.ToLower().Contains(s) ||
                t.Category.ToLower().Contains(s) ||
                t.ReferenceNumber.ToLower().Contains(s)).ToList();
        }

        int safePage = page <= 0 ? 1 : page;
        int safePageSize = pageSize <= 0 ? 50 : pageSize;

        return result
            .OrderByDescending(t => t.TransactionDate)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToList();
    }

    public async Task<FinanceTransactionSummaryDto> GetTransactionSummaryAsync()
    {
        var allTxns = await GetTransactionsAsync(null, null, null, null, null, null, 1, 1000);
        decimal inflow = allTxns.Where(t => t.Type == "Income" && t.Status != "Cancelled" && t.Status != "Reversed").Sum(t => t.Amount);
        decimal outflow = allTxns.Where(t => t.Type == "Expense" && t.Status != "Cancelled" && t.Status != "Reversed").Sum(t => t.Amount);
        decimal net = inflow - outflow;

        DateTime today = DateTime.UtcNow.Date;
        decimal todayInflow = allTxns
            .Where(t => t.Type == "Income" && t.TransactionDate.Date == today && t.Status == "Completed")
            .Sum(t => t.Amount);

        return new FinanceTransactionSummaryDto
        {
            TotalInflow = inflow,
            TotalOutflow = outflow,
            NetBalance = net,
            TodayInflow = todayInflow,
            PendingClearances = 0m
        };
    }

    public Task<FinanceTransactionDto> CreateTransactionAsync(CreateTransactionRequestDto request)
    {
        int newId = 1000 + _manualTransactions.Count + 1;
        var txn = new FinanceTransactionDto
        {
            Id = newId,
            TransactionId = $"TXN-MAN-{newId}",
            Type = request.Type ?? "Income",
            SourceModule = request.SourceModule ?? "Manual",
            Category = request.Category ?? "General",
            Description = request.Description,
            Amount = request.Amount,
            PaymentMode = request.PaymentMode ?? "Bank Transfer",
            Account = request.Account ?? "Main Bank Account",
            TransactionDate = DateTime.TryParse(request.TransactionDate, out var dt) ? dt : DateTime.UtcNow,
            Status = "Completed",
            ReferenceNumber = $"REF-{Random.Shared.Next(10000, 99999)}",
            CreatedBy = "Admin",
            Branch = request.Branch ?? "Main Campus",
            AcademicYear = request.AcademicYear ?? "2026-2027",
            Notes = request.Notes ?? "",
            AttachmentName = request.AttachmentName ?? ""
        };

        _manualTransactions[newId] = txn;
        return Task.FromResult(txn);
    }

    public Task<bool> ReverseTransactionAsync(int id, ReverseTransactionRequestDto request)
    {
        if (_manualTransactions.TryGetValue(id, out var txn))
        {
            txn.Status = "Reversed";
            txn.Notes = $"{txn.Notes} [Reversed: {request.ReversalReason} by {request.AuthorizedBy}]".Trim();
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    // =========================================================================
    // 2. BANK ACCOUNTS & CATEGORIES
    // =========================================================================

    public Task<List<FinancialAccountDto>> GetAccountsAsync()
    {
        return Task.FromResult(_accounts.ToList());
    }

    public Task<FinancialAccountDto> CreateAccountAsync(FinancialAccountDto account)
    {
        account.Id = _accounts.Count + 1;
        _accounts.Add(account);
        return Task.FromResult(account);
    }

    public Task<bool> UpdateAccountAsync(int id, FinancialAccountDto account)
    {
        var existing = _accounts.FirstOrDefault(a => a.Id == id);
        if (existing == null) return Task.FromResult(false);

        existing.AccountName = account.AccountName;
        existing.AccountType = account.AccountType;
        existing.AccountNumber = account.AccountNumber;
        existing.BankName = account.BankName;
        existing.BranchName = account.BranchName;
        existing.CurrentBalance = account.CurrentBalance;
        existing.Status = account.Status;
        return Task.FromResult(true);
    }

    public Task<bool> DeleteAccountAsync(int id)
    {
        var existing = _accounts.FirstOrDefault(a => a.Id == id);
        if (existing == null) return Task.FromResult(false);
        _accounts.Remove(existing);
        return Task.FromResult(true);
    }

    public Task<List<FinancialCategoryDto>> GetCategoriesAsync(string? type)
    {
        var list = _categories.AsQueryable();
        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            list = list.Where(c => c.Type.Equals(type, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(list.ToList());
    }

    public Task<FinancialCategoryDto> CreateCategoryAsync(FinancialCategoryDto category)
    {
        category.Id = _categories.Count > 0 ? _categories.Max(c => c.Id) + 1 : 1;
        _categories.Add(category);
        return Task.FromResult(category);
    }

    public Task<bool> UpdateCategoryAsync(int id, FinancialCategoryDto category)
    {
        var existing = _categories.FirstOrDefault(c => c.Id == id);
        if (existing == null) return Task.FromResult(false);

        existing.Name = category.Name;
        existing.Type = category.Type;
        existing.SourceModule = category.SourceModule;
        existing.Status = category.Status;
        return Task.FromResult(true);
    }

    public Task<bool> DeleteCategoryAsync(int id)
    {
        var existing = _categories.FirstOrDefault(c => c.Id == id);
        if (existing == null) return Task.FromResult(false);
        _categories.Remove(existing);
        return Task.FromResult(true);
    }

    // =========================================================================
    // 3. BUDGETS
    // =========================================================================

    public Task<List<FinancialBudgetDto>> GetBudgetsAsync(string? academicYear)
    {
        return Task.FromResult(_budgets.ToList());
    }

    public Task<FinancialBudgetDto> SaveBudgetAsync(FinancialBudgetDto budget)
    {
        var existing = _budgets.FirstOrDefault(b => b.Id == budget.Id || 
            (!string.IsNullOrEmpty(budget.CategoryName) && b.CategoryName.Equals(budget.CategoryName, StringComparison.OrdinalIgnoreCase)) ||
            (!string.IsNullOrEmpty(budget.Department) && b.Department.Equals(budget.Department, StringComparison.OrdinalIgnoreCase)));
        if (existing != null)
        {
            existing.AllocatedAmount = budget.AllocatedAmount;
            existing.ConsumedAmount = budget.ConsumedAmount;
            existing.Status = budget.Status;
            return Task.FromResult(existing);
        }

        budget.Id = _budgets.Count > 0 ? _budgets.Max(b => b.Id) + 1 : 1;
        _budgets.Add(budget);
        return Task.FromResult(budget);
    }

    public Task<bool> UpdateBudgetAsync(int id, FinancialBudgetDto budget)
    {
        var existing = _budgets.FirstOrDefault(b => b.Id == id);
        if (existing == null) return Task.FromResult(false);

        existing.AllocatedAmount = budget.AllocatedAmount;
        existing.ConsumedAmount = budget.ConsumedAmount;
        existing.Status = budget.Status;
        return Task.FromResult(true);
    }

    // =========================================================================
    // 4. REFUND MANAGEMENT
    // =========================================================================

    public Task<List<FeeRefundRequestDto>> GetRefundRequestsAsync(string? status)
    {
        var list = _refunds.Values.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            list = list.Where(r => r.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(list.OrderByDescending(r => r.RequestedDate).ToList());
    }

    public async Task<FeeRefundRequestDto> CreateRefundRequestAsync(CreateRefundRequestDto request)
    {
        var st = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .FirstOrDefaultAsync(s => s.StudentId == request.StudentId || (s.AdmissionNumber != null && s.AdmissionNumber == request.AdmissionNo));

        int newId = _refunds.Count > 0 ? _refunds.Keys.Max() + 1 : 1;
        var refund = new FeeRefundRequestDto
        {
            Id = newId,
            RefundRequestId = $"RF-2026-{newId:D3}",
            RefundNo = $"RF-2026-{newId:D3}",
            ReceiptNo = !string.IsNullOrWhiteSpace(request.ReceiptNo) ? request.ReceiptNo : $"REC-2026-{newId:D4}",
            StudentId = request.StudentId,
            AdmissionNo = !string.IsNullOrWhiteSpace(request.AdmissionNo) ? request.AdmissionNo : st?.AdmissionNumber ?? "",
            StudentName = !string.IsNullOrWhiteSpace(request.StudentName) ? request.StudentName : (st?.StudentName ?? $"Student #{request.StudentId}"),
            ClassName = !string.IsNullOrWhiteSpace(request.ClassName) ? request.ClassName : (st?.ClassGrade?.ClassName ?? "Class 10"),
            Section = !string.IsNullOrWhiteSpace(request.Section) ? request.Section : "A",
            RefundAmount = request.RefundAmount,
            Reason = request.Reason,
            Status = "Pending",
            RequestedBy = "Admin",
            RequestedDate = DateTime.UtcNow,
            PaymentMode = request.PaymentMode ?? "Bank Transfer",
            Remarks = request.Remarks ?? ""
        };

        _refunds[newId] = refund;
        return refund;
    }

    public Task<bool> ProcessRefundRequestAsync(int id, ProcessRefundRequestDto request)
    {
        if (_refunds.TryGetValue(id, out var refund))
        {
            refund.Status = request.Status;
            refund.ApprovedBy = request.ProcessedBy;
            refund.ProcessedDate = DateTime.UtcNow;
            refund.Remarks = request.Remarks;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    // =========================================================================
    // 5. FINANCE SETUP & SETTINGS
    // =========================================================================

    public Task<FeeScheduleConfigDto> GetFeeScheduleAsync(string? academicYear)
    {
        return Task.FromResult(_feeSchedule);
    }

    public Task<bool> SaveFeeScheduleAsync(FeeScheduleConfigDto schedule)
    {
        if (schedule != null && schedule.Terms != null)
        {
            _feeSchedule = schedule;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public Task<FinanceSettingsDto> GetFinanceSettingsAsync()
    {
        return Task.FromResult(_financeSettings);
    }

    public Task<bool> UpdateFinanceSettingsAsync(FinanceSettingsDto settings)
    {
        if (settings != null)
        {
            _financeSettings = settings;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    // =========================================================================
    // 6. REPORTS HUB
    // =========================================================================

    public async Task<FinanceReportsSummaryDto> GetReportsSummaryAsync(string? academicYear)
    {
        var validPayments = await _context.FeePayments.AsNoTracking().Where(p => p.Status != "Cancelled").ToListAsync();
        DateTime today = DateTime.UtcNow.Date;
        decimal todayCollection = validPayments.Where(p => p.PaymentDate.Date == today).Sum(p => p.Amount);
        DateTime monthStart = new DateTime(today.Year, today.Month, 1);
        decimal monthlyCollection = validPayments.Where(p => p.PaymentDate >= monthStart).Sum(p => p.Amount);

        var assignments = await _context.StudentFeeAssignments.AsNoTracking().ToListAsync();
        decimal totalExpected = assignments.Count > 0 ? assignments.Sum(a => a.TotalAmount) : 0m;
        decimal totalCollected = validPayments.Sum(p => p.Amount);
        decimal pendingDues = Math.Max(0m, totalExpected - totalCollected);

        int studentsPaidCount = validPayments.Select(p => p.StudentId).Distinct().Count();

        decimal concessions = validPayments.Sum(p => p.DiscountAmount);
        decimal services = validPayments.Sum(p => p.TransportFee);

        return new FinanceReportsSummaryDto
        {
            TodayCollection = todayCollection,
            MonthlyCollection = monthlyCollection,
            PendingDues = pendingDues,
            StudentsPaidCount = studentsPaidCount,
            ScholarshipsAndDiscounts = concessions,
            TransportAndHostel = services
        };
    }

    public async Task<DailyCollectionReportResponseDto> GetDailyCollectionReportAsync(string? date)
    {
        DateTime targetDate = DateTime.TryParse(date, out var dt) ? dt.Date : DateTime.UtcNow.Date;

        var payments = await _context.FeePayments.AsNoTracking().ToListAsync();
        var students = await _context.Students.AsNoTracking().Include(s => s.ClassGrade).ToListAsync();

        var rows = new List<DailyCollectionReportRowDto>();
        foreach (var p in payments)
        {
            var st = students.FirstOrDefault(s => s.StudentId.ToString() == p.StudentId || s.AdmissionNumber == p.StudentId);
            rows.Add(new DailyCollectionReportRowDto
            {
                ReceiptNo = !string.IsNullOrEmpty(p.ReceiptNo) ? p.ReceiptNo : $"REC-2026-{p.Id:D4}",
                StudentName = st?.StudentName ?? $"Student #{p.StudentId}",
                AdmissionNo = st?.AdmissionNumber ?? p.StudentId,
                ClassName = st?.ClassGrade?.ClassName ?? "Class 10",
                PaymentMode = p.PaymentMethod ?? "Cash",
                Amount = p.Amount,
                CollectedBy = "Accounts Counter 1",
                PaymentTime = p.PaymentDate
            });
        }

        decimal cash = rows.Where(r => r.PaymentMode == "Cash").Sum(r => r.Amount);
        decimal online = rows.Where(r => r.PaymentMode != "Cash" && r.PaymentMode != "Cheque").Sum(r => r.Amount);
        decimal cheque = rows.Where(r => r.PaymentMode == "Cheque").Sum(r => r.Amount);

        return new DailyCollectionReportResponseDto
        {
            ReportDate = targetDate.ToString("yyyy-MM-dd"),
            TotalCash = cash,
            TotalOnline = online,
            TotalCheque = cheque,
            GrandTotal = cash + online + cheque,
            Transactions = rows
        };
    }

    public async Task<List<ClassWiseCollectionReportRowDto>> GetClassWiseCollectionReportAsync(string? academicYear)
    {
        var classes = await _context.Classes.AsNoTracking().ToListAsync();
        var students = await _context.Students.AsNoTracking().Where(s => !s.IsDeleted && s.Status == "Active").ToListAsync();
        var payments = await _context.FeePayments.AsNoTracking().ToListAsync();

        var result = new List<ClassWiseCollectionReportRowDto>();
        foreach (var cls in classes)
        {
            var classStudents = students.Where(s => s.ClassId == cls.ClassId).ToList();
            var studentIds = classStudents.Select(s => s.StudentId.ToString()).ToList();
            var admNos = classStudents.Where(s => !string.IsNullOrEmpty(s.AdmissionNumber)).Select(s => s.AdmissionNumber!).ToList();

            var classPayments = payments.Where(p => studentIds.Contains(p.StudentId) || admNos.Contains(p.StudentId)).ToList();
            decimal collected = classPayments.Sum(p => p.Amount);
            decimal expected = classStudents.Count * 45000m;
            decimal dues = Math.Max(0m, expected - collected);

            result.Add(new ClassWiseCollectionReportRowDto
            {
                ClassName = cls.ClassName ?? $"Class {cls.ClassId}",
                TotalStudents = classStudents.Count,
                ExpectedRevenue = expected,
                CollectedRevenue = collected,
                OutstandingDues = dues
            });
        }

        return result;
    }

    // =========================================================================
    // 6. SCHOLARSHIP MASTER & STUDENT SCHOLARSHIPS
    // =========================================================================

    public async Task<List<ScholarshipMasterDto>> GetScholarshipsAsync(string? search, string? type, string? status)
    {
        var list = _scholarships.Values.ToList();
        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            list = list.Where(x => x.Name.ToLower().Contains(s) || x.Code.ToLower().Contains(s)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.Type.Equals(type, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.Status.Equals(status, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }
        return await Task.FromResult(list.OrderBy(x => x.Id).ToList());
    }

    public async Task<ScholarshipMasterDto?> GetScholarshipByIdAsync(int id)
    {
        _scholarships.TryGetValue(id, out var item);
        return await Task.FromResult(item);
    }

    public async Task<ScholarshipMasterDto> CreateScholarshipAsync(ScholarshipMasterDto scholarship)
    {
        int newId = _scholarships.Count > 0 ? _scholarships.Keys.Max() + 1 : 1;
        scholarship.Id = newId;
        if (string.IsNullOrEmpty(scholarship.Code))
            scholarship.Code = $"SCH-{newId:D3}";
        _scholarships[newId] = scholarship;
        return await Task.FromResult(scholarship);
    }

    public async Task<ScholarshipMasterDto?> UpdateScholarshipAsync(int id, ScholarshipMasterDto scholarship)
    {
        if (!_scholarships.ContainsKey(id)) return null;
        scholarship.Id = id;
        _scholarships[id] = scholarship;
        return await Task.FromResult(scholarship);
    }

    public async Task<bool> DeleteScholarshipAsync(int id)
    {
        return await Task.FromResult(_scholarships.TryRemove(id, out _));
    }

    public async Task<List<StudentScholarshipAwardDto>> GetStudentScholarshipsAsync(string? search, string? className, int? scholarshipId)
    {
        var list = _studentScholarships.Values.ToList();
        if (scholarshipId.HasValue && scholarshipId.Value > 0)
        {
            list = list.Where(x => x.ScholarshipId == scholarshipId.Value).ToList();
        }
        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.ClassName.Equals(className, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            list = list.Where(x => x.StudentName.ToLower().Contains(s) || x.AdmissionNo.ToLower().Contains(s)).ToList();
        }
        return await Task.FromResult(list.OrderByDescending(x => x.Id).ToList());
    }

    public async Task<StudentScholarshipAwardDto> AwardScholarshipToStudentAsync(AwardScholarshipRequestDto request)
    {
        int studentIdNum = int.TryParse(request.StudentId, out int sId) ? sId : 0;
        var student = await _context.Students
            .FirstOrDefaultAsync(s => s.StudentId == studentIdNum || s.AdmissionNumber == request.StudentId);

        string clsName = "Class 1";
        if (student != null)
        {
            var cls = await _context.Classes.FirstOrDefaultAsync(c => c.ClassId == student.ClassId);
            if (cls != null && !string.IsNullOrEmpty(cls.ClassName))
                clsName = cls.ClassName;
        }

        _scholarships.TryGetValue(request.ScholarshipId, out var sch);

        int newId = _studentScholarships.Count > 0 ? _studentScholarships.Keys.Max() + 1 : 1;
        var award = new StudentScholarshipAwardDto
        {
            Id = newId,
            StudentId = student != null ? student.StudentId.ToString() : request.StudentId,
            StudentName = student != null && !string.IsNullOrWhiteSpace(student.StudentName) ? student.StudentName : "Student",
            AdmissionNo = student?.AdmissionNumber ?? $"ADM-{request.StudentId}",
            ClassName = clsName,
            Section = "A",
            ScholarshipId = request.ScholarshipId,
            ScholarshipName = sch?.Name ?? "Scholarship Grant",
            ScholarshipCode = sch?.Code ?? "SCH-000",
            DiscountType = sch?.DiscountType ?? "Percentage",
            DiscountValue = sch != null ? (sch.DiscountType == "Percentage" ? sch.Percentage : sch.FixedAmount) : 15m,
            AppliedDate = DateTime.Now.ToString("yyyy-MM-dd"),
            Status = "Active"
        };

        _studentScholarships[newId] = award;
        return award;
    }

    public async Task<bool> RevokeStudentScholarshipAsync(int id)
    {
        return await Task.FromResult(_studentScholarships.TryRemove(id, out _));
    }

    // =========================================================================
    // 7. DISCOUNTS & STUDENT CONCESSIONS
    // =========================================================================

    public async Task<List<DiscountRuleDto>> GetDiscountsAsync(string? search, string? type, string? mode, string? status)
    {
        var list = _discounts.Values.ToList();
        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            list = list.Where(x => x.Name.ToLower().Contains(s) || x.Code.ToLower().Contains(s)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.Type.Equals(type, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(mode) && !mode.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.Mode.Equals(mode, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.Status.Equals(status, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }
        return await Task.FromResult(list.OrderBy(x => x.Id).ToList());
    }

    public async Task<DiscountRuleDto?> GetDiscountByIdAsync(int id)
    {
        _discounts.TryGetValue(id, out var item);
        return await Task.FromResult(item);
    }

    public async Task<DiscountRuleDto> CreateDiscountAsync(DiscountRuleDto discount)
    {
        int newId = _discounts.Count > 0 ? _discounts.Keys.Max() + 1 : 1;
        discount.Id = newId;
        if (string.IsNullOrEmpty(discount.Code))
            discount.Code = $"DSC-{newId:D3}";
        _discounts[newId] = discount;
        return await Task.FromResult(discount);
    }

    public async Task<DiscountRuleDto?> UpdateDiscountAsync(int id, DiscountRuleDto discount)
    {
        if (!_discounts.ContainsKey(id)) return null;
        discount.Id = id;
        _discounts[id] = discount;
        return await Task.FromResult(discount);
    }

    public async Task<bool> DeleteDiscountAsync(int id)
    {
        return await Task.FromResult(_discounts.TryRemove(id, out _));
    }

    public async Task<List<StudentDiscountDto>> GetStudentDiscountsAsync(string? search, string? className, int? discountId)
    {
        var list = _studentDiscounts.Values.ToList();
        if (discountId.HasValue && discountId.Value > 0)
        {
            list = list.Where(x => x.DiscountId == discountId.Value).ToList();
        }
        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.ClassName.Equals(className, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            list = list.Where(x => x.StudentName.ToLower().Contains(s) || x.AdmissionNo.ToLower().Contains(s)).ToList();
        }
        return await Task.FromResult(list.OrderByDescending(x => x.Id).ToList());
    }

    public async Task<StudentDiscountDto> GrantDiscountToStudentAsync(GrantDiscountRequestDto request)
    {
        int studentIdNum = int.TryParse(request.StudentId, out int sId) ? sId : 0;
        var student = await _context.Students
            .FirstOrDefaultAsync(s => s.StudentId == studentIdNum || s.AdmissionNumber == request.StudentId);

        string clsName = "Class 1";
        if (student != null)
        {
            var cls = await _context.Classes.FirstOrDefaultAsync(c => c.ClassId == student.ClassId);
            if (cls != null && !string.IsNullOrEmpty(cls.ClassName))
                clsName = cls.ClassName;
        }

        _discounts.TryGetValue(request.DiscountId, out var disc);

        int newId = _studentDiscounts.Count > 0 ? _studentDiscounts.Keys.Max() + 1 : 1;
        var award = new StudentDiscountDto
        {
            Id = newId,
            StudentId = student != null ? student.StudentId.ToString() : request.StudentId,
            StudentName = student != null && !string.IsNullOrWhiteSpace(student.StudentName) ? student.StudentName : "Student",
            AdmissionNo = student?.AdmissionNumber ?? $"ADM-{request.StudentId}",
            ClassName = clsName,
            Section = "A",
            DiscountId = request.DiscountId,
            DiscountName = disc?.Name ?? "Fee Concession",
            DiscountCode = disc?.Code ?? "DSC-000",
            Mode = disc?.Mode ?? "Percentage",
            Value = disc?.Value ?? 10m,
            AppliedDate = DateTime.Now.ToString("yyyy-MM-dd"),
            Status = "Active"
        };

        _studentDiscounts[newId] = award;
        return award;
    }

    public async Task<bool> RemoveStudentDiscountAsync(int id)
    {
        return await Task.FromResult(_studentDiscounts.TryRemove(id, out _));
    }

    // =========================================================================
    // 8. LATE FINE RULES
    // =========================================================================

    public async Task<List<FineRuleDto>> GetFineRulesAsync(string? search, string? status)
    {
        var list = _fineRules.Values.ToList();
        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            list = list.Where(x => x.RuleName.ToLower().Contains(s) || x.FineType.ToLower().Contains(s)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.Status.Equals(status, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }
        return await Task.FromResult(list.OrderBy(x => x.Id).ToList());
    }

    public async Task<FineRuleDto?> GetFineRuleByIdAsync(int id)
    {
        _fineRules.TryGetValue(id, out var item);
        return await Task.FromResult(item);
    }

    public async Task<FineRuleDto> CreateFineRuleAsync(FineRuleDto rule)
    {
        int newId = _fineRules.Count > 0 ? _fineRules.Keys.Max() + 1 : 1;
        rule.Id = newId;
        _fineRules[newId] = rule;
        return await Task.FromResult(rule);
    }

    public async Task<FineRuleDto?> UpdateFineRuleAsync(int id, FineRuleDto rule)
    {
        if (!_fineRules.ContainsKey(id)) return null;
        rule.Id = id;
        _fineRules[id] = rule;
        return await Task.FromResult(rule);
    }

    public async Task<bool> DeleteFineRuleAsync(int id)
    {
        return await Task.FromResult(_fineRules.TryRemove(id, out _));
    }

    // =========================================================================
    // 9. HOSTEL FEE CONFIGURATIONS
    // =========================================================================

    public async Task<List<FinanceHostelConfigDto>> GetHostelFeeConfigsAsync(string? search, string? hostelId, string? status)
    {
        var list = _hostelFeeConfigs.Values.ToList();

        if (!string.IsNullOrWhiteSpace(hostelId) && !hostelId.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.HostelId.Equals(hostelId, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.Status.Equals(status, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            list = list.Where(x => 
                x.HostelName.ToLower().Contains(s) || 
                x.RoomTypeName.ToLower().Contains(s) || 
                x.FeePlan.ToLower().Contains(s)
            ).ToList();
        }

        return await Task.FromResult(list.OrderBy(x => x.Id).ToList());
    }

    public async Task<FinanceHostelConfigDto?> GetHostelFeeConfigByIdAsync(int id)
    {
        _hostelFeeConfigs.TryGetValue(id, out var item);
        return await Task.FromResult(item);
    }

    public async Task<FinanceHostelConfigDto> CreateHostelFeeConfigAsync(CreateFinanceHostelConfigDto dto)
    {
        int newId = _hostelFeeConfigs.Count > 0 ? _hostelFeeConfigs.Keys.Max() + 1 : 1;
        var config = new FinanceHostelConfigDto
        {
            Id = newId,
            HostelId = dto.HostelId,
            HostelName = dto.HostelName,
            RoomTypeId = dto.RoomTypeId,
            RoomTypeName = dto.RoomTypeName,
            RoomId = dto.RoomId ?? "",
            RoomNo = dto.RoomNo ?? "All Rooms",
            FeePlan = dto.FeePlan,
            HostelFee = dto.HostelFee,
            SecurityDeposit = dto.SecurityDeposit,
            EffectiveFrom = dto.EffectiveFrom ?? DateTime.Now.ToString("yyyy-MM-dd"),
            Status = dto.Status
        };

        _hostelFeeConfigs[newId] = config;
        return await Task.FromResult(config);
    }

    public async Task<FinanceHostelConfigDto?> UpdateHostelFeeConfigAsync(int id, CreateFinanceHostelConfigDto dto)
    {
        if (!_hostelFeeConfigs.ContainsKey(id)) return null;

        var config = new FinanceHostelConfigDto
        {
            Id = id,
            HostelId = dto.HostelId,
            HostelName = dto.HostelName,
            RoomTypeId = dto.RoomTypeId,
            RoomTypeName = dto.RoomTypeName,
            RoomId = dto.RoomId ?? "",
            RoomNo = dto.RoomNo ?? "All Rooms",
            FeePlan = dto.FeePlan,
            HostelFee = dto.HostelFee,
            SecurityDeposit = dto.SecurityDeposit,
            EffectiveFrom = dto.EffectiveFrom ?? DateTime.Now.ToString("yyyy-MM-dd"),
            Status = dto.Status
        };

        _hostelFeeConfigs[id] = config;
        return await Task.FromResult(config);
    }

    public async Task<bool> DeleteHostelFeeConfigAsync(int id)
    {
        return await Task.FromResult(_hostelFeeConfigs.TryRemove(id, out _));
    }

    // =========================================================================
    // 10. UNIFORM FEE CONFIGURATIONS
    // =========================================================================

    public async Task<List<FinanceUniformConfigDto>> GetUniformFeeConfigsAsync(string? search, string? className, string? academicYear, string? status)
    {
        var list = _uniformFeeConfigs.Values.ToList();

        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.ClassName.Equals(className, System.StringComparison.OrdinalIgnoreCase) || x.ClassName.Equals("All Classes", System.StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(academicYear) && !academicYear.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.AcademicYear.Equals(academicYear, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.Status.Equals(status, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            list = list.Where(x =>
                x.UniformPackage.ToLower().Contains(s) ||
                x.ClassName.ToLower().Contains(s) ||
                x.Gender.ToLower().Contains(s) ||
                x.Branch.ToLower().Contains(s)
            ).ToList();
        }

        return await Task.FromResult(list.OrderBy(x => x.Id).ToList());
    }

    public async Task<FinanceUniformConfigDto?> GetUniformFeeConfigByIdAsync(int id)
    {
        _uniformFeeConfigs.TryGetValue(id, out var item);
        return await Task.FromResult(item);
    }

    public async Task<FinanceUniformConfigDto> CreateUniformFeeConfigAsync(CreateFinanceUniformConfigDto dto)
    {
        int newId = _uniformFeeConfigs.Count > 0 ? _uniformFeeConfigs.Keys.Max() + 1 : 1;
        var config = new FinanceUniformConfigDto
        {
            Id = newId,
            AcademicYear = dto.AcademicYear ?? "2026-2027",
            Branch = dto.Branch ?? "Main Campus",
            ClassName = dto.ClassName,
            Gender = dto.Gender,
            UniformPackage = dto.UniformPackage,
            UniformItemId = dto.UniformItemId,
            FeePlan = dto.FeePlan ?? "Annual",
            FeeAmount = dto.FeeAmount,
            EffectiveFrom = dto.EffectiveFrom ?? DateTime.Now.ToString("yyyy-MM-dd"),
            Status = dto.Status
        };

        _uniformFeeConfigs[newId] = config;
        return await Task.FromResult(config);
    }

    public async Task<FinanceUniformConfigDto?> UpdateUniformFeeConfigAsync(int id, CreateFinanceUniformConfigDto dto)
    {
        if (!_uniformFeeConfigs.ContainsKey(id)) return null;

        var config = new FinanceUniformConfigDto
        {
            Id = id,
            AcademicYear = dto.AcademicYear ?? "2026-2027",
            Branch = dto.Branch ?? "Main Campus",
            ClassName = dto.ClassName,
            Gender = dto.Gender,
            UniformPackage = dto.UniformPackage,
            UniformItemId = dto.UniformItemId,
            FeePlan = dto.FeePlan ?? "Annual",
            FeeAmount = dto.FeeAmount,
            EffectiveFrom = dto.EffectiveFrom ?? DateTime.Now.ToString("yyyy-MM-dd"),
            Status = dto.Status
        };

        _uniformFeeConfigs[id] = config;
        return await Task.FromResult(config);
    }

    public async Task<bool> DeleteUniformFeeConfigAsync(int id)
    {
        return await Task.FromResult(_uniformFeeConfigs.TryRemove(id, out _));
    }
}