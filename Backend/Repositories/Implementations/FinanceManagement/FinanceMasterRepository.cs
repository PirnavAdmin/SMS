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
using System.Text.Json;
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

    public async Task<FeeScheduleConfigDto> GetFeeScheduleAsync(string? academicYear)
    {
        string ay = string.IsNullOrWhiteSpace(academicYear) ? "2026-2027" : academicYear.Trim();
        var entity = await _context.FeeSchedules.AsNoTracking()
            .FirstOrDefaultAsync(s => s.AcademicYear == ay);

        if (entity != null)
        {
            var terms = !string.IsNullOrEmpty(entity.TermsJson)
                ? JsonSerializer.Deserialize<List<FeeScheduleTermDto>>(entity.TermsJson) ?? new()
                : new();

            var monthly = !string.IsNullOrEmpty(entity.MonthlyConfigJson)
                ? JsonSerializer.Deserialize<MonthlyDueDateConfigDto>(entity.MonthlyConfigJson)
                : null;

            return new FeeScheduleConfigDto
            {
                Id = entity.Id,
                AcademicYear = entity.AcademicYear,
                NumberOfTerms = entity.NumberOfTerms,
                Status = entity.Status,
                AnnualDueDate = entity.AnnualDueDate,
                OneTimeDueDate = entity.OneTimeDueDate,
                Terms = terms,
                MonthlyConfig = monthly
            };
        }

        // Return standard 4-term default schedule if not yet configured in DB
        return new FeeScheduleConfigDto
        {
            Id = $"SCH-{ay}",
            AcademicYear = ay,
            NumberOfTerms = 4,
            Status = "Published",
            AnnualDueDate = "2026-04-15",
            OneTimeDueDate = "2026-04-15",
            Terms = new List<FeeScheduleTermDto>
            {
                new FeeScheduleTermDto { Id = $"T1-{ay}", TermName = "Term 1", StartDate = "2026-04-01", EndDate = "2026-06-30", DueDate = "2026-04-15", Sequence = 1, Status = "Active" },
                new FeeScheduleTermDto { Id = $"T2-{ay}", TermName = "Term 2", StartDate = "2026-07-01", EndDate = "2026-09-30", DueDate = "2026-07-15", Sequence = 2, Status = "Active" },
                new FeeScheduleTermDto { Id = $"T3-{ay}", TermName = "Term 3", StartDate = "2026-10-01", EndDate = "2026-12-31", DueDate = "2026-10-15", Sequence = 3, Status = "Active" },
                new FeeScheduleTermDto { Id = $"T4-{ay}", TermName = "Term 4", StartDate = "2027-01-01", EndDate = "2027-03-31", DueDate = "2027-01-15", Sequence = 4, Status = "Active" }
            },
            MonthlyConfig = new MonthlyDueDateConfigDto
            {
                ApplySameDayToAllMonths = true,
                DueDay = 10,
                MonthDueDates = new List<MonthDueDateItemDto>()
            }
        };
    }

    public async Task<bool> SaveFeeScheduleAsync(FeeScheduleConfigDto schedule)
    {
        if (schedule == null) return false;
        string ay = string.IsNullOrWhiteSpace(schedule.AcademicYear) ? "2026-2027" : schedule.AcademicYear.Trim();
        string sId = string.IsNullOrWhiteSpace(schedule.Id) ? $"SCH-{ay}" : schedule.Id;

        var existing = await _context.FeeSchedules.FirstOrDefaultAsync(s => s.AcademicYear == ay || s.Id == sId);

        string termsJson = JsonSerializer.Serialize(schedule.Terms ?? new());
        string? monthlyJson = schedule.MonthlyConfig != null ? JsonSerializer.Serialize(schedule.MonthlyConfig) : null;

        if (existing != null)
        {
            existing.NumberOfTerms = schedule.NumberOfTerms;
            existing.Status = string.IsNullOrWhiteSpace(schedule.Status) ? "Published" : schedule.Status;
            existing.AnnualDueDate = schedule.AnnualDueDate ?? "2026-04-15";
            existing.OneTimeDueDate = schedule.OneTimeDueDate ?? "2026-04-15";
            existing.TermsJson = termsJson;
            existing.MonthlyConfigJson = monthlyJson;
            existing.UpdatedAt = DateTime.UtcNow;
            _context.FeeSchedules.Update(existing);
        }
        else
        {
            var newEntity = new FeeSchedule
            {
                Id = sId,
                AcademicYear = ay,
                NumberOfTerms = schedule.NumberOfTerms,
                Status = string.IsNullOrWhiteSpace(schedule.Status) ? "Published" : schedule.Status,
                AnnualDueDate = schedule.AnnualDueDate ?? "2026-04-15",
                OneTimeDueDate = schedule.OneTimeDueDate ?? "2026-04-15",
                TermsJson = termsJson,
                MonthlyConfigJson = monthlyJson,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _context.FeeSchedules.AddAsync(newEntity);
        }

        await _context.SaveChangesAsync();
        return true;
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
        var query = _context.Scholarships.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(s) || x.Code.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.Type == type);
        }
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.Status == status);
        }

        var entities = await query.OrderBy(x => x.Id).ToListAsync();
        return entities.Select(MapToScholarshipDto).ToList();
    }

    public async Task<ScholarshipMasterDto?> GetScholarshipByIdAsync(int id)
    {
        var entity = await _context.Scholarships.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return entity == null ? null : MapToScholarshipDto(entity);
    }

    public async Task<ScholarshipMasterDto> CreateScholarshipAsync(ScholarshipMasterDto dto)
    {
        var entity = new Scholarship
        {
            Name = dto.Name,
            Code = string.IsNullOrWhiteSpace(dto.Code) ? $"SCH-{DateTime.UtcNow.Ticks % 10000:D4}" : dto.Code,
            Type = string.IsNullOrWhiteSpace(dto.Type) ? "Merit" : dto.Type,
            DiscountType = string.IsNullOrWhiteSpace(dto.DiscountType) ? "Percentage" : dto.DiscountType,
            Percentage = dto.Percentage,
            FixedAmount = dto.FixedAmount,
            ApplicableFeeHeadIdsJson = JsonSerializer.Serialize(dto.ApplicableFeeHeadIds ?? new List<string>()),
            ApplicableClassesJson = JsonSerializer.Serialize(dto.ApplicableClasses ?? new List<string>()),
            StartDate = string.IsNullOrWhiteSpace(dto.StartDate) ? "2026-04-01" : dto.StartDate,
            EndDate = string.IsNullOrWhiteSpace(dto.EndDate) ? "2027-03-31" : dto.EndDate,
            Eligibility = dto.Eligibility ?? string.Empty,
            Description = dto.Description ?? string.Empty,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Scholarships.Add(entity);
        await _context.SaveChangesAsync();
        return MapToScholarshipDto(entity);
    }

    public async Task<ScholarshipMasterDto?> UpdateScholarshipAsync(int id, ScholarshipMasterDto dto)
    {
        var entity = await _context.Scholarships.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) return null;

        entity.Name = dto.Name;
        if (!string.IsNullOrWhiteSpace(dto.Code)) entity.Code = dto.Code;
        entity.Type = dto.Type;
        entity.DiscountType = dto.DiscountType;
        entity.Percentage = dto.Percentage;
        entity.FixedAmount = dto.FixedAmount;
        if (dto.ApplicableFeeHeadIds != null)
            entity.ApplicableFeeHeadIdsJson = JsonSerializer.Serialize(dto.ApplicableFeeHeadIds);
        if (dto.ApplicableClasses != null)
            entity.ApplicableClassesJson = JsonSerializer.Serialize(dto.ApplicableClasses);
        entity.StartDate = dto.StartDate;
        entity.EndDate = dto.EndDate;
        entity.Eligibility = dto.Eligibility;
        entity.Description = dto.Description;
        entity.Status = dto.Status;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToScholarshipDto(entity);
    }

    public async Task<bool> DeleteScholarshipAsync(int id)
    {
        var entity = await _context.Scholarships.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) return false;

        _context.Scholarships.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<StudentScholarshipAwardDto>> GetStudentScholarshipsAsync(string? search, string? className, int? scholarshipId)
    {
        var query = _context.StudentScholarships.AsNoTracking().AsQueryable();

        if (scholarshipId.HasValue && scholarshipId.Value > 0)
        {
            query = query.Where(x => x.ScholarshipId == scholarshipId.Value);
        }
        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.ClassName == className);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(x => x.StudentName.ToLower().Contains(s) || (x.AdmissionNo != null && x.AdmissionNo.ToLower().Contains(s)));
        }

        var entities = await query.OrderByDescending(x => x.Id).ToListAsync();
        return entities.Select(MapToStudentScholarshipAwardDto).ToList();
    }

    public async Task<StudentScholarshipAwardDto> AwardScholarshipToStudentAsync(AwardScholarshipRequestDto request)
    {
        int studentIdNum = int.TryParse(request.StudentId, out int sId) ? sId : 0;
        var student = await _context.Students
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .FirstOrDefaultAsync(s => s.StudentId == studentIdNum || s.AdmissionNumber == request.StudentId);

        var sch = await _context.Scholarships.FirstOrDefaultAsync(x => x.Id == request.ScholarshipId);

        string clsName = student?.ClassGrade?.ClassName ?? "Class 1";
        string secName = student?.ClassSection?.SectionName ?? "A";
        string stName = student?.StudentName ?? "Student";
        string admNo = student?.AdmissionNumber ?? $"ADM-{request.StudentId}";

        var award = new StudentScholarship
        {
            StudentId = student != null ? student.StudentId.ToString() : request.StudentId,
            StudentName = stName,
            AdmissionNo = admNo,
            ClassName = clsName,
            Section = secName,
            ScholarshipId = request.ScholarshipId,
            ScholarshipName = sch?.Name ?? "Scholarship Grant",
            ScholarshipCode = sch?.Code ?? "SCH-000",
            DiscountType = sch?.DiscountType ?? "Percentage",
            DiscountValue = sch != null ? (sch.DiscountType == "Percentage" ? sch.Percentage : sch.FixedAmount) : 15m,
            AppliedDate = DateTime.Now.ToString("yyyy-MM-dd"),
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        _context.StudentScholarships.Add(award);
        await _context.SaveChangesAsync();
        return MapToStudentScholarshipAwardDto(award);
    }

    public async Task<bool> RevokeStudentScholarshipAsync(int id)
    {
        var entity = await _context.StudentScholarships.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) return false;

        _context.StudentScholarships.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    private static ScholarshipMasterDto MapToScholarshipDto(Scholarship s)
    {
        List<string> feeHeads = new();
        List<string> classes = new();
        try
        {
            if (!string.IsNullOrWhiteSpace(s.ApplicableFeeHeadIdsJson))
                feeHeads = JsonSerializer.Deserialize<List<string>>(s.ApplicableFeeHeadIdsJson) ?? new();
        }
        catch { }
        try
        {
            if (!string.IsNullOrWhiteSpace(s.ApplicableClassesJson))
                classes = JsonSerializer.Deserialize<List<string>>(s.ApplicableClassesJson) ?? new();
        }
        catch { }

        return new ScholarshipMasterDto
        {
            Id = s.Id,
            Name = s.Name,
            Code = s.Code,
            Type = s.Type,
            DiscountType = s.DiscountType,
            Percentage = s.Percentage,
            FixedAmount = s.FixedAmount,
            ApplicableFeeHeadIds = feeHeads,
            ApplicableClasses = classes,
            StartDate = s.StartDate,
            EndDate = s.EndDate,
            Eligibility = s.Eligibility ?? string.Empty,
            Description = s.Description ?? string.Empty,
            Status = s.Status
        };
    }

    private static StudentScholarshipAwardDto MapToStudentScholarshipAwardDto(StudentScholarship ss)
    {
        return new StudentScholarshipAwardDto
        {
            Id = ss.Id,
            StudentId = ss.StudentId,
            StudentName = ss.StudentName,
            AdmissionNo = ss.AdmissionNo ?? string.Empty,
            ClassName = ss.ClassName ?? string.Empty,
            Section = ss.Section ?? string.Empty,
            ScholarshipId = ss.ScholarshipId,
            ScholarshipName = ss.ScholarshipName,
            ScholarshipCode = ss.ScholarshipCode,
            DiscountType = ss.DiscountType,
            DiscountValue = ss.DiscountValue,
            AppliedDate = ss.AppliedDate,
            Status = ss.Status
        };
    }

    // =========================================================================
    // 7. DISCOUNTS & STUDENT CONCESSIONS
    // =========================================================================

    public async Task<List<DiscountRuleDto>> GetDiscountsAsync(string? search, string? type, string? mode, string? status)
    {
        var query = _context.Discounts.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(s) || x.Code.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.Type.ToLower() == type.ToLower());
        }
        if (!string.IsNullOrWhiteSpace(mode) && !mode.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.Mode.ToLower() == mode.ToLower());
        }
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.Status.ToLower() == status.ToLower());
        }

        var entities = await query.OrderBy(x => x.Id).ToListAsync();
        return entities.Select(MapToDiscountRuleDto).ToList();
    }

    public async Task<DiscountRuleDto?> GetDiscountByIdAsync(int id)
    {
        var entity = await _context.Discounts.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return entity == null ? null : MapToDiscountRuleDto(entity);
    }

    public async Task<DiscountRuleDto> CreateDiscountAsync(DiscountRuleDto discount)
    {
        string code = discount.Code;
        if (string.IsNullOrWhiteSpace(code))
        {
            int maxId = await _context.Discounts.MaxAsync(x => (int?)x.Id) ?? 0;
            code = $"DSC-{maxId + 1:D3}";
        }

        var entity = new DiscountRule
        {
            Name = discount.Name,
            Code = code,
            Type = string.IsNullOrWhiteSpace(discount.Type) ? "Sibling Discount" : discount.Type,
            Mode = string.IsNullOrWhiteSpace(discount.Mode) ? "Percentage" : discount.Mode,
            Value = discount.Value,
            Description = discount.Description ?? string.Empty,
            Status = string.IsNullOrWhiteSpace(discount.Status) ? "Active" : discount.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Discounts.Add(entity);
        await _context.SaveChangesAsync();
        return MapToDiscountRuleDto(entity);
    }

    public async Task<DiscountRuleDto?> UpdateDiscountAsync(int id, DiscountRuleDto discount)
    {
        var entity = await _context.Discounts.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) return null;

        entity.Name = discount.Name;
        if (!string.IsNullOrWhiteSpace(discount.Code))
            entity.Code = discount.Code;
        entity.Type = string.IsNullOrWhiteSpace(discount.Type) ? entity.Type : discount.Type;
        entity.Mode = string.IsNullOrWhiteSpace(discount.Mode) ? entity.Mode : discount.Mode;
        entity.Value = discount.Value;
        entity.Description = discount.Description ?? entity.Description;
        entity.Status = string.IsNullOrWhiteSpace(discount.Status) ? entity.Status : discount.Status;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDiscountRuleDto(entity);
    }

    public async Task<bool> DeleteDiscountAsync(int id)
    {
        var entity = await _context.Discounts.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) return false;

        _context.Discounts.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<StudentDiscountDto>> GetStudentDiscountsAsync(string? search, string? className, int? discountId)
    {
        var query = _context.StudentDiscounts.AsNoTracking().AsQueryable();

        if (discountId.HasValue && discountId.Value > 0)
        {
            query = query.Where(x => x.DiscountId == discountId.Value);
        }
        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.ClassName != null && x.ClassName.ToLower() == className.ToLower());
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(x => x.StudentName.ToLower().Contains(s) || (x.AdmissionNo != null && x.AdmissionNo.ToLower().Contains(s)));
        }

        var entities = await query.OrderByDescending(x => x.Id).ToListAsync();
        return entities.Select(MapToStudentDiscountDto).ToList();
    }

    public async Task<StudentDiscountDto> GrantDiscountToStudentAsync(GrantDiscountRequestDto request)
    {
        int studentIdNum = int.TryParse(request.StudentId, out int sId) ? sId : 0;
        var student = await _context.Students
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .FirstOrDefaultAsync(s => s.StudentId == studentIdNum || s.AdmissionNumber == request.StudentId);

        var disc = await _context.Discounts.FirstOrDefaultAsync(x => x.Id == request.DiscountId);

        string clsName = student?.ClassGrade?.ClassName ?? "Class 1";
        string secName = student?.ClassSection?.SectionName ?? "A";
        string stName = student?.StudentName ?? "Student";
        string admNo = student?.AdmissionNumber ?? $"ADM-{request.StudentId}";

        var award = new StudentDiscount
        {
            StudentId = student != null ? student.StudentId.ToString() : request.StudentId,
            StudentName = stName,
            AdmissionNo = admNo,
            ClassName = clsName,
            Section = secName,
            DiscountId = request.DiscountId,
            DiscountName = disc?.Name ?? "Fee Concession",
            DiscountCode = disc?.Code ?? "DSC-000",
            Mode = disc?.Mode ?? "Percentage",
            Value = disc?.Value ?? 10m,
            AppliedDate = DateTime.Now.ToString("yyyy-MM-dd"),
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        _context.StudentDiscounts.Add(award);
        await _context.SaveChangesAsync();
        return MapToStudentDiscountDto(award);
    }

    public async Task<bool> RemoveStudentDiscountAsync(int id)
    {
        var entity = await _context.StudentDiscounts.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) return false;

        _context.StudentDiscounts.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    private static DiscountRuleDto MapToDiscountRuleDto(DiscountRule d)
    {
        return new DiscountRuleDto
        {
            Id = d.Id,
            Name = d.Name,
            Code = d.Code,
            Type = d.Type,
            Mode = d.Mode,
            Value = d.Value,
            Description = d.Description ?? string.Empty,
            Status = d.Status
        };
    }

    private static StudentDiscountDto MapToStudentDiscountDto(StudentDiscount sd)
    {
        return new StudentDiscountDto
        {
            Id = sd.Id,
            StudentId = sd.StudentId,
            StudentName = sd.StudentName,
            AdmissionNo = sd.AdmissionNo ?? string.Empty,
            ClassName = sd.ClassName ?? string.Empty,
            Section = sd.Section ?? string.Empty,
            DiscountId = sd.DiscountId,
            DiscountName = sd.DiscountName,
            DiscountCode = sd.DiscountCode,
            Mode = sd.Mode,
            Value = sd.Value,
            AppliedDate = sd.AppliedDate,
            Status = sd.Status
        };
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