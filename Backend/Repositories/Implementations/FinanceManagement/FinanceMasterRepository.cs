namespace SMS.Api.Repositories.Implementations.FinanceManagement;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using SMS.Api.Services.Implementations.FinanceManagement;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

public class FinanceMasterRepository : IFinanceMasterRepository
{
    private readonly AppDbContext _context;

    public FinanceMasterRepository(AppDbContext context)
    {
        _context = context;
    }

    // =========================================================================
    // 1. GENERAL LEDGER & TRANSACTIONS (DYNAMIC FROM MYSQL DATABASE)
    // =========================================================================

    private async Task<FinancialAccount?> ResolveFinancialAccountAsync(string? accountHint, string? paymentMode)
    {
        var accounts = await _context.FinancialAccounts
            .Where(a => a.Status == "Active" || string.IsNullOrEmpty(a.Status))
            .ToListAsync();
        if (accounts.Count == 0)
            accounts = await _context.FinancialAccounts.ToListAsync();
        if (accounts.Count == 0) return null;

        if (!string.IsNullOrWhiteSpace(accountHint))
        {
            var matched = accounts.FirstOrDefault(a =>
                a.Name.Equals(accountHint.Trim(), StringComparison.OrdinalIgnoreCase) ||
                a.Name.Contains(accountHint.Trim(), StringComparison.OrdinalIgnoreCase));
            if (matched != null) return matched;
        }

        bool isCash = string.Equals(paymentMode?.Trim(), "Cash", StringComparison.OrdinalIgnoreCase);
        if (isCash)
        {
            return accounts.FirstOrDefault(a =>
                a.Type.Contains("Cash", StringComparison.OrdinalIgnoreCase) ||
                a.Name.Contains("Cash", StringComparison.OrdinalIgnoreCase)) ?? accounts[0];
        }

        return accounts.FirstOrDefault(a => !a.Type.Contains("Cash", StringComparison.OrdinalIgnoreCase)) ?? accounts[0];
    }

    public async Task<List<FinanceTransactionDto>> GetTransactionsAsync(
        string? search, string? type, string? module, string? category, string? paymentMode, string? status, int page, int pageSize)
    {
        var result = new List<FinanceTransactionDto>();

        var accounts = await _context.FinancialAccounts.AsNoTracking().ToListAsync();
        var accountNameById = accounts.ToDictionary(a => a.Id, a => a.Name);

        // 1. FeePayments -> Income Transactions (exclude negative refund entries handled in LedgerEntries)
        var payments = await _context.FeePayments.AsNoTracking()
            .Where(p => !(p.Amount < 0 && p.Status == "Refunded"))
            .ToListAsync();
        var students = await _context.Students.AsNoTracking()
            .Select(s => new
            {
                s.StudentId,
                s.AdmissionNumber,
                s.StudentName,
                ClassName = s.ClassGrade != null ? s.ClassGrade.ClassName : string.Empty
            })
            .ToListAsync();

        var studentById = students.ToDictionary(s => s.StudentId.ToString(), s => s);
        var studentByAdm = students
            .Where(s => !string.IsNullOrWhiteSpace(s.AdmissionNumber))
            .GroupBy(s => s.AdmissionNumber!)
            .ToDictionary(g => g.Key, g => g.First());

        var feeReceiptNos = new HashSet<string>(
            payments.Where(p => !string.IsNullOrWhiteSpace(p.ReceiptNo)).Select(p => p.ReceiptNo),
            StringComparer.OrdinalIgnoreCase);

        foreach (var p in payments)
        {
            var st = (p.StudentId != null && studentById.TryGetValue(p.StudentId, out var byId))
                ? byId
                : (p.StudentId != null && studentByAdm.TryGetValue(p.StudentId, out var byAdm) ? byAdm : null);
            string stName = st?.StudentName ?? (p.StudentId != null ? $"Student #{p.StudentId}" : "Student");
            string cName = st?.ClassName ?? string.Empty;
            string txnStatus = (p.Status == "Cancelled" || p.Status == "Reversed") ? p.Status : "Completed";

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
                Account = (p.PaymentMethod == "Cash") ? "School Petty Cash" : "Main Bank Account",
                TransactionDate = p.PaymentDate,
                Status = txnStatus,
                ReferenceNumber = p.TransactionId ?? "",
                CreatedBy = "Accounts Counter",
                Branch = string.Empty,
                AcademicYear = "2026-2027"
            });
        }

        // 2. Expenses -> Expense Transactions
        var dbExpenses = await _context.Expenses.AsNoTracking().ToListAsync();
        var expenseRefs = new HashSet<string>(
            dbExpenses.Where(e => !string.IsNullOrWhiteSpace(e.ReferenceNo)).Select(e => e.ReferenceNo),
            StringComparer.OrdinalIgnoreCase);

        foreach (var e in dbExpenses)
        {
            string acctName = e.FinancialAccountId.HasValue && accountNameById.TryGetValue(e.FinancialAccountId.Value, out var an)
                ? an
                : (string.Equals(e.PaymentMethod, "Cash", StringComparison.OrdinalIgnoreCase) ? "School Petty Cash" : "Main Bank Account");

            result.Add(new FinanceTransactionDto
            {
                Id = 20000 + e.Id,
                TransactionId = !string.IsNullOrEmpty(e.ExpenseNo) ? e.ExpenseNo : $"TXN-EXP-{e.Id:D4}",
                Type = "Expense",
                SourceModule = "Expense",
                Category = !string.IsNullOrWhiteSpace(e.Category) ? e.Category : "Campus Maintenance & Repairs",
                Description = !string.IsNullOrWhiteSpace(e.Description) ? e.Description : "Campus Expense",
                Amount = e.Amount,
                PaymentMode = e.PaymentMethod ?? "Bank Transfer",
                Account = acctName,
                TransactionDate = e.Date,
                Status = e.Status == "Approved" ? "Completed" : (e.Status ?? "Completed"),
                ReferenceNumber = e.ReferenceNo ?? "",
                CreatedBy = "Admin",
                Branch = string.Empty,
                AcademicYear = "2026-2027",
                Notes = e.Vendor ?? ""
            });
        }

        // 3. LedgerEntries -> Manual/Refund/Contra GL Transactions (skip mirrored FeePayment/Expense rows to prevent double counting)
        var dbLedgers = await _context.LedgerEntries.AsNoTracking().ToListAsync();
        foreach (var l in dbLedgers)
        {
            if (!string.IsNullOrWhiteSpace(l.ReferenceNo))
            {
                if (feeReceiptNos.Contains(l.ReferenceNo)) continue;
                if (expenseRefs.Contains(l.ReferenceNo)) continue;
            }
            if (l.Category == "Fee Refund") continue; // Pending refund requests live in FeeRefundRequests until disbursed

            bool isReversed = (l.Particulars ?? "").Contains("[Reversed", StringComparison.OrdinalIgnoreCase);
            string acctName = l.FinancialAccountId.HasValue && accountNameById.TryGetValue(l.FinancialAccountId.Value, out var an)
                ? an
                : (!string.IsNullOrWhiteSpace(l.AdmissionNo) && !l.StudentId.HasValue ? l.AdmissionNo : "Main Bank Account");

            result.Add(new FinanceTransactionDto
            {
                Id = 10000 + l.Id,
                TransactionId = $"TXN-LED-{l.Id:D4}",
                Type = l.Credit > 0 ? "Income" : "Expense",
                SourceModule = string.IsNullOrWhiteSpace(l.TransactionType) ? "Manual" : l.TransactionType,
                Category = l.Category ?? "General",
                Description = l.Particulars ?? "Ledger Transaction",
                Amount = l.Credit > 0 ? l.Credit : l.Debit,
                PaymentMode = "Bank Transfer",
                Account = acctName,
                TransactionDate = l.TransactionDate,
                Status = isReversed ? "Reversed" : "Completed",
                ReferenceNumber = l.ReferenceNo ?? "",
                CreatedBy = "Admin",
                Branch = string.Empty,
                AcademicYear = "2026-2027",
                Notes = l.Particulars ?? ""
            });
        }

        // Filters
        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            result = result.Where(t => t.Type.Equals(type, StringComparison.OrdinalIgnoreCase)).ToList();

        if (!string.IsNullOrWhiteSpace(module) && !module.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (module.Equals("Student Fee Collection", StringComparison.OrdinalIgnoreCase) || module.Equals("Fee Collection", StringComparison.OrdinalIgnoreCase))
            {
                result = result.Where(t => t.SourceModule.Equals("Fees", StringComparison.OrdinalIgnoreCase) || t.SourceModule.Equals("Fee Collection", StringComparison.OrdinalIgnoreCase) || t.SourceModule.Equals("Student Fee Collection", StringComparison.OrdinalIgnoreCase)).ToList();
            }
            else if (module.Equals("Manual", StringComparison.OrdinalIgnoreCase) || module.Equals("Manual Entries", StringComparison.OrdinalIgnoreCase))
            {
                result = result.Where(t => t.SourceModule.Equals("Manual", StringComparison.OrdinalIgnoreCase) || t.SourceModule.Equals("Manual Entries", StringComparison.OrdinalIgnoreCase)).ToList();
            }
            else
            {
                result = result.Where(t => t.SourceModule.Equals(module, StringComparison.OrdinalIgnoreCase)).ToList();
            }
        }

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
        DateTime today = DateTime.UtcNow.Date;

        var validPayments = _context.FeePayments.AsNoTracking()
            .Where(p => p.Status != "Cancelled" && p.Status != "Reversed" && !(p.Amount < 0 && p.Status == "Refunded"));

        decimal feeInflow = await validPayments.SumAsync(p => p.Amount);
        decimal todayFeeInflow = await validPayments
            .Where(p => p.PaymentDate >= today && p.PaymentDate < today.AddDays(1))
            .SumAsync(p => p.Amount);

        var activeExpenses = _context.Expenses.AsNoTracking()
            .Where(e => e.Status != "Cancelled" && e.Status != "Reversed" && e.Status != "Rejected");
        decimal expenseOutflow = await activeExpenses.SumAsync(e => e.Amount);

        var feeReceipts = await _context.FeePayments.AsNoTracking()
            .Where(p => !string.IsNullOrEmpty(p.ReceiptNo))
            .Select(p => p.ReceiptNo)
            .ToListAsync();
        var expenseRefs = await _context.Expenses.AsNoTracking()
            .Where(e => !string.IsNullOrEmpty(e.ReferenceNo))
            .Select(e => e.ReferenceNo)
            .ToListAsync();

        var excludedRefs = new HashSet<string>(feeReceipts.Concat(expenseRefs), StringComparer.OrdinalIgnoreCase);

        var ledgers = await _context.LedgerEntries.AsNoTracking()
            .Where(l => l.Category != "Fee Refund")
            .Select(l => new { l.ReferenceNo, l.Credit, l.Debit, l.TransactionDate, l.Particulars })
            .ToListAsync();

        var standaloneLedgers = ledgers
            .Where(l => (string.IsNullOrWhiteSpace(l.ReferenceNo) || !excludedRefs.Contains(l.ReferenceNo)) &&
                        !(l.Particulars ?? "").Contains("[Reversed", StringComparison.OrdinalIgnoreCase))
            .ToList();

        decimal manualInflow = standaloneLedgers.Sum(l => l.Credit);
        decimal todayManualInflow = standaloneLedgers
            .Where(l => l.TransactionDate.Date == today)
            .Sum(l => l.Credit);
        decimal manualOutflow = standaloneLedgers.Sum(l => l.Debit);

        decimal inflow = feeInflow + manualInflow;
        decimal outflow = expenseOutflow + manualOutflow;

        return new FinanceTransactionSummaryDto
        {
            TotalInflow = inflow,
            TotalOutflow = outflow,
            NetBalance = inflow - outflow,
            TodayInflow = todayFeeInflow + todayManualInflow,
            PendingClearances = 0m
        };
    }

    public async Task<FinanceTransactionDto> CreateTransactionAsync(CreateTransactionRequestDto request)
    {
        int branchId = 0;
        if (!string.IsNullOrWhiteSpace(request.Branch))
        {
            var dbBr = await _context.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.BranchName == request.Branch);
            if (dbBr != null) branchId = dbBr.BranchId;
        }

        DateTime txnDate = DateTime.TryParse(request.TransactionDate, out var dt) ? dt : DateTime.UtcNow;
        var targetAccount = await ResolveFinancialAccountAsync(request.Account, request.PaymentMode);
        bool isExpense = string.Equals(request.Type, "Expense", StringComparison.OrdinalIgnoreCase);
        string refNo = $"REF-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..5].ToUpper()}";

        Expense? createdExpense = null;
        LedgerEntry ledgerEntry = null!;

        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = _context.Database.IsRelational()
                ? await _context.Database.BeginTransactionAsync()
                : null;

            if (targetAccount != null)
            {
                targetAccount.CurrentBalance += isExpense ? -request.Amount : request.Amount;
            }

            ledgerEntry = new LedgerEntry
            {
                TransactionDate = txnDate,
                TransactionType = string.IsNullOrWhiteSpace(request.SourceModule) ? "Manual" : request.SourceModule,
                Category = !string.IsNullOrWhiteSpace(request.Category) ? request.Category : (isExpense ? "Expense" : "Income"),
                Particulars = !string.IsNullOrWhiteSpace(request.Description) ? request.Description : "Manual Transaction",
                FinancialAccountId = targetAccount?.Id,
                Credit = isExpense ? 0m : request.Amount,
                Debit = isExpense ? request.Amount : 0m,
                Balance = targetAccount?.CurrentBalance ?? 0m,
                ReferenceNo = refNo,
                AdmissionNo = targetAccount?.Name ?? request.Account ?? "Main Bank Account",
                BranchId = branchId
            };

            _context.LedgerEntries.Add(ledgerEntry);

            createdExpense = null;
            if (isExpense)
            {
                createdExpense = new Expense
                {
                    ExpenseNo = $"EXP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}",
                    Date = txnDate,
                    Category = !string.IsNullOrWhiteSpace(request.Category) ? request.Category : "General",
                    Vendor = !string.IsNullOrWhiteSpace(request.Description) ? request.Description : "General Vendor",
                    Description = !string.IsNullOrWhiteSpace(request.Description) ? request.Description : "Manual Expense Entry",
                    Amount = request.Amount,
                    FinancialAccountId = targetAccount?.Id,
                    PaymentMethod = request.PaymentMode ?? "Bank Transfer",
                    ReferenceNo = refNo,
                    Status = "Approved",
                    BranchId = branchId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Expenses.Add(createdExpense);
            }

            await _context.SaveChangesAsync();
            if (tx != null)
            {
                await tx.CommitAsync();
            }
        });

        return new FinanceTransactionDto
        {
            Id = createdExpense != null ? (20000 + createdExpense.Id) : (10000 + ledgerEntry.Id),
            TransactionId = createdExpense != null ? createdExpense.ExpenseNo : $"TXN-LED-{ledgerEntry.Id:D4}",
            Type = isExpense ? "Expense" : "Income",
            SourceModule = createdExpense != null ? "Expense" : (request.SourceModule ?? "Manual"),
            Category = request.Category ?? "General",
            Description = ledgerEntry.Particulars,
            Amount = request.Amount,
            PaymentMode = request.PaymentMode ?? "Bank Transfer",
            Account = targetAccount?.Name ?? request.Account ?? "Main Bank Account",
            TransactionDate = ledgerEntry.TransactionDate,
            Status = "Completed",
            ReferenceNumber = ledgerEntry.ReferenceNo,
            CreatedBy = "Admin",
            Branch = request.Branch ?? string.Empty,
            AcademicYear = request.AcademicYear ?? "2026-2027",
            Notes = request.Notes ?? "",
            AttachmentName = request.AttachmentName ?? ""
        };
    }

    public async Task<bool> ReverseTransactionAsync(int id, ReverseTransactionRequestDto request)
    {
        bool result = false;
        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = _context.Database.IsRelational()
                ? await _context.Database.BeginTransactionAsync()
                : null;

            if (id >= 10000 && id < 20000)
            {
                int realId = id - 10000;
                var entry = await _context.LedgerEntries.FirstOrDefaultAsync(l => l.Id == realId);
                if (entry == null) { result = false; return; }
                if ((entry.Particulars ?? "").Contains("[Reversed", StringComparison.OrdinalIgnoreCase)) { result = false; return; }

                entry.Particulars = $"{entry.Particulars} [Reversed: {request.ReversalReason} by {request.AuthorizedBy}]".Trim();

                var acct = entry.FinancialAccountId.HasValue
                    ? await _context.FinancialAccounts.FirstOrDefaultAsync(a => a.Id == entry.FinancialAccountId.Value)
                    : await ResolveFinancialAccountAsync(entry.AdmissionNo, null);
                if (acct != null)
                {
                    acct.CurrentBalance += entry.Debit - entry.Credit;
                }

                _context.LedgerEntries.Add(new LedgerEntry
                {
                    TransactionDate = DateTime.UtcNow,
                    TransactionType = "Reversal",
                    Category = entry.Category,
                    ReferenceNo = $"REV-{entry.ReferenceNo}",
                    FinancialAccountId = acct?.Id,
                    StudentId = entry.StudentId,
                    AdmissionNo = entry.AdmissionNo,
                    Credit = entry.Debit,
                    Debit = entry.Credit,
                    Balance = acct?.CurrentBalance ?? 0m,
                    Particulars = $"Contra Reversal for TXN-LED-{realId:D4} ({request.ReversalReason})",
                    AcademicYearId = entry.AcademicYearId,
                    BranchId = entry.BranchId
                });

                if (!string.IsNullOrWhiteSpace(entry.ReferenceNo))
                {
                    var pairedExp = await _context.Expenses.FirstOrDefaultAsync(e => e.ReferenceNo == entry.ReferenceNo && e.Status != "Reversed");
                    if (pairedExp != null) pairedExp.Status = "Reversed";
                }

                await _context.SaveChangesAsync();
                if (tx != null) await tx.CommitAsync();
                result = true;
            }
            else if (id >= 20000)
            {
                int realId = id - 20000;
                var exp = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == realId);
                if (exp == null || exp.Status == "Reversed" || exp.Status == "Cancelled") { result = false; return; }

                exp.Status = "Reversed";
                var acct = exp.FinancialAccountId.HasValue
                    ? await _context.FinancialAccounts.FirstOrDefaultAsync(a => a.Id == exp.FinancialAccountId.Value)
                    : await ResolveFinancialAccountAsync(null, exp.PaymentMethod);
                if (acct != null)
                {
                    acct.CurrentBalance += exp.Amount;
                }

                if (!string.IsNullOrWhiteSpace(exp.ReferenceNo))
                {
                    var pairedLedgers = await _context.LedgerEntries
                        .Where(l => l.ReferenceNo == exp.ReferenceNo && !(l.Particulars ?? "").Contains("[Reversed"))
                        .ToListAsync();
                    foreach (var pl in pairedLedgers)
                    {
                        pl.Particulars = $"{pl.Particulars} [Reversed: {request.ReversalReason} by {request.AuthorizedBy}]".Trim();
                    }
                }

                _context.LedgerEntries.Add(new LedgerEntry
                {
                    TransactionDate = DateTime.UtcNow,
                    TransactionType = "Reversal",
                    Category = exp.Category,
                    ReferenceNo = $"REV-{(!string.IsNullOrWhiteSpace(exp.ExpenseNo) ? exp.ExpenseNo : exp.Id.ToString())}",
                    FinancialAccountId = acct?.Id,
                    Credit = exp.Amount,
                    Debit = 0m,
                    Balance = acct?.CurrentBalance ?? 0m,
                    Particulars = $"Expense Reversal ({exp.ExpenseNo}): {request.ReversalReason}",
                    AcademicYearId = exp.AcademicYearId,
                    BranchId = exp.BranchId
                });

                await _context.SaveChangesAsync();
                if (tx != null) await tx.CommitAsync();
                result = true;
            }
            else
            {
                var p = await _context.FeePayments.FirstOrDefaultAsync(fp => fp.Id == id);
                if (p == null || p.Status == "Cancelled" || p.Status == "Reversed") { result = false; return; }

                p.Status = "Cancelled";
                p.Remarks = $"{p.Remarks} [Reversed: {request.ReversalReason} by {request.AuthorizedBy}]".Trim();

                var assignment = await _context.StudentFeeAssignments
                    .FirstOrDefaultAsync(a => a.StudentId == p.StudentId && (a.Status == "Active" || string.IsNullOrEmpty(a.Status)));
                if (assignment != null && p.Amount > 0)
                {
                    assignment.PaidAmount = Math.Max(0m, assignment.PaidAmount - p.Amount);
                    assignment.DueAmount = Math.Max(0m, assignment.TotalAmount - assignment.PaidAmount);
                }

                var acct = await ResolveFinancialAccountAsync(null, p.PaymentMethod);
                if (acct != null && p.Amount > 0)
                {
                    acct.CurrentBalance -= p.Amount;
                }

                int.TryParse(p.StudentId, out int sId);
                _context.LedgerEntries.Add(new LedgerEntry
                {
                    TransactionDate = DateTime.UtcNow,
                    TransactionType = "Reversal",
                    Category = "Tuition & Academic Fees",
                    ReferenceNo = $"REV-{p.ReceiptNo}",
                    FinancialAccountId = acct?.Id,
                    StudentId = sId > 0 ? sId : null,
                    AdmissionNo = p.StudentId,
                    Debit = p.Amount > 0 ? p.Amount : 0m,
                    Credit = 0m,
                    Balance = acct?.CurrentBalance ?? 0m,
                    Particulars = $"Receipt Reversal ({p.ReceiptNo}): {request.ReversalReason}"
                });

                await _context.SaveChangesAsync();
                if (tx != null) await tx.CommitAsync();
                result = true;
            }
        });
        return result;
    }

    // =========================================================================
    // 2. BANK ACCOUNTS & CATEGORIES (PERSISTED IN MYSQL DATABASE)
    // =========================================================================

    public async Task<List<FinancialAccountDto>> GetAccountsAsync()
    {
        try
        {
            var dbAccounts = await _context.FinancialAccounts.AsNoTracking().ToListAsync();
            return dbAccounts.Select(a => new FinancialAccountDto
            {
                Id = a.Id,
                AccountName = a.Name ?? "",
                AccountType = a.Type ?? "Bank",
                AccountNumber = a.AccountNumberMasked ?? "",
                BankName = a.BankName ?? "",
                BranchName = string.Empty,
                CurrentBalance = a.CurrentBalance,
                Status = a.Status ?? "Active"
            }).ToList();
        }
        catch
        {
            return new List<FinancialAccountDto>();
        }
    }

    public async Task<FinancialAccountDto> CreateAccountAsync(FinancialAccountDto account)
    {
        var entity = new FinancialAccount
        {
            Name = account.AccountName,
            Type = account.AccountType ?? "Bank",
            AccountNumberMasked = account.AccountNumber ?? "",
            BankName = account.BankName ?? "",
            OpeningBalance = account.CurrentBalance,
            CurrentBalance = account.CurrentBalance,
            Status = account.Status ?? "Active"
        };
        _context.FinancialAccounts.Add(entity);
        await _context.SaveChangesAsync();
        account.Id = entity.Id;
        return account;
    }

    public async Task<bool> UpdateAccountAsync(int id, FinancialAccountDto account)
    {
        var existing = await _context.FinancialAccounts.FirstOrDefaultAsync(a => a.Id == id);
        if (existing == null) return false;

        existing.Name = account.AccountName;
        existing.Type = account.AccountType ?? existing.Type;
        existing.AccountNumberMasked = account.AccountNumber ?? existing.AccountNumberMasked;
        existing.BankName = account.BankName ?? existing.BankName;
        existing.CurrentBalance = account.CurrentBalance;
        existing.Status = account.Status ?? existing.Status;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAccountAsync(int id)
    {
        var existing = await _context.FinancialAccounts.FirstOrDefaultAsync(a => a.Id == id);
        if (existing == null) return false;

        try
        {
            var linkedExpenses = await _context.Expenses.Where(e => e.FinancialAccountId == id).ToListAsync();
            foreach (var exp in linkedExpenses)
            {
                exp.FinancialAccountId = null;
            }

            var linkedLedger = await _context.LedgerEntries.Where(l => l.FinancialAccountId == id).ToListAsync();
            foreach (var led in linkedLedger)
            {
                led.FinancialAccountId = null;
            }
        }
        catch { }

        _context.FinancialAccounts.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<FinancialCategoryDto>> GetCategoriesAsync(string? type)
    {
        var dbCategories = await _context.FinancialCategories.AsNoTracking().OrderBy(c => c.Id).ToListAsync();
        var feeHeadCats = await _context.FeeHeads.AsNoTracking().Select(f => f.Category).Where(c => !string.IsNullOrEmpty(c)).Distinct().ToListAsync();
        var expenseCats = await _context.Expenses.AsNoTracking().Select(e => e.Category).Where(c => !string.IsNullOrEmpty(c)).Distinct().ToListAsync();

        var categoriesList = dbCategories.Select(c => new FinancialCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Type = c.Type,
            SourceModule = c.SourceModule,
            Status = c.Status,
            IsSystem = c.IsSystem
        }).ToList();

        var existingNames = categoriesList
            .Select(c => $"{c.Type}:{c.Name}".ToLowerInvariant())
            .ToHashSet();

        // Synthetic system defaults use negative IDs so they never collide with persisted financial_categories rows.
        int syntheticId = -1;

        var systemIncome = new[] { "Tuition & Academic Fees", "Transport Fees", "Hostel & Residence Fees", "Uniform & Supplies Fees", "Donations & Grants" };
        foreach (var name in systemIncome.Concat(feeHeadCats).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (string.Equals(name, "Expense", StringComparison.OrdinalIgnoreCase)) continue;
            if (existingNames.Contains($"income:{name}".ToLowerInvariant())) continue;
            categoriesList.Add(new FinancialCategoryDto
            {
                Id = syntheticId--,
                Name = name,
                Type = "Income",
                SourceModule = name.Contains("Transport", StringComparison.OrdinalIgnoreCase) ? "Transport"
                    : name.Contains("Hostel", StringComparison.OrdinalIgnoreCase) ? "Hostel"
                    : name.Contains("Uniform", StringComparison.OrdinalIgnoreCase) ? "Uniform" : "Fees",
                Status = "Active",
                IsSystem = true
            });
        }

        var systemExpense = new[] { "Staff Salaries & Payroll", "Campus Maintenance & Repairs", "Utilities & Facilities" };
        foreach (var name in systemExpense.Concat(expenseCats).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (existingNames.Contains($"expense:{name}".ToLowerInvariant())) continue;
            categoriesList.Add(new FinancialCategoryDto
            {
                Id = syntheticId--,
                Name = name,
                Type = "Expense",
                SourceModule = name.Contains("Salaries", StringComparison.OrdinalIgnoreCase) || name.Contains("Payroll", StringComparison.OrdinalIgnoreCase) ? "Payroll" : "Expense",
                Status = "Active",
                IsSystem = true
            });
        }

        IEnumerable<FinancialCategoryDto> filtered = categoriesList;
        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            filtered = filtered.Where(c => c.Type.Equals(type, StringComparison.OrdinalIgnoreCase));

        return filtered.ToList();
    }

    public async Task<FinancialCategoryDto> CreateCategoryAsync(FinancialCategoryDto category)
    {
        var entity = new FinancialCategory
        {
            Name = category.Name?.Trim() ?? string.Empty,
            Type = string.IsNullOrWhiteSpace(category.Type) ? "Income" : category.Type.Trim(),
            SourceModule = string.IsNullOrWhiteSpace(category.SourceModule) ? "Manual" : category.SourceModule.Trim(),
            Status = string.IsNullOrWhiteSpace(category.Status) ? "Active" : category.Status.Trim(),
            IsSystem = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.FinancialCategories.Add(entity);
        await _context.SaveChangesAsync();

        return new FinancialCategoryDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Type = entity.Type,
            SourceModule = entity.SourceModule,
            Status = entity.Status,
            IsSystem = entity.IsSystem
        };
    }

    public async Task<bool> UpdateCategoryAsync(int id, FinancialCategoryDto category)
    {
        if (id <= 0) return false;
        var existing = await _context.FinancialCategories.FirstOrDefaultAsync(c => c.Id == id);
        if (existing == null || existing.IsSystem) return false;

        if (!string.IsNullOrWhiteSpace(category.Name)) existing.Name = category.Name.Trim();
        if (!string.IsNullOrWhiteSpace(category.Type)) existing.Type = category.Type.Trim();
        if (!string.IsNullOrWhiteSpace(category.SourceModule)) existing.SourceModule = category.SourceModule.Trim();
        if (!string.IsNullOrWhiteSpace(category.Status)) existing.Status = category.Status.Trim();

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteCategoryAsync(int id)
    {
        if (id <= 0) return false;
        var existing = await _context.FinancialCategories.FirstOrDefaultAsync(c => c.Id == id);
        if (existing == null || existing.IsSystem) return false;

        _context.FinancialCategories.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }

    // =========================================================================
    // 3. BUDGETS
    // =========================================================================

    private static (DateTime Start, DateTime End)? ParseAcademicYearDateRange(string? academicYear)
    {
        if (string.IsNullOrWhiteSpace(academicYear) ||
            academicYear.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            return null;

        var parts = academicYear.Trim().Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length >= 1 && int.TryParse(parts[0], out int startYear) && startYear >= 2000 && startYear <= 2100)
        {
            int endYear = startYear + 1;
            if (parts.Length >= 2 && int.TryParse(parts[1], out int parsedSecond))
            {
                endYear = parsedSecond < 100 ? (startYear / 100) * 100 + parsedSecond : parsedSecond;
            }
            else if (parts.Length == 1)
            {
                return (new DateTime(startYear, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                        new DateTime(startYear, 12, 31, 23, 59, 59, DateTimeKind.Utc));
            }
            return (new DateTime(startYear, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                    new DateTime(endYear, 3, 31, 23, 59, 59, DateTimeKind.Utc));
        }

        return null;
    }

    public async Task<List<FinancialBudgetDto>> GetBudgetsAsync(string? branch, string? academicYear)
    {
        var query = _context.FinancialBudgets.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(academicYear))
        {
            var ayClean = academicYear.Trim().Replace(" ", "");
            query = query.Where(b => b.AcademicYear == academicYear || b.AcademicYear.Replace(" ", "") == ayClean);
        }

        if (!string.IsNullOrWhiteSpace(branch) && !branch.Equals("All", StringComparison.OrdinalIgnoreCase) && !branch.Equals("All Branches", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(b => b.Branch == branch || b.Branch == "All" || b.Branch == "All Branches");
        }

        var dbBudgets = await query.ToListAsync();
        if (dbBudgets.Count == 0)
        {
            return new List<FinancialBudgetDto>();
        }

        var expensesQuery = _context.Expenses.AsNoTracking()
            .Where(e => e.Status != "Cancelled" && e.Status != "Reversed" && e.Status != "Rejected");

        var ledgerQuery = _context.LedgerEntries.AsNoTracking()
            .Where(l => l.Debit > 0 && l.TransactionType != "Reversal" && !l.Particulars.Contains("[Reversed"));

        var payslipsQuery = _context.Payslips.AsNoTracking()
            .Where(p => p.Status == "Paid" || p.Status == "Disbursed");

        if (!string.IsNullOrWhiteSpace(branch) && !branch.Equals("All", StringComparison.OrdinalIgnoreCase) && !branch.Equals("All Branches", StringComparison.OrdinalIgnoreCase))
        {
            var matchedBranch = await _context.Branches.AsNoTracking()
                .FirstOrDefaultAsync(b => b.BranchName == branch);
            if (matchedBranch != null)
            {
                expensesQuery = expensesQuery.Where(e => e.BranchId == matchedBranch.BranchId || e.BranchId == 0);
                ledgerQuery = ledgerQuery.Where(l => l.BranchId == matchedBranch.BranchId || l.BranchId == 0);
            }
            payslipsQuery = payslipsQuery.Where(p => p.Branch == branch || string.IsNullOrEmpty(p.Branch));
        }

        var expensesList = await expensesQuery.ToListAsync();
        var ledgerList = await ledgerQuery.ToListAsync();
        var payslipsList = await payslipsQuery.ToListAsync();

        // Deduplicate ledger entries that already mirror a persisted Expense row
        var expenseRefs = expensesList
            .Select(e => e.ReferenceNo)
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Concat(expensesList.Select(e => $"EXP-{e.Id}"))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var manualLedgerList = ledgerList
            .Where(l => string.IsNullOrWhiteSpace(l.ReferenceNo) || !expenseRefs.Contains(l.ReferenceNo))
            .ToList();

        var result = new List<FinancialBudgetDto>();

        foreach (var b in dbBudgets)
        {
            var ayRange = ParseAcademicYearDateRange(b.AcademicYear) ?? ParseAcademicYearDateRange(academicYear);

            var scopedExpenses = ayRange.HasValue
                ? expensesList.Where(e => e.Date >= ayRange.Value.Start && e.Date <= ayRange.Value.End)
                : expensesList;

            var scopedLedger = ayRange.HasValue
                ? manualLedgerList.Where(l => l.TransactionDate >= ayRange.Value.Start && l.TransactionDate <= ayRange.Value.End)
                : manualLedgerList;

            bool isPayroll = b.CategoryName.Contains("Salaries", StringComparison.OrdinalIgnoreCase) ||
                             b.CategoryName.Contains("Salary", StringComparison.OrdinalIgnoreCase) ||
                             b.CategoryName.Contains("Payroll", StringComparison.OrdinalIgnoreCase);

            decimal catExpenses = scopedExpenses
                .Where(e => string.Equals(e.Category, b.CategoryName, StringComparison.OrdinalIgnoreCase) ||
                            (!string.IsNullOrEmpty(e.Description) && e.Description.Contains(b.CategoryName, StringComparison.OrdinalIgnoreCase)))
                .Sum(e => e.Amount);

            decimal catManualLedger = scopedLedger
                .Where(l => string.Equals(l.Particulars, b.CategoryName, StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(l.Category, b.CategoryName, StringComparison.OrdinalIgnoreCase) ||
                            (!string.IsNullOrEmpty(l.Particulars) && l.Particulars.Contains(b.CategoryName, StringComparison.OrdinalIgnoreCase)))
                .Sum(l => l.Debit);

            decimal consumed = catExpenses + catManualLedger;

            if (isPayroll)
            {
                var scopedPayslips = ayRange.HasValue
                    ? payslipsList.Where(p =>
                    {
                        int year = Math.Clamp(p.Year, 2000, 2100);
                        DateTime payDate = DateTime.TryParse($"{p.Month} 1, {year}", out var parsed)
                            ? parsed
                            : (int.TryParse(p.Month, out int mNum) && mNum >= 1 && mNum <= 12
                                ? new DateTime(year, mNum, 1, 0, 0, 0, DateTimeKind.Utc)
                                : new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc));
                        return payDate >= ayRange.Value.Start && payDate <= ayRange.Value.End;
                    })
                    : payslipsList;
                consumed += scopedPayslips.Sum(p => p.NetPay);
            }

            result.Add(new FinancialBudgetDto
            {
                Id = b.Id,
                CategoryName = b.CategoryName,
                Department = b.Department ?? string.Empty,
                AcademicYear = b.AcademicYear,
                Branch = b.Branch,
                BranchId = b.BranchId,
                AllocatedAmount = b.AllocatedAmount,
                ConsumedAmount = consumed,
                Status = consumed > b.AllocatedAmount ? "Exceeded" : b.Status
            });
        }

        return result;
    }

    public async Task<FinancialBudgetDto> SaveBudgetAsync(FinancialBudgetDto budget)
    {
        var entity = new FinancialBudget
        {
            CategoryName = string.IsNullOrWhiteSpace(budget.CategoryName) ? (budget.Department ?? "General") : budget.CategoryName,
            Department = string.IsNullOrWhiteSpace(budget.Department) ? (budget.CategoryName ?? "General") : budget.Department,
            AcademicYear = string.IsNullOrWhiteSpace(budget.AcademicYear) ? "2026-27" : budget.AcademicYear,
            Branch = budget.Branch ?? string.Empty,
            BranchId = budget.BranchId,
            AllocatedAmount = budget.AllocatedAmount,
            Status = string.IsNullOrWhiteSpace(budget.Status) ? "Active" : budget.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (entity.BranchId == null && !string.IsNullOrWhiteSpace(entity.Branch))
        {
            var branch = await _context.Branches.AsNoTracking().FirstOrDefaultAsync(x => x.BranchName == entity.Branch);
            if (branch != null) entity.BranchId = branch.BranchId;
        }

        _context.FinancialBudgets.Add(entity);
        await _context.SaveChangesAsync();

        budget.Id = entity.Id;
        budget.AcademicYear = entity.AcademicYear;
        budget.Branch = entity.Branch;
        budget.BranchId = entity.BranchId;
        budget.ConsumedAmount = 0m;
        return budget;
    }

    public async Task<bool> UpdateBudgetAsync(int id, FinancialBudgetDto budget)
    {
        var entity = await _context.FinancialBudgets.FindAsync(id);
        if (entity == null)
        {
            entity = await _context.FinancialBudgets.FirstOrDefaultAsync(b => b.CategoryName == budget.CategoryName && b.AcademicYear == budget.AcademicYear);
            if (entity == null) return false;
        }

        if (!string.IsNullOrWhiteSpace(budget.CategoryName)) entity.CategoryName = budget.CategoryName;
        if (!string.IsNullOrWhiteSpace(budget.Department)) entity.Department = budget.Department;
        if (!string.IsNullOrWhiteSpace(budget.AcademicYear)) entity.AcademicYear = budget.AcademicYear;
        if (!string.IsNullOrWhiteSpace(budget.Branch)) entity.Branch = budget.Branch;
        if (budget.BranchId.HasValue) entity.BranchId = budget.BranchId.Value;
        if (budget.AllocatedAmount > 0) entity.AllocatedAmount = budget.AllocatedAmount;
        if (!string.IsNullOrWhiteSpace(budget.Status)) entity.Status = budget.Status;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteBudgetAsync(int id)
    {
        var entity = await _context.FinancialBudgets.FindAsync(id);
        if (entity == null) return false;

        _context.FinancialBudgets.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    // =========================================================================
    // 4. REFUND MANAGEMENT
    // =========================================================================

    public async Task<List<FeeRefundRequestDto>> GetRefundRequestsAsync(string? status)
    {
        var query = _context.FeeRefundRequests.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            string normalized = status.Trim();
            query = query.Where(r => r.Status.ToLower() == normalized.ToLower());
        }

        var dbRefunds = await query.OrderByDescending(r => r.RequestedDate).ToListAsync();

        return dbRefunds.Select(r => new FeeRefundRequestDto
        {
            Id = r.Id,
            RefundRequestId = r.RefundNo,
            RefundNo = r.RefundNo,
            ReceiptNo = r.ReceiptNo,
            StudentId = r.StudentId,
            AdmissionNo = r.AdmissionNo,
            StudentName = r.StudentName,
            ClassName = r.ClassName,
            Section = r.Section,
            RefundAmount = r.RefundAmount,
            Reason = r.Reason,
            Status = r.Status,
            RequestedBy = r.RequestedBy,
            ApprovedBy = r.ApprovedBy,
            RequestedDate = r.RequestedDate,
            ProcessedDate = r.ProcessedDate,
            PaymentMode = r.PaymentMode,
            Remarks = r.Remarks
        }).ToList();
    }

    public async Task<FeeRefundRequestDto> CreateRefundRequestAsync(CreateRefundRequestDto request)
    {
        if (request.RefundAmount <= 0)
            throw new ArgumentException("Refund amount must be greater than zero.", nameof(request));

        var st = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .FirstOrDefaultAsync(s => s.StudentId == request.StudentId || (!string.IsNullOrEmpty(request.AdmissionNo) && s.AdmissionNumber == request.AdmissionNo));

        string stName = !string.IsNullOrWhiteSpace(request.StudentName) ? request.StudentName : (st?.StudentName ?? $"Student #{request.StudentId}");
        string clsName = !string.IsNullOrWhiteSpace(request.ClassName) ? request.ClassName : (st?.ClassGrade?.ClassName ?? string.Empty);
        string sectionName = !string.IsNullOrWhiteSpace(request.Section) ? request.Section : (st?.ClassSection?.SectionName ?? string.Empty);

        var entity = new FeeRefundRequest
        {
            RefundNo = $"RF-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}",
            ReceiptNo = request.ReceiptNo ?? string.Empty,
            StudentId = st?.StudentId ?? request.StudentId,
            AdmissionNo = request.AdmissionNo ?? st?.AdmissionNumber ?? string.Empty,
            StudentName = stName,
            ClassName = clsName,
            Section = sectionName,
            RefundAmount = request.RefundAmount,
            Reason = request.Reason ?? string.Empty,
            Status = "Pending",
            RequestedBy = "Admin",
            ApprovedBy = string.Empty,
            RequestedDate = DateTime.UtcNow,
            PaymentMode = string.IsNullOrWhiteSpace(request.PaymentMode) ? "Bank Transfer" : request.PaymentMode,
            Remarks = request.Remarks ?? string.Empty
        };

        _context.FeeRefundRequests.Add(entity);
        await _context.SaveChangesAsync();

        // Assign deterministic refund number from identity ID
        entity.RefundNo = $"RF-{entity.RequestedDate.Year}-{entity.Id:D3}";
        await _context.SaveChangesAsync();

        return new FeeRefundRequestDto
        {
            Id = entity.Id,
            RefundRequestId = entity.RefundNo,
            RefundNo = entity.RefundNo,
            ReceiptNo = entity.ReceiptNo,
            StudentId = entity.StudentId,
            AdmissionNo = entity.AdmissionNo,
            StudentName = entity.StudentName,
            ClassName = entity.ClassName,
            Section = entity.Section,
            RefundAmount = entity.RefundAmount,
            Reason = entity.Reason,
            Status = entity.Status,
            RequestedBy = entity.RequestedBy,
            ApprovedBy = entity.ApprovedBy,
            RequestedDate = entity.RequestedDate,
            ProcessedDate = entity.ProcessedDate,
            PaymentMode = entity.PaymentMode,
            Remarks = entity.Remarks
        };
    }

    public async Task<bool> ProcessRefundRequestAsync(int id, ProcessRefundRequestDto request)
    {
        var entity = await _context.FeeRefundRequests.FirstOrDefaultAsync(r => r.Id == id);
        if (entity == null) return false;

        string targetStatus = string.IsNullOrWhiteSpace(request.Status) ? "Approved" : request.Status.Trim();
        if (string.Equals(entity.Status, "Rejected", StringComparison.OrdinalIgnoreCase))
            return false;

        bool alreadyDisbursed = await _context.LedgerEntries.AsNoTracking()
            .AnyAsync(l => l.ReferenceNo == entity.RefundNo && l.TransactionType == "Refund");

        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = _context.Database.IsRelational()
                ? await _context.Database.BeginTransactionAsync()
                : null;

            entity.Status = targetStatus;
            entity.ApprovedBy = string.IsNullOrWhiteSpace(request.ProcessedBy) ? "Admin" : request.ProcessedBy.Trim();
            entity.ProcessedDate = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(request.Remarks))
            {
                entity.Remarks = string.IsNullOrWhiteSpace(entity.Remarks)
                    ? request.Remarks.Trim()
                    : $"{entity.Remarks} | {request.Remarks.Trim()}";
            }

            if ((targetStatus.Equals("Approved", StringComparison.OrdinalIgnoreCase) ||
                 targetStatus.Equals("Disbursed", StringComparison.OrdinalIgnoreCase)) &&
                !alreadyDisbursed &&
                entity.RefundAmount > 0)
            {
                var acct = await ResolveFinancialAccountAsync(null, entity.PaymentMode);
                if (acct != null)
                {
                    acct.CurrentBalance -= entity.RefundAmount;
                }

                _context.LedgerEntries.Add(new LedgerEntry
                {
                    TransactionDate = DateTime.UtcNow,
                    TransactionType = "Refund",
                    Category = "Fee Refund",
                    Particulars = $"Fee Refund ({entity.RefundNo}) to {entity.StudentName} ({entity.ClassName}) — {entity.Reason}",
                    Debit = entity.RefundAmount,
                    Credit = 0m,
                    Balance = acct?.CurrentBalance ?? 0m,
                    ReferenceNo = entity.RefundNo,
                    FinancialAccountId = acct?.Id,
                    StudentId = entity.StudentId > 0 ? entity.StudentId : null,
                    AdmissionNo = entity.AdmissionNo
                });
            }

            await _context.SaveChangesAsync();
            if (tx != null) await tx.CommitAsync();
        });
        return true;
    }

    // =========================================================================
    // 5. FINANCE SETUP & SETTINGS (DATABASE PERSISTED)
    // =========================================================================

    public async Task<FeeScheduleConfigDto> GetFeeScheduleAsync(string? academicYear)
    {
        string ay = string.IsNullOrWhiteSpace(academicYear) ? string.Empty : academicYear.Trim();
        string ayCompact = ay.Replace(" ", "");
        string ayPrefix = ay.Contains('-') ? ay.Split('-')[0] : ay;

        AcademicYear? ayEntity = null;
        if (!string.IsNullOrWhiteSpace(ay))
        {
            ayEntity = await _context.AcademicYears.AsNoTracking()
                .FirstOrDefaultAsync(a => !a.IsDeleted && (
                    a.AcademicYearName == ay || 
                    a.AcademicYearName == ayCompact ||
                    (ay.Contains("-") && a.AcademicYearName.StartsWith(ayPrefix))
                ));
        }

        if (ayEntity == null)
        {
            ayEntity = await _context.AcademicYears.AsNoTracking()
                .FirstOrDefaultAsync(a => !a.IsDeleted && a.IsCurrent)
                ?? await _context.AcademicYears.AsNoTracking()
                .FirstOrDefaultAsync(a => !a.IsDeleted);
        }

        if (string.IsNullOrWhiteSpace(ay) && ayEntity != null)
        {
            ay = ayEntity.AcademicYearName;
            ayCompact = ay.Replace(" ", "");
            ayPrefix = ay.Contains('-') ? ay.Split('-')[0] : ay;
        }

        FeeSchedule? entity = null;
        if (!string.IsNullOrWhiteSpace(ay))
        {
            entity = await _context.FeeSchedules.AsNoTracking()
                .Include(s => s.Terms)
                .Include(s => s.MonthlyDates)
                .FirstOrDefaultAsync(s => 
                    s.AcademicYear == ay || 
                    s.AcademicYear == ayCompact ||
                    s.Id == $"SCH-{ay}" ||
                    (ay.Contains("-") && s.AcademicYear.StartsWith(ayPrefix))
                );
        }

        if (entity != null)
        {
            int offset = entity.DueDateOffsetDays >= 0 ? entity.DueDateOffsetDays : (entity.Terms != null && entity.Terms.Count > 0 && !string.IsNullOrWhiteSpace(entity.Terms.First().DueDate) && !string.IsNullOrWhiteSpace(entity.Terms.First().StartDate) && DateTime.TryParse(entity.Terms.First().DueDate, out var dtDue) && DateTime.TryParse(entity.Terms.First().StartDate, out var dtStart) ? Math.Max(0, (int)(dtDue - dtStart).TotalDays) : 0);
            var dbTermsDto = entity.Terms != null && entity.Terms.Count > 0
                ? entity.Terms.OrderBy(t => t.Sequence).Select(t => new FeeScheduleTermDto
                {
                    Id = t.Id,
                    Sequence = t.Sequence,
                    TermName = t.TermName,
                    StartDate = t.StartDate,
                    EndDate = t.EndDate,
                    DueDate = t.DueDate,
                    DueDateMode = string.IsNullOrWhiteSpace(t.DueDateMode) ? "AUTO" : t.DueDateMode,
                    DueDateOffsetDays = t.DueDateOffsetDays >= 0 ? t.DueDateOffsetDays : offset,
                    Status = t.Status,
                    PercentageShare = (double)t.PercentageShare
                }).ToList()
                : null;

            var calculatedTerms = ayEntity != null
                ? AcademicYearTermCalculator.GenerateTermsFromAcademicYear(ayEntity, entity.NumberOfTerms, offset, dbTermsDto)
                : (dbTermsDto ?? new List<FeeScheduleTermDto>());

            MonthlyDueDateConfigDto? monthly = null;
            if (entity.MonthlyDates != null && entity.MonthlyDates.Count > 0)
            {
                monthly = new MonthlyDueDateConfigDto
                {
                    ApplySameDayToAllMonths = entity.ApplySameDayToAllMonths,
                    DueDay = entity.MonthlyDueDay,
                    MonthDueDates = entity.MonthlyDates.OrderBy(m => m.MonthIndex).Select(m => new MonthDueDateItemDto
                    {
                        MonthIndex = m.MonthIndex,
                        MonthName = m.MonthName,
                        DueDate = m.DueDate
                    }).ToList()
                };
            }
            else if (!string.IsNullOrEmpty(entity.MonthlyConfigJson))
            {
                monthly = JsonSerializer.Deserialize<MonthlyDueDateConfigDto>(entity.MonthlyConfigJson);
            }
            else if (ayEntity != null)
            {
                monthly = AcademicYearTermCalculator.GenerateMonthlyDatesFromAcademicYear(ayEntity, entity.MonthlyDueDay > 0 ? entity.MonthlyDueDay : 10);
            }

            string fallbackDue = ayEntity != null ? ayEntity.StartDate.AddDays(offset).ToString("yyyy-MM-dd") : string.Empty;
            return new FeeScheduleConfigDto
            {
                Id = entity.Id,
                AcademicYear = entity.AcademicYear,
                NumberOfTerms = entity.NumberOfTerms,
                DueDateOffsetDays = offset,
                Status = entity.Status,
                AnnualDueDate = calculatedTerms.FirstOrDefault()?.DueDate ?? fallbackDue,
                OneTimeDueDate = string.IsNullOrWhiteSpace(entity.OneTimeDueDate) ? fallbackDue : entity.OneTimeDueDate,
                Terms = calculatedTerms,
                MonthlyConfig = monthly
            };
        }

        if (ayEntity == null)
        {
            return new FeeScheduleConfigDto
            {
                Id = string.IsNullOrWhiteSpace(ay) ? string.Empty : $"SCH-{ay}",
                AcademicYear = ay,
                NumberOfTerms = 0,
                DueDateOffsetDays = 0,
                Status = "Not Configured",
                AnnualDueDate = string.Empty,
                OneTimeDueDate = string.Empty,
                Terms = new List<FeeScheduleTermDto>(),
                MonthlyConfig = null
            };
        }

        int defaultOffset = 0;
        var generatedTerms = AcademicYearTermCalculator.GenerateTermsFromAcademicYear(ayEntity, 4, defaultOffset);
        var generatedMonthly = AcademicYearTermCalculator.GenerateMonthlyDatesFromAcademicYear(ayEntity, 10);
        string defaultDueDate = ayEntity.StartDate.AddDays(defaultOffset).ToString("yyyy-MM-dd");

        return new FeeScheduleConfigDto
        {
            Id = $"SCH-{ay}",
            AcademicYear = ay,
            NumberOfTerms = 4,
            DueDateOffsetDays = defaultOffset,
            Status = "Published",
            AnnualDueDate = generatedTerms.FirstOrDefault()?.DueDate ?? defaultDueDate,
            OneTimeDueDate = defaultDueDate,
            Terms = generatedTerms,
            MonthlyConfig = generatedMonthly
        };
    }

    public async Task<bool> SaveFeeScheduleAsync(FeeScheduleConfigDto schedule)
    {
        if (schedule == null) return false;
        string ay = string.IsNullOrWhiteSpace(schedule.AcademicYear) ? "2026-2027" : schedule.AcademicYear.Trim();
        string ayCompact = ay.Replace(" ", "");
        string ayPrefix = ay.Contains('-') ? ay.Split('-')[0] : ay;
        string sId = string.IsNullOrWhiteSpace(schedule.Id) ? $"SCH-{ay}" : schedule.Id;
        int offset = schedule.DueDateOffsetDays >= 0 ? schedule.DueDateOffsetDays : 0;

        var ayEntity = await _context.AcademicYears.AsNoTracking()
            .FirstOrDefaultAsync(a => !a.IsDeleted && (
                a.AcademicYearName == ay || 
                a.AcademicYearName == ayCompact ||
                (ay.Contains("-") && a.AcademicYearName.StartsWith(ayPrefix))
            ));

        if (ayEntity == null)
        {
            ayEntity = await _context.AcademicYears.AsNoTracking()
                .FirstOrDefaultAsync(a => !a.IsDeleted && a.IsCurrent)
                ?? await _context.AcademicYears.AsNoTracking()
                .FirstOrDefaultAsync(a => !a.IsDeleted);
        }

        if (ayEntity == null)
        {
            ayEntity = new AcademicYear
            {
                AcademicYearName = ay,
                StartDate = new DateTime(2026, 6, 1),
                EndDate = new DateTime(2027, 6, 1),
                IsActive = true
            };
        }

        var calculatedTerms = AcademicYearTermCalculator.GenerateTermsFromAcademicYear(ayEntity, schedule.NumberOfTerms, offset, schedule.Terms);

        var existing = await _context.FeeSchedules
            .Include(s => s.Terms)
            .Include(s => s.MonthlyDates)
            .FirstOrDefaultAsync(s => 
                s.AcademicYear == ay || 
                s.AcademicYear == ayCompact ||
                s.Id == sId ||
                (ay.Contains("-") && s.AcademicYear.StartsWith(ayPrefix))
            );

        bool applySameDay = schedule.MonthlyConfig?.ApplySameDayToAllMonths ?? true;
        int monthlyDueDay = schedule.MonthlyConfig?.DueDay ?? 10;
        string defaultDueDate = ayEntity.StartDate.AddDays(offset).ToString("yyyy-MM-dd");
        string annualDueDateVal = calculatedTerms.FirstOrDefault()?.DueDate ?? defaultDueDate;

        if (existing == null)
        {
            existing = new FeeSchedule
            {
                Id = sId,
                AcademicYear = ay,
                NumberOfTerms = schedule.NumberOfTerms,
                DueDateOffsetDays = offset,
                Status = string.IsNullOrWhiteSpace(schedule.Status) ? "Published" : schedule.Status,
                AnnualDueDate = annualDueDateVal,
                OneTimeDueDate = string.IsNullOrWhiteSpace(schedule.OneTimeDueDate) ? defaultDueDate : schedule.OneTimeDueDate,
                ApplySameDayToAllMonths = applySameDay,
                MonthlyDueDay = monthlyDueDay,
                TermsJson = null,
                MonthlyConfigJson = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _context.FeeSchedules.AddAsync(existing);
        }
        else
        {
            existing.NumberOfTerms = schedule.NumberOfTerms;
            existing.DueDateOffsetDays = offset;
            existing.Status = string.IsNullOrWhiteSpace(schedule.Status) ? "Published" : schedule.Status;
            existing.AnnualDueDate = annualDueDateVal;
            existing.OneTimeDueDate = string.IsNullOrWhiteSpace(schedule.OneTimeDueDate) ? defaultDueDate : schedule.OneTimeDueDate;
            existing.ApplySameDayToAllMonths = applySameDay;
            existing.MonthlyDueDay = monthlyDueDay;
            existing.TermsJson = null;
            existing.MonthlyConfigJson = null;
            existing.UpdatedAt = DateTime.UtcNow;
            sId = existing.Id;
        }

        var termsToSave = schedule.Terms != null && schedule.Terms.Count > 0 ? schedule.Terms : calculatedTerms;
        var targetSequences = termsToSave.Select(t => t.Sequence).ToHashSet();

        // Remove obsolete terms
        var termsToRemove = existing.Terms.Where(t => !targetSequences.Contains(t.Sequence)).ToList();
        foreach (var rem in termsToRemove)
        {
            existing.Terms.Remove(rem);
            _context.FeeScheduleTerms.Remove(rem);
        }

        // Update or insert terms via aggregate root collection
        foreach (var t in termsToSave)
        {
            var gen = calculatedTerms.FirstOrDefault(c => c.Sequence == t.Sequence);
            string startDate = gen?.StartDate ?? t.StartDate ?? ayEntity.StartDate.ToString("yyyy-MM-dd");
            string endDate = gen?.EndDate ?? t.EndDate ?? ayEntity.EndDate.ToString("yyyy-MM-dd");
            string dueDate = !string.IsNullOrWhiteSpace(t.DueDate) ? t.DueDate : (gen?.DueDate ?? startDate);
            string mode = string.IsNullOrWhiteSpace(t.DueDateMode) ? "AUTO" : t.DueDateMode;
            string termName = string.IsNullOrWhiteSpace(t.TermName) ? $"Term {t.Sequence}" : t.TermName;

            var existingTerm = existing.Terms.FirstOrDefault(x => x.Sequence == t.Sequence);
            if (existingTerm != null)
            {
                existingTerm.TermName = termName;
                existingTerm.StartDate = startDate;
                existingTerm.EndDate = endDate;
                existingTerm.DueDate = dueDate;
                existingTerm.DueDateMode = mode;
                existingTerm.DueDateOffsetDays = offset;
                existingTerm.PercentageShare = (decimal)t.PercentageShare;
                existingTerm.Status = string.IsNullOrWhiteSpace(t.Status) ? "Active" : t.Status;
                existingTerm.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                string termId = string.IsNullOrWhiteSpace(t.Id) ? $"T{t.Sequence}-{existing.AcademicYear}" : t.Id;
                var newTerm = new FeeScheduleTerm
                {
                    Id = termId,
                    FeeScheduleId = existing.Id,
                    Sequence = t.Sequence,
                    TermName = termName,
                    StartDate = startDate,
                    EndDate = endDate,
                    DueDate = dueDate,
                    DueDateMode = mode,
                    DueDateOffsetDays = offset,
                    PercentageShare = (decimal)t.PercentageShare,
                    Status = string.IsNullOrWhiteSpace(t.Status) ? "Active" : t.Status,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    FeeSchedule = existing
                };
                existing.Terms.Add(newTerm);
                await _context.FeeScheduleTerms.AddAsync(newTerm);
            }
        }

        // Update or insert monthly dates
        if (schedule.MonthlyConfig?.MonthDueDates != null && schedule.MonthlyConfig.MonthDueDates.Count > 0)
        {
            var targetMonthIndices = schedule.MonthlyConfig.MonthDueDates.Select(m => m.MonthIndex).ToHashSet();
            var monthsToRemove = existing.MonthlyDates.Where(m => !targetMonthIndices.Contains(m.MonthIndex)).ToList();
            foreach (var rem in monthsToRemove)
            {
                existing.MonthlyDates.Remove(rem);
                _context.FeeScheduleMonthlyDates.Remove(rem);
            }

            foreach (var m in schedule.MonthlyConfig.MonthDueDates)
            {
                var existingMonth = existing.MonthlyDates.FirstOrDefault(x => x.MonthIndex == m.MonthIndex);
                if (existingMonth != null)
                {
                    existingMonth.MonthName = m.MonthName ?? string.Empty;
                    existingMonth.DueDate = m.DueDate ?? string.Empty;
                    existingMonth.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    var newMonth = new FeeScheduleMonthlyDate
                    {
                        FeeScheduleId = existing.Id,
                        MonthIndex = m.MonthIndex,
                        MonthName = m.MonthName ?? string.Empty,
                        DueDate = m.DueDate ?? string.Empty,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        FeeSchedule = existing
                    };
                    existing.MonthlyDates.Add(newMonth);
                    await _context.FeeScheduleMonthlyDates.AddAsync(newMonth);
                }
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<FinanceSettingsDto> GetFinanceSettingsAsync()
    {
        var activeAy = await _context.AcademicYears.AsNoTracking().FirstOrDefaultAsync(a => !a.IsDeleted && a.IsActive);
        string activeAyName = activeAy?.AcademicYearName ?? string.Empty;

        var settingsRow = await _context.SchoolSettings.AsNoTracking().FirstOrDefaultAsync();
        if (settingsRow != null && !string.IsNullOrWhiteSpace(settingsRow.FinanceSettingsJson))
        {
            try
            {
                var saved = JsonSerializer.Deserialize<FinanceSettingsDto>(settingsRow.FinanceSettingsJson);
                if (saved != null)
                {
                    if (string.IsNullOrWhiteSpace(saved.AcademicYear) && !string.IsNullOrEmpty(activeAyName))
                    {
                        saved.AcademicYear = activeAyName;
                    }
                    if (string.IsNullOrWhiteSpace(saved.ActiveAcademicYear) && !string.IsNullOrEmpty(activeAyName))
                    {
                        saved.ActiveAcademicYear = activeAyName;
                    }
                    return saved;
                }
            }
            catch { }
        }

        return new FinanceSettingsDto
        {
            AcademicYear = activeAyName,
            ActiveAcademicYear = activeAyName,
            FinancialYear = activeAyName,
            Currency = "INR",
            DefaultCurrency = "INR",
            ReceiptPrefix = $"REC-{DateTime.UtcNow.Year}-",
            InvoicePrefix = $"INV-{DateTime.UtcNow.Year}-",
            AutoReceiptNo = true
        };
    }

    public async Task<bool> UpdateFinanceSettingsAsync(FinanceSettingsDto settings)
    {
        var row = await _context.SchoolSettings.FirstOrDefaultAsync();
        if (row == null)
        {
            row = new SchoolSettings { Id = 1 };
            _context.SchoolSettings.Add(row);
        }

        row.FinanceSettingsJson = JsonSerializer.Serialize(settings);
        row.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    // =========================================================================
    // 6. REPORTS HUB
    // =========================================================================

    public async Task<FinanceReportsSummaryDto> GetReportsSummaryAsync(string? academicYear)
    {
        var ayRange = ParseAcademicYearDateRange(academicYear);
        var validPayments = await _context.FeePayments.AsNoTracking()
            .Where(p => p.Status != "Cancelled" && p.Status != "Reversed" && p.Status != "Refunded" && p.Amount > 0)
            .ToListAsync();

        if (ayRange.HasValue)
        {
            validPayments = validPayments
                .Where(p => p.PaymentDate >= ayRange.Value.Start && p.PaymentDate <= ayRange.Value.End)
                .ToList();
        }

        DateTime today = DateTime.UtcNow.Date;
        decimal todayCollection = validPayments.Where(p => p.PaymentDate.Date == today).Sum(p => p.Amount);
        DateTime monthStart = new DateTime(today.Year, today.Month, 1);
        decimal monthlyCollection = validPayments.Where(p => p.PaymentDate >= monthStart).Sum(p => p.Amount);

        var dynamicStructures = await _context.DynamicFeeStructures.AsNoTracking().ToListAsync();
        if (!string.IsNullOrWhiteSpace(academicYear) && !academicYear.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var ayNorm = academicYear.Trim().Replace(" ", "");
            dynamicStructures = dynamicStructures
                .Where(s => string.IsNullOrEmpty(s.AcademicYear) || s.AcademicYear.Replace(" ", "").Equals(ayNorm, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        var validStructureIds = dynamicStructures.Select(d => d.Id).ToHashSet();
        var assignments = await _context.StudentFeeAssignments.AsNoTracking()
            .Where(a => !a.DynamicFeeStructureId.HasValue || validStructureIds.Contains(a.DynamicFeeStructureId.Value))
            .ToListAsync();

        decimal totalExpected = (dynamicStructures.Count > 0 && assignments.Count > 0) ? assignments.Sum(a => a.TotalAmount) : 0m;
        decimal totalCollected = validPayments.Sum(p => p.Amount);
        decimal pendingDues = assignments.Count > 0
            ? assignments.Sum(a => Math.Max(0m, a.TotalAmount - a.PaidAmount))
            : Math.Max(0m, totalExpected - totalCollected);

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

        var payments = await _context.FeePayments.AsNoTracking()
            .Where(p => p.Status != "Cancelled" && p.Status != "Reversed" && p.Status != "Refunded" && p.Amount > 0 && p.PaymentDate >= targetDate && p.PaymentDate < targetDate.AddDays(1))
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();
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
                ClassName = st?.ClassGrade?.ClassName ?? string.Empty,
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
        var ayRange = ParseAcademicYearDateRange(academicYear);
        var classes = await _context.Classes.AsNoTracking().ToListAsync();
        var students = await _context.Students.AsNoTracking().Where(s => !s.IsDeleted && s.Status == "Active").ToListAsync();
        var payments = await _context.FeePayments.AsNoTracking()
            .Where(p => p.Status != "Cancelled" && p.Status != "Reversed" && p.Status != "Refunded" && p.Amount > 0)
            .ToListAsync();

        if (ayRange.HasValue)
        {
            payments = payments
                .Where(p => p.PaymentDate >= ayRange.Value.Start && p.PaymentDate <= ayRange.Value.End)
                .ToList();
        }

        var structures = await _context.DynamicFeeStructures.AsNoTracking()
            .Where(s => s.Status == "Active" || string.IsNullOrEmpty(s.Status))
            .ToListAsync();

        var assignments = await _context.StudentFeeAssignments.AsNoTracking().ToListAsync();

        if (!string.IsNullOrWhiteSpace(academicYear) && !academicYear.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var ayNorm = academicYear.Trim().Replace(" ", "");
            structures = structures
                .Where(s => string.IsNullOrEmpty(s.AcademicYear) || s.AcademicYear.Replace(" ", "").Equals(ayNorm, StringComparison.OrdinalIgnoreCase))
                .ToList();
            var ayStructureIds = structures.Select(s => s.Id).ToHashSet();
            assignments = assignments
                .Where(a => !a.DynamicFeeStructureId.HasValue || ayStructureIds.Contains(a.DynamicFeeStructureId.Value))
                .ToList();
        }

        var result = new List<ClassWiseCollectionReportRowDto>();
        foreach (var cls in classes)
        {
            var classStudents = students.Where(s => s.ClassId == cls.ClassId).ToList();
            var studentIds = classStudents.Select(s => s.StudentId.ToString()).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var admNos = classStudents.Where(s => !string.IsNullOrEmpty(s.AdmissionNumber)).Select(s => s.AdmissionNumber!).ToHashSet(StringComparer.OrdinalIgnoreCase);

            var classPayments = payments.Where(p => studentIds.Contains(p.StudentId) || admNos.Contains(p.StudentId)).ToList();
            decimal collected = classPayments.Sum(p => p.Amount);

            var classAssignments = assignments.Where(a => studentIds.Contains(a.StudentId) || admNos.Contains(a.StudentId)).ToList();

            var matchedStructure = structures.FirstOrDefault(s =>
                !string.IsNullOrEmpty(s.ClassName) &&
                (s.ClassName.Equals(cls.ClassName, StringComparison.OrdinalIgnoreCase) ||
                 s.ClassName.Replace(" ", "").Equals(cls.ClassName?.Replace(" ", ""), StringComparison.OrdinalIgnoreCase)));

            decimal feePerStudent = matchedStructure?.TotalAmount ?? 0m;
            decimal expected = classAssignments.Count > 0 ? classAssignments.Sum(a => a.TotalAmount) : classStudents.Count * feePerStudent;
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

        string clsName = student?.ClassGrade?.ClassName ?? string.Empty;
        string secName = student?.ClassSection?.SectionName ?? string.Empty;
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

        string clsName = student?.ClassGrade?.ClassName ?? string.Empty;
        string secName = student?.ClassSection?.SectionName ?? string.Empty;
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
    // 8. LATE FINE RULES (PERSISTED IN MYSQL DATABASE)
    // =========================================================================

    public async Task<List<FineRuleDto>> GetFineRulesAsync(string? search, string? status)
    {
        var query = _context.FineRules.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            query = query.Where(x => x.RuleName.ToLower().Contains(s) || x.FineType.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            string normalized = status.Trim().ToLower();
            query = query.Where(x => x.Status.ToLower() == normalized);
        }

        var dbRules = await query.OrderBy(r => r.Id).ToListAsync();
        return dbRules.Select(MapFineRuleDto).ToList();
    }

    public async Task<FineRuleDto?> GetFineRuleByIdAsync(int id)
    {
        var entity = await _context.FineRules.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
        return entity == null ? null : MapFineRuleDto(entity);
    }

    public async Task<FineRuleDto> CreateFineRuleAsync(FineRuleDto rule)
    {
        var entity = new FineRule
        {
            RuleName = rule.RuleName?.Trim() ?? string.Empty,
            DueDate = string.IsNullOrWhiteSpace(rule.DueDate) ? "2026-08-15" : rule.DueDate.Trim(),
            GraceDays = Math.Max(0, rule.GraceDays),
            FineType = string.IsNullOrWhiteSpace(rule.FineType) ? "Daily Fine" : rule.FineType.Trim(),
            DailyFine = Math.Max(0m, rule.DailyFine),
            FixedFine = Math.Max(0m, rule.FixedFine),
            MaximumFine = Math.Max(0m, rule.MaximumFine),
            Status = string.IsNullOrWhiteSpace(rule.Status) ? "Active" : rule.Status.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.FineRules.Add(entity);
        await _context.SaveChangesAsync();
        return MapFineRuleDto(entity);
    }

    public async Task<FineRuleDto?> UpdateFineRuleAsync(int id, FineRuleDto rule)
    {
        var entity = await _context.FineRules.FirstOrDefaultAsync(r => r.Id == id);
        if (entity == null) return null;

        if (!string.IsNullOrWhiteSpace(rule.RuleName)) entity.RuleName = rule.RuleName.Trim();
        if (!string.IsNullOrWhiteSpace(rule.DueDate)) entity.DueDate = rule.DueDate.Trim();
        entity.GraceDays = Math.Max(0, rule.GraceDays);
        if (!string.IsNullOrWhiteSpace(rule.FineType)) entity.FineType = rule.FineType.Trim();
        entity.DailyFine = Math.Max(0m, rule.DailyFine);
        entity.FixedFine = Math.Max(0m, rule.FixedFine);
        entity.MaximumFine = Math.Max(0m, rule.MaximumFine);
        if (!string.IsNullOrWhiteSpace(rule.Status)) entity.Status = rule.Status.Trim();
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapFineRuleDto(entity);
    }

    public async Task<bool> DeleteFineRuleAsync(int id)
    {
        var entity = await _context.FineRules.FirstOrDefaultAsync(r => r.Id == id);
        if (entity == null) return false;

        _context.FineRules.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    private static FineRuleDto MapFineRuleDto(FineRule r) => new()
    {
        Id = r.Id,
        RuleName = r.RuleName,
        DueDate = r.DueDate,
        GraceDays = r.GraceDays,
        FineType = r.FineType,
        DailyFine = r.DailyFine,
        FixedFine = r.FixedFine,
        MaximumFine = r.MaximumFine,
        Status = r.Status
    };

    // =========================================================================
    // 9. HOSTEL FEE CONFIGURATIONS (PERSISTED IN MYSQL DATABASE)
    // =========================================================================

    public async Task<List<FinanceHostelConfigDto>> GetHostelFeeConfigsAsync(string? search, string? hostelId, string? status)
    {
        var query = _context.HostelFeeConfigs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(hostelId) && hostelId != "All")
        {
            query = query.Where(h => h.HostelId == hostelId);
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            query = query.Where(h => h.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(h =>
                (h.HostelName != null && h.HostelName.ToLower().Contains(s)) ||
                (h.RoomTypeName != null && h.RoomTypeName.ToLower().Contains(s)) ||
                (h.ClassRange != null && h.ClassRange.ToLower().Contains(s)) ||
                (h.RoomNo != null && h.RoomNo.ToLower().Contains(s)) ||
                (h.AcType != null && h.AcType.ToLower().Contains(s)) ||
                (h.SharingType != null && h.SharingType.ToLower().Contains(s)));
        }

        var entities = await query.OrderByDescending(h => h.Id).ToListAsync();

        return entities.Select(e => new FinanceHostelConfigDto
        {
            Id = e.Id,
            HostelId = e.HostelId,
            HostelName = e.HostelName,
            RoomTypeId = e.RoomTypeId,
            RoomTypeName = e.RoomTypeName,
            RoomId = e.RoomId,
            RoomNo = string.IsNullOrWhiteSpace(e.RoomNo) ? "All Rooms" : e.RoomNo,
            AcType = string.IsNullOrWhiteSpace(e.AcType) ? "All" : e.AcType,
            SharingType = string.IsNullOrWhiteSpace(e.SharingType) ? "All" : e.SharingType,
            StartClass = e.StartClass,
            EndClass = e.EndClass,
            ClassRange = e.ClassRange ?? (!string.IsNullOrWhiteSpace(e.StartClass) && !string.IsNullOrWhiteSpace(e.EndClass) ? $"{e.StartClass} - {e.EndClass}" : "All Classes"),
            ApplicableClasses = e.ApplicableClasses,
            AcademicYear = e.AcademicYear,
            Branch = e.Branch,
            FeePlan = e.FeePlan,
            HostelFee = e.HostelFee,
            SecurityDeposit = e.SecurityDeposit,
            ApplicableTerms = e.ApplicableTermsJson,
            EffectiveFrom = e.EffectiveFrom,
            Status = e.Status,
            CreatedAt = e.CreatedAt
        }).ToList();
    }

    public async Task<FinanceHostelConfigDto?> GetHostelFeeConfigByIdAsync(int id)
    {
        var e = await _context.HostelFeeConfigs.AsNoTracking().FirstOrDefaultAsync(h => h.Id == id);
        if (e == null) return null;

        return new FinanceHostelConfigDto
        {
            Id = e.Id,
            HostelId = e.HostelId,
            HostelName = e.HostelName,
            RoomTypeId = e.RoomTypeId,
            RoomTypeName = e.RoomTypeName,
            RoomId = e.RoomId,
            RoomNo = string.IsNullOrWhiteSpace(e.RoomNo) ? "All Rooms" : e.RoomNo,
            AcType = string.IsNullOrWhiteSpace(e.AcType) ? "All" : e.AcType,
            SharingType = string.IsNullOrWhiteSpace(e.SharingType) ? "All" : e.SharingType,
            StartClass = e.StartClass,
            EndClass = e.EndClass,
            ClassRange = e.ClassRange ?? (!string.IsNullOrWhiteSpace(e.StartClass) && !string.IsNullOrWhiteSpace(e.EndClass) ? $"{e.StartClass} - {e.EndClass}" : "All Classes"),
            ApplicableClasses = e.ApplicableClasses,
            AcademicYear = e.AcademicYear,
            Branch = e.Branch,
            FeePlan = e.FeePlan,
            HostelFee = e.HostelFee,
            SecurityDeposit = e.SecurityDeposit,
            ApplicableTerms = e.ApplicableTermsJson,
            EffectiveFrom = e.EffectiveFrom,
            Status = e.Status,
            CreatedAt = e.CreatedAt
        };
    }

    public async Task<FinanceHostelConfigDto> CreateHostelFeeConfigAsync(CreateFinanceHostelConfigDto dto)
    {
        var classRange = dto.ClassRange;
        if (string.IsNullOrWhiteSpace(classRange) && !string.IsNullOrWhiteSpace(dto.StartClass) && !string.IsNullOrWhiteSpace(dto.EndClass))
        {
            classRange = dto.StartClass == dto.EndClass ? dto.StartClass : $"{dto.StartClass} - {dto.EndClass}";
        }

        var entity = new SMS.Api.Models.FinanceManagement.HostelFeeConfig
        {
            HostelId = dto.HostelId,
            HostelName = dto.HostelName ?? string.Empty,
            RoomTypeId = dto.RoomTypeId ?? string.Empty,
            RoomTypeName = dto.RoomTypeName ?? string.Empty,
            RoomId = dto.RoomId,
            RoomNo = string.IsNullOrWhiteSpace(dto.RoomNo) ? "All Rooms" : dto.RoomNo,
            AcType = string.IsNullOrWhiteSpace(dto.AcType) ? "All" : dto.AcType,
            SharingType = string.IsNullOrWhiteSpace(dto.SharingType) ? "All" : dto.SharingType,
            StartClass = dto.StartClass,
            EndClass = dto.EndClass,
            ClassRange = classRange,
            ApplicableClasses = dto.ApplicableClasses,
            AcademicYear = string.IsNullOrWhiteSpace(dto.AcademicYear) ? "2025-2026" : dto.AcademicYear,
            Branch = dto.Branch ?? string.Empty,
            FeePlan = string.IsNullOrWhiteSpace(dto.FeePlan) ? "Annual" : dto.FeePlan,
            HostelFee = dto.HostelFee,
            SecurityDeposit = dto.SecurityDeposit,
            ApplicableTermsJson = dto.ApplicableTerms,
            EffectiveFrom = dto.EffectiveFrom ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.HostelFeeConfigs.Add(entity);
        await _context.SaveChangesAsync();

        // Also ensure a corresponding FeeHead with Category='Hostel' exists so standard fee reports recognize Hostel fees
        var headName = $"{entity.HostelName} Fee";
        var existingHead = await _context.FeeHeads.FirstOrDefaultAsync(f => f.Category == "Hostel" && f.Name == headName);
        if (existingHead == null)
        {
            string resolvedEligibility = string.Equals(entity.FeePlan, "Annual", StringComparison.OrdinalIgnoreCase) || string.Equals(entity.FeePlan, "One Time", StringComparison.OrdinalIgnoreCase)
                ? "One-Time Only"
                : string.Equals(entity.FeePlan, "Both One-Time and Term-Wise", StringComparison.OrdinalIgnoreCase)
                    ? "Both One-Time and Term-Wise"
                    : "Term-Wise Allowed";
            _context.FeeHeads.Add(new FeeHead
            {
                Name = headName,
                Code = $"HST-{entity.HostelId}",
                Category = "Hostel",
                Frequency = entity.FeePlan,
                DefaultAmount = entity.HostelFee,
                Status = "Active",
                HostelConfigJson = JsonSerializer.Serialize(new
                {
                    applicableBranches = new[] { string.IsNullOrWhiteSpace(entity.Branch) ? "All Branches" : entity.Branch },
                    paymentEligibility = resolvedEligibility,
                    applicableTerms = Array.Empty<string>()
                })
            });
            await _context.SaveChangesAsync();
        }

        return new FinanceHostelConfigDto
        {
            Id = entity.Id,
            HostelId = entity.HostelId,
            HostelName = entity.HostelName,
            RoomTypeId = entity.RoomTypeId,
            RoomTypeName = entity.RoomTypeName,
            RoomId = entity.RoomId,
            RoomNo = entity.RoomNo,
            AcType = entity.AcType,
            SharingType = entity.SharingType,
            StartClass = entity.StartClass,
            EndClass = entity.EndClass,
            ClassRange = entity.ClassRange,
            ApplicableClasses = entity.ApplicableClasses,
            AcademicYear = entity.AcademicYear,
            Branch = entity.Branch,
            FeePlan = entity.FeePlan,
            HostelFee = entity.HostelFee,
            SecurityDeposit = entity.SecurityDeposit,
            ApplicableTerms = entity.ApplicableTermsJson,
            EffectiveFrom = entity.EffectiveFrom,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt
        };
    }

    public async Task<FinanceHostelConfigDto?> UpdateHostelFeeConfigAsync(int id, CreateFinanceHostelConfigDto dto)
    {
        var entity = await _context.HostelFeeConfigs.FirstOrDefaultAsync(h => h.Id == id);
        if (entity == null) return null;

        var classRange = dto.ClassRange;
        if (string.IsNullOrWhiteSpace(classRange) && !string.IsNullOrWhiteSpace(dto.StartClass) && !string.IsNullOrWhiteSpace(dto.EndClass))
        {
            classRange = dto.StartClass == dto.EndClass ? dto.StartClass : $"{dto.StartClass} - {dto.EndClass}";
        }

        entity.HostelId = dto.HostelId;
        entity.HostelName = dto.HostelName ?? entity.HostelName;
        entity.RoomTypeId = dto.RoomTypeId ?? entity.RoomTypeId;
        entity.RoomTypeName = dto.RoomTypeName ?? entity.RoomTypeName;
        entity.RoomId = dto.RoomId;
        entity.RoomNo = string.IsNullOrWhiteSpace(dto.RoomNo) ? "All Rooms" : dto.RoomNo;
        entity.AcType = string.IsNullOrWhiteSpace(dto.AcType) ? entity.AcType : dto.AcType;
        entity.SharingType = string.IsNullOrWhiteSpace(dto.SharingType) ? entity.SharingType : dto.SharingType;
        entity.StartClass = dto.StartClass;
        entity.EndClass = dto.EndClass;
        entity.ClassRange = classRange;
        entity.ApplicableClasses = dto.ApplicableClasses;
        entity.AcademicYear = string.IsNullOrWhiteSpace(dto.AcademicYear) ? entity.AcademicYear : dto.AcademicYear;
        entity.Branch = dto.Branch ?? entity.Branch;
        entity.FeePlan = string.IsNullOrWhiteSpace(dto.FeePlan) ? entity.FeePlan : dto.FeePlan;
        entity.HostelFee = dto.HostelFee;
        entity.SecurityDeposit = dto.SecurityDeposit;
        entity.ApplicableTermsJson = dto.ApplicableTerms;
        entity.EffectiveFrom = dto.EffectiveFrom ?? entity.EffectiveFrom;
        entity.Status = string.IsNullOrWhiteSpace(dto.Status) ? entity.Status : dto.Status;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new FinanceHostelConfigDto
        {
            Id = entity.Id,
            HostelId = entity.HostelId,
            HostelName = entity.HostelName,
            RoomTypeId = entity.RoomTypeId,
            RoomTypeName = entity.RoomTypeName,
            RoomId = entity.RoomId,
            RoomNo = entity.RoomNo,
            AcType = entity.AcType,
            SharingType = entity.SharingType,
            StartClass = entity.StartClass,
            EndClass = entity.EndClass,
            ClassRange = entity.ClassRange,
            ApplicableClasses = entity.ApplicableClasses,
            AcademicYear = entity.AcademicYear,
            Branch = entity.Branch,
            FeePlan = entity.FeePlan,
            HostelFee = entity.HostelFee,
            SecurityDeposit = entity.SecurityDeposit,
            ApplicableTerms = entity.ApplicableTermsJson,
            EffectiveFrom = entity.EffectiveFrom,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt
        };
    }

    public async Task<bool> DeleteHostelFeeConfigAsync(int id)
    {
        var entity = await _context.HostelFeeConfigs.FirstOrDefaultAsync(h => h.Id == id);
        if (entity != null)
        {
            _context.HostelFeeConfigs.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }
        return false;
    }

    // =========================================================================
    // 10. UNIFORM FEE CONFIGURATIONS (PERSISTED IN MYSQL DATABASE)
    // =========================================================================

    public async Task<List<FinanceUniformConfigDto>> GetUniformFeeConfigsAsync(string? search, string? className, string? academicYear, string? status)
    {
        var query = _context.UniformFeeConfigs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(u => u.ClassName.ToLower().Contains(s) ||
                                     u.PackageOrItemName.ToLower().Contains(s) ||
                                     (u.Gender != null && u.Gender.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(className) && !string.Equals(className.Trim(), "All Classes", StringComparison.OrdinalIgnoreCase))
        {
            var c = className.Trim().ToLower();
            query = query.Where(u => u.ClassName.ToLower() == c);
        }

        if (!string.IsNullOrWhiteSpace(academicYear) && !string.Equals(academicYear.Trim(), "All Years", StringComparison.OrdinalIgnoreCase))
        {
            var ay = academicYear.Trim().ToLower();
            query = query.Where(u => u.AcademicYear != null && u.AcademicYear.ToLower() == ay);
        }

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status.Trim(), "All Status", StringComparison.OrdinalIgnoreCase))
        {
            var st = status.Trim().ToLower();
            query = query.Where(u => u.Status != null && u.Status.ToLower() == st);
        }

        var dbItems = await query.OrderByDescending(u => u.Id).ToListAsync();

        return dbItems.Select(u => new FinanceUniformConfigDto
        {
            Id = u.Id,
            AcademicYear = u.AcademicYear ?? string.Empty,
            Branch = u.Branch ?? string.Empty,
            ClassName = u.ClassName,
            Gender = u.Gender ?? "Unisex",
            UniformPackage = u.PackageOrItemName,
            UniformItemId = u.UniformItemId,
            FeePlan = u.FeePlan ?? "Annual",
            FeeAmount = u.FeeAmount,
            EffectiveFrom = u.EffectiveFrom ?? string.Empty,
            Status = u.Status ?? "Active"
        }).ToList();
    }

    public async Task<FinanceUniformConfigDto?> GetUniformFeeConfigByIdAsync(int id)
    {
        var u = await _context.UniformFeeConfigs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (u == null) return null;

        return new FinanceUniformConfigDto
        {
            Id = u.Id,
            AcademicYear = u.AcademicYear ?? string.Empty,
            Branch = u.Branch ?? string.Empty,
            ClassName = u.ClassName,
            Gender = u.Gender ?? "Unisex",
            UniformPackage = u.PackageOrItemName,
            UniformItemId = u.UniformItemId,
            FeePlan = u.FeePlan ?? "Annual",
            FeeAmount = u.FeeAmount,
            EffectiveFrom = u.EffectiveFrom ?? string.Empty,
            Status = u.Status ?? "Active"
        };
    }

    public async Task<FinanceUniformConfigDto> CreateUniformFeeConfigAsync(CreateFinanceUniformConfigDto dto)
    {
        var entity = new UniformFeeConfig
        {
            AcademicYear = dto.AcademicYear?.Trim() ?? string.Empty,
            Branch = dto.Branch?.Trim() ?? string.Empty,
            ClassName = dto.ClassName?.Trim() ?? string.Empty,
            Gender = dto.Gender?.Trim() ?? "Unisex",
            PackageOrItemName = dto.UniformPackage?.Trim() ?? string.Empty,
            UniformItemId = dto.UniformItemId?.Trim() ?? string.Empty,
            FeePlan = dto.FeePlan?.Trim() ?? "Annual",
            FeeAmount = dto.FeeAmount >= 0 ? dto.FeeAmount : 0m,
            EffectiveFrom = dto.EffectiveFrom?.Trim() ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Status = dto.Status?.Trim() ?? "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.UniformFeeConfigs.Add(entity);
        await _context.SaveChangesAsync();

        return new FinanceUniformConfigDto
        {
            Id = entity.Id,
            AcademicYear = entity.AcademicYear,
            Branch = entity.Branch,
            ClassName = entity.ClassName,
            Gender = entity.Gender,
            UniformPackage = entity.PackageOrItemName,
            UniformItemId = entity.UniformItemId,
            FeePlan = entity.FeePlan,
            FeeAmount = entity.FeeAmount,
            EffectiveFrom = entity.EffectiveFrom,
            Status = entity.Status
        };
    }

    public async Task<FinanceUniformConfigDto?> UpdateUniformFeeConfigAsync(int id, CreateFinanceUniformConfigDto dto)
    {
        var entity = await _context.UniformFeeConfigs.FirstOrDefaultAsync(u => u.Id == id);
        if (entity == null) return null;

        if (dto.AcademicYear != null) entity.AcademicYear = dto.AcademicYear.Trim();
        if (dto.Branch != null) entity.Branch = dto.Branch.Trim();
        if (!string.IsNullOrWhiteSpace(dto.ClassName)) entity.ClassName = dto.ClassName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Gender)) entity.Gender = dto.Gender.Trim();
        if (!string.IsNullOrWhiteSpace(dto.UniformPackage)) entity.PackageOrItemName = dto.UniformPackage.Trim();
        if (dto.UniformItemId != null) entity.UniformItemId = dto.UniformItemId.Trim();
        if (!string.IsNullOrWhiteSpace(dto.FeePlan)) entity.FeePlan = dto.FeePlan.Trim();
        if (dto.FeeAmount >= 0) entity.FeeAmount = dto.FeeAmount;
        if (dto.EffectiveFrom != null) entity.EffectiveFrom = dto.EffectiveFrom.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Status)) entity.Status = dto.Status.Trim();
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new FinanceUniformConfigDto
        {
            Id = entity.Id,
            AcademicYear = entity.AcademicYear ?? string.Empty,
            Branch = entity.Branch ?? string.Empty,
            ClassName = entity.ClassName,
            Gender = entity.Gender ?? "Unisex",
            UniformPackage = entity.PackageOrItemName,
            UniformItemId = entity.UniformItemId,
            FeePlan = entity.FeePlan ?? "Annual",
            FeeAmount = entity.FeeAmount,
            EffectiveFrom = entity.EffectiveFrom ?? string.Empty,
            Status = entity.Status ?? "Active"
        };
    }

    public async Task<bool> DeleteUniformFeeConfigAsync(int id)
    {
        var entity = await _context.UniformFeeConfigs.FirstOrDefaultAsync(u => u.Id == id);
        if (entity != null)
        {
            _context.UniformFeeConfigs.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }
        return false;
    }
}