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

    public async Task<List<FinanceTransactionDto>> GetTransactionsAsync(
        string? search, string? type, string? module, string? category, string? paymentMode, string? status, int page, int pageSize)
    {
        var result = new List<FinanceTransactionDto>();

        // 1. FeePayments -> Income Transactions
        var payments = await _context.FeePayments.AsNoTracking().ToListAsync();
        var students = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .ToListAsync();

        foreach (var p in payments)
        {
            var st = students.FirstOrDefault(s => s.StudentId.ToString() == p.StudentId || s.AdmissionNumber == p.StudentId);
            string stName = st?.StudentName ?? (p.StudentId != null ? $"Student #{p.StudentId}" : "Student");
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
                Account = (p.PaymentMethod == "Cash") ? "School Petty Cash" : "Main Bank Account",
                TransactionDate = p.PaymentDate,
                Status = p.Status == "Cancelled" ? "Cancelled" : "Completed",
                ReferenceNumber = p.TransactionId ?? "",
                CreatedBy = "Accounts Counter",
                Branch = "Main Campus",
                AcademicYear = "2026-2027"
            });
        }

        // 2. LedgerEntries -> Manual General Ledger Transactions
        var dbLedgers = await _context.LedgerEntries.AsNoTracking().ToListAsync();
        foreach (var l in dbLedgers)
        {
            result.Add(new FinanceTransactionDto
            {
                Id = 10000 + l.Id,
                TransactionId = $"TXN-LED-{l.Id:D4}",
                Type = l.Credit > 0 ? "Income" : "Expense",
                SourceModule = "Manual",
                Category = l.Category ?? "General",
                Description = l.Particulars ?? "Ledger Transaction",
                Amount = l.Credit > 0 ? l.Credit : l.Debit,
                PaymentMode = "Bank Transfer",
                Account = "Main Bank Account",
                TransactionDate = l.TransactionDate,
                Status = "Completed",
                ReferenceNumber = l.ReferenceNo ?? "",
                CreatedBy = "Admin",
                Branch = "Main Campus",
                AcademicYear = "2026-2027",
                Notes = l.Particulars ?? ""
            });
        }

        // 3. Expenses -> Expense Transactions
        var dbExpenses = await _context.Expenses.AsNoTracking().ToListAsync();
        foreach (var e in dbExpenses)
        {
            result.Add(new FinanceTransactionDto
            {
                Id = 20000 + e.Id,
                TransactionId = !string.IsNullOrEmpty(e.ExpenseNo) ? e.ExpenseNo : $"TXN-EXP-{e.Id:D4}",
                Type = "Expense",
                SourceModule = "Expense",
                Category = e.Category ?? "Campus Maintenance & Repairs",
                Description = e.Description ?? "Campus Expense",
                Amount = e.Amount,
                PaymentMode = e.PaymentMethod ?? "Bank Transfer",
                Account = "Main Bank Account",
                TransactionDate = e.Date,
                Status = e.Status ?? "Completed",
                ReferenceNumber = e.ReferenceNo ?? "",
                CreatedBy = "Admin",
                Branch = "Main Campus",
                AcademicYear = "2026-2027",
                Notes = e.Vendor ?? ""
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
        var allTxns = await GetTransactionsAsync(null, null, null, null, null, null, 1, 10000);
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

    public async Task<FinanceTransactionDto> CreateTransactionAsync(CreateTransactionRequestDto request)
    {
        int branchId = 0;
        if (!string.IsNullOrWhiteSpace(request.Branch))
        {
            var dbBr = await _context.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.BranchName == request.Branch);
            if (dbBr != null) branchId = dbBr.BranchId;
        }

        var ledgerEntry = new LedgerEntry
        {
            TransactionDate = DateTime.TryParse(request.TransactionDate, out var dt) ? dt : DateTime.UtcNow,
            TransactionType = request.SourceModule ?? "Manual",
            Category = !string.IsNullOrWhiteSpace(request.Category) ? request.Category : (request.Type == "Income" ? "Income" : "Expense"),
            Particulars = request.Description ?? "Manual Transaction",
            Credit = request.Type == "Income" ? request.Amount : 0m,
            Debit = request.Type == "Expense" ? request.Amount : 0m,
            ReferenceNo = $"REF-{Random.Shared.Next(10000, 99999)}",
            AdmissionNo = request.Account ?? "Main Bank Account",
            BranchId = branchId
        };

        _context.LedgerEntries.Add(ledgerEntry);

        if (request.Type == "Expense")
        {
            var expense = new Expense
            {
                ExpenseNo = $"EXP-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
                Date = ledgerEntry.TransactionDate,
                Category = !string.IsNullOrWhiteSpace(request.Category) ? request.Category : "General",
                Vendor = request.Description ?? "General Vendor",
                Description = request.Description ?? "Manual Expense Entry",
                Amount = request.Amount,
                PaymentMethod = request.PaymentMode ?? "Bank Transfer",
                ReferenceNo = ledgerEntry.ReferenceNo,
                Status = "Approved",
                BranchId = branchId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Expenses.Add(expense);
        }

        await _context.SaveChangesAsync();

        return new FinanceTransactionDto
        {
            Id = 10000 + ledgerEntry.Id,
            TransactionId = $"TXN-LED-{ledgerEntry.Id:D4}",
            Type = request.Type ?? "Income",
            SourceModule = request.SourceModule ?? "Manual",
            Category = request.Category ?? "General",
            Description = ledgerEntry.Particulars,
            Amount = request.Amount,
            PaymentMode = request.PaymentMode ?? "Bank Transfer",
            Account = request.Account ?? "Main Bank Account",
            TransactionDate = ledgerEntry.TransactionDate,
            Status = "Completed",
            ReferenceNumber = ledgerEntry.ReferenceNo,
            CreatedBy = "Admin",
            Branch = request.Branch ?? "Main Campus",
            AcademicYear = request.AcademicYear ?? "2026-2027",
            Notes = request.Notes ?? "",
            AttachmentName = request.AttachmentName ?? ""
        };
    }

    public async Task<bool> ReverseTransactionAsync(int id, ReverseTransactionRequestDto request)
    {
        if (id >= 10000 && id < 20000)
        {
            int realId = id - 10000;
            var entry = await _context.LedgerEntries.FirstOrDefaultAsync(l => l.Id == realId);
            if (entry != null)
            {
                entry.Particulars = $"{entry.Particulars} [Reversed: {request.ReversalReason} by {request.AuthorizedBy}]".Trim();
                await _context.SaveChangesAsync();
                return true;
            }
        }
        else if (id >= 20000)
        {
            int realId = id - 20000;
            var exp = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == realId);
            if (exp != null)
            {
                exp.Status = "Reversed";
                await _context.SaveChangesAsync();
                return true;
            }
        }
        else
        {
            var p = await _context.FeePayments.FirstOrDefaultAsync(fp => fp.Id == id);
            if (p != null)
            {
                p.Status = "Cancelled";
                p.Remarks = $"{p.Remarks} [Reversed: {request.ReversalReason} by {request.AuthorizedBy}]".Trim();
                await _context.SaveChangesAsync();
                return true;
            }
        }
        return false;
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
                BranchName = "Main Campus",
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
        var feeHeadCats = await _context.FeeHeads.AsNoTracking().Select(f => f.Category).Where(c => !string.IsNullOrEmpty(c)).Distinct().ToListAsync();
        var expenseCats = await _context.Expenses.AsNoTracking().Select(e => e.Category).Where(c => !string.IsNullOrEmpty(c)).Distinct().ToListAsync();

        var categoriesList = new List<FinancialCategoryDto>();
        int idCounter = 1;

        var systemIncome = new[] { "Tuition & Academic Fees", "Transport Fees", "Hostel & Residence Fees", "Uniform & Supplies Fees", "Donations & Grants" };
        foreach (var name in systemIncome.Concat(feeHeadCats).Distinct())
        {
            categoriesList.Add(new FinancialCategoryDto
            {
                Id = idCounter++,
                Name = name,
                Type = "Income",
                SourceModule = name.Contains("Transport") ? "Transport" : name.Contains("Hostel") ? "Hostel" : name.Contains("Uniform") ? "Uniform" : "Fees",
                Status = "Active",
                IsSystem = true
            });
        }

        var systemExpense = new[] { "Staff Salaries & Payroll", "Campus Maintenance & Repairs", "Utilities & Facilities" };
        foreach (var name in systemExpense.Concat(expenseCats).Distinct())
        {
            categoriesList.Add(new FinancialCategoryDto
            {
                Id = idCounter++,
                Name = name,
                Type = "Expense",
                SourceModule = name.Contains("Salaries") || name.Contains("Payroll") ? "Payroll" : "Expense",
                Status = "Active",
                IsSystem = true
            });
        }

        var list = categoriesList.AsQueryable();
        if (!string.IsNullOrWhiteSpace(type) && !type.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            list = list.Where(c => c.Type.Equals(type, StringComparison.OrdinalIgnoreCase));

        return list.ToList();
    }

    public async Task<FinancialCategoryDto> CreateCategoryAsync(FinancialCategoryDto category)
    {
        var feeHead = new FeeHead
        {
            Name = category.Name,
            Category = category.Type == "Expense" ? "Expense" : "General",
            Frequency = "Annual",
            Mandatory = true,
            DefaultAmount = 0m,
            Status = "Active"
        };
        _context.FeeHeads.Add(feeHead);
        await _context.SaveChangesAsync();
        category.Id = feeHead.Id;
        return category;
    }

    public async Task<bool> UpdateCategoryAsync(int id, FinancialCategoryDto category)
    {
        var feeHead = await _context.FeeHeads.FirstOrDefaultAsync(f => f.Id == id);
        if (feeHead != null)
        {
            feeHead.Name = category.Name;
            feeHead.Category = category.Type ?? feeHead.Category;
            await _context.SaveChangesAsync();
            return true;
        }
        return true;
    }

    public async Task<bool> DeleteCategoryAsync(int id)
    {
        var feeHead = await _context.FeeHeads.FirstOrDefaultAsync(f => f.Id == id);
        if (feeHead != null)
        {
            var headIdStr = id.ToString();
            var headName = feeHead.Name?.Trim();

            var structures = await _context.DynamicFeeStructures.ToListAsync();
            foreach (var s in structures)
            {
                if (string.IsNullOrWhiteSpace(s.ItemsJson))
                    continue;

                try
                {
                    var items = JsonSerializer.Deserialize<List<FeeStructureItemDto>>(s.ItemsJson);
                    if (items != null && items.Count > 0)
                    {
                        var remainingItems = items.Where(i =>
                            !string.Equals(i.FeeHeadId, headIdStr, StringComparison.OrdinalIgnoreCase) &&
                            (string.IsNullOrEmpty(headName) || !string.Equals(i.FeeHeadName?.Trim(), headName, StringComparison.OrdinalIgnoreCase))
                        ).ToList();

                        if (remainingItems.Count != items.Count)
                        {
                            var cat = (s.TargetAudience ?? "").Trim().ToLowerInvariant();
                            bool isTuitionOrOthers = cat == "" || cat == "tuition" || cat == "tuition fee" || cat == "others" || cat == "other" || cat == "general";

                            if (remainingItems.Count == 0 && isTuitionOrOthers)
                            {
                                _context.DynamicFeeStructures.Remove(s);
                            }
                            else
                            {
                                s.ItemsJson = JsonSerializer.Serialize(remainingItems);
                                s.TotalAmount = remainingItems.Sum(x => x.Amount);
                                _context.DynamicFeeStructures.Update(s);
                            }
                        }
                    }
                }
                catch { }
            }

            _context.FeeHeads.Remove(feeHead);
            await _context.SaveChangesAsync();
            return true;
        }
        return true;
    }

    // =========================================================================
    // 3. BUDGETS
    // =========================================================================

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

        // Fetch real expenses, ledger entries, and payslips to aggregate actual consumed amounts
        var expensesQuery = _context.Expenses.AsNoTracking()
            .Where(e => e.Status != "Cancelled" && e.Status != "Reversed" && e.Status != "Rejected");

        var ledgerQuery = _context.LedgerEntries.AsNoTracking()
            .Where(l => l.Debit > 0 && !l.Particulars.Contains("[Reversed"));

        var payslipsQuery = _context.Payslips.AsNoTracking()
            .Where(p => p.Status == "Paid" || p.Status == "Disbursed");

        // Filter by branch if specific branch provided
        if (!string.IsNullOrWhiteSpace(branch) && !branch.Equals("All", StringComparison.OrdinalIgnoreCase))
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

        var result = new List<FinancialBudgetDto>();

        foreach (var b in dbBudgets)
        {
            bool isPayroll = b.CategoryName.Contains("Salaries", StringComparison.OrdinalIgnoreCase) ||
                             b.CategoryName.Contains("Salary", StringComparison.OrdinalIgnoreCase) ||
                             b.CategoryName.Contains("Payroll", StringComparison.OrdinalIgnoreCase);

            decimal catExpenses = expensesList
                .Where(e => string.Equals(e.Category, b.CategoryName, StringComparison.OrdinalIgnoreCase) ||
                            (!string.IsNullOrEmpty(e.Description) && e.Description.Contains(b.CategoryName, StringComparison.OrdinalIgnoreCase)))
                .Sum(e => e.Amount);

            decimal catLedger = ledgerList
                .Where(l => string.Equals(l.Particulars, b.CategoryName, StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(l.Category, b.CategoryName, StringComparison.OrdinalIgnoreCase) ||
                            (!string.IsNullOrEmpty(l.Particulars) && l.Particulars.Contains(b.CategoryName, StringComparison.OrdinalIgnoreCase)))
                .Sum(l => l.Debit);

            decimal consumed = Math.Max(catExpenses, catLedger);

            if (isPayroll)
            {
                var payrollSum = payslipsList.Sum(p => p.NetPay);
                consumed += payrollSum;
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
            Branch = string.IsNullOrWhiteSpace(budget.Branch) ? "Madhapur Branch" : budget.Branch,
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
        var dbRefunds = await _context.LedgerEntries.AsNoTracking()
            .Where(l => l.Category == "Fee Refund")
            .ToListAsync();

        var list = new List<FeeRefundRequestDto>();
        foreach (var r in dbRefunds)
        {
            int sId = r.StudentId ?? 0;
            list.Add(new FeeRefundRequestDto
            {
                Id = r.Id,
                RefundRequestId = $"RF-2026-{r.Id:D3}",
                RefundNo = $"RF-2026-{r.Id:D3}",
                ReceiptNo = r.ReferenceNo ?? "",
                StudentId = sId,
                AdmissionNo = r.AdmissionNo ?? "",
                StudentName = r.Particulars ?? "Student",
                ClassName = "Class 10",
                Section = "A",
                RefundAmount = r.Debit > 0 ? r.Debit : r.Credit,
                Reason = r.Particulars ?? "Scholarship Adjustment",
                Status = "Pending",
                RequestedBy = "Admin",
                RequestedDate = r.TransactionDate,
                PaymentMode = "Bank Transfer",
                Remarks = r.Particulars ?? ""
            });
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            list = list.Where(r => r.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();

        return list.OrderByDescending(r => r.RequestedDate).ToList();
    }

    public async Task<FeeRefundRequestDto> CreateRefundRequestAsync(CreateRefundRequestDto request)
    {
        var st = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .FirstOrDefaultAsync(s => s.StudentId == request.StudentId || (s.AdmissionNumber != null && s.AdmissionNumber == request.AdmissionNo));

        string stName = !string.IsNullOrWhiteSpace(request.StudentName) ? request.StudentName : (st?.StudentName ?? $"Student #{request.StudentId}");
        string clsName = !string.IsNullOrWhiteSpace(request.ClassName) ? request.ClassName : (st?.ClassGrade?.ClassName ?? "Class 10");

        var refundEntry = new LedgerEntry
        {
            TransactionDate = DateTime.UtcNow,
            TransactionType = "Refund",
            Category = "Fee Refund",
            Particulars = $"Refund to {stName} ({clsName}) — {request.Reason}",
            Debit = request.RefundAmount,
            Credit = 0m,
            ReferenceNo = request.ReceiptNo ?? "",
            StudentId = request.StudentId,
            AdmissionNo = request.AdmissionNo ?? st?.AdmissionNumber ?? ""
        };

        _context.LedgerEntries.Add(refundEntry);
        await _context.SaveChangesAsync();

        return new FeeRefundRequestDto
        {
            Id = refundEntry.Id,
            RefundRequestId = $"RF-2026-{refundEntry.Id:D3}",
            RefundNo = $"RF-2026-{refundEntry.Id:D3}",
            ReceiptNo = refundEntry.ReferenceNo,
            StudentId = request.StudentId,
            AdmissionNo = request.AdmissionNo ?? st?.AdmissionNumber ?? "",
            StudentName = stName,
            ClassName = clsName,
            Section = request.Section ?? "A",
            RefundAmount = request.RefundAmount,
            Reason = request.Reason,
            Status = "Pending",
            RequestedBy = "Admin",
            RequestedDate = refundEntry.TransactionDate,
            PaymentMode = request.PaymentMode ?? "Bank Transfer",
            Remarks = request.Remarks ?? ""
        };
    }

    public async Task<bool> ProcessRefundRequestAsync(int id, ProcessRefundRequestDto request)
    {
        var entry = await _context.LedgerEntries.FirstOrDefaultAsync(l => l.Id == id && l.Category == "Fee Refund");
        if (entry != null)
        {
            entry.Particulars = $"{entry.Particulars} [Processed by {request.ProcessedBy}: {request.Remarks}]".Trim();
            await _context.SaveChangesAsync();
            return true;
        }
        return false;
    }

    // =========================================================================
    // 5. FINANCE SETUP & SETTINGS (DATABASE PERSISTED)
    // =========================================================================

    public async Task<FeeScheduleConfigDto> GetFeeScheduleAsync(string? academicYear)
    {
        string ay = string.IsNullOrWhiteSpace(academicYear) ? "2026-2027" : academicYear.Trim();

        var ayEntity = await _context.AcademicYears.AsNoTracking()
            .FirstOrDefaultAsync(a => !a.IsDeleted && (a.AcademicYearName == ay || a.AcademicYearName == ay.Replace(" ", "")));

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

        var entity = await _context.FeeSchedules.AsNoTracking()
            .Include(s => s.Terms)
            .Include(s => s.MonthlyDates)
            .FirstOrDefaultAsync(s => s.AcademicYear == ay);

        if (entity != null)
        {
            int offset = entity.DueDateOffsetDays > 0 ? entity.DueDateOffsetDays : 45;
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
                    DueDateOffsetDays = t.DueDateOffsetDays > 0 ? t.DueDateOffsetDays : offset,
                    Status = t.Status,
                    PercentageShare = (double)t.PercentageShare
                }).ToList()
                : null;

            var calculatedTerms = AcademicYearTermCalculator.GenerateTermsFromAcademicYear(ayEntity, entity.NumberOfTerms, offset, dbTermsDto);

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
            else
            {
                monthly = AcademicYearTermCalculator.GenerateMonthlyDatesFromAcademicYear(ayEntity, entity.MonthlyDueDay > 0 ? entity.MonthlyDueDay : 10);
            }

            return new FeeScheduleConfigDto
            {
                Id = entity.Id,
                AcademicYear = entity.AcademicYear,
                NumberOfTerms = entity.NumberOfTerms,
                DueDateOffsetDays = offset,
                Status = entity.Status,
                AnnualDueDate = calculatedTerms.FirstOrDefault()?.DueDate ?? ayEntity.StartDate.AddDays(offset).ToString("yyyy-MM-dd"),
                OneTimeDueDate = string.IsNullOrWhiteSpace(entity.OneTimeDueDate) ? ayEntity.StartDate.AddDays(offset).ToString("yyyy-MM-dd") : entity.OneTimeDueDate,
                Terms = calculatedTerms,
                MonthlyConfig = monthly
            };
        }

        int defaultOffset = 45;
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
        string sId = string.IsNullOrWhiteSpace(schedule.Id) ? $"SCH-{ay}" : schedule.Id;
        int offset = schedule.DueDateOffsetDays > 0 ? schedule.DueDateOffsetDays : 45;

        var ayEntity = await _context.AcademicYears.AsNoTracking()
            .FirstOrDefaultAsync(a => !a.IsDeleted && (a.AcademicYearName == ay || a.AcademicYearName == ay.Replace(" ", "")));

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
            .FirstOrDefaultAsync(s => s.AcademicYear == ay || s.Id == sId);

        bool applySameDay = schedule.MonthlyConfig?.ApplySameDayToAllMonths ?? true;
        int monthlyDueDay = schedule.MonthlyConfig?.DueDay ?? 10;
        string defaultDueDate = ayEntity.StartDate.AddDays(offset).ToString("yyyy-MM-dd");
        string annualDueDateVal = calculatedTerms.FirstOrDefault()?.DueDate ?? defaultDueDate;

        if (existing != null)
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
            _context.FeeSchedules.Update(existing);
        }
        else
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

        var oldTerms = await _context.FeeScheduleTerms.Where(t => t.FeeScheduleId == sId).ToListAsync();
        if (oldTerms.Count > 0)
        {
            _context.FeeScheduleTerms.RemoveRange(oldTerms);
        }

        var termsToSave = schedule.Terms != null && schedule.Terms.Count > 0 ? schedule.Terms : calculatedTerms;
        foreach (var t in termsToSave)
        {
            var gen = calculatedTerms.FirstOrDefault(c => c.Sequence == t.Sequence);
            string startDate = gen?.StartDate ?? t.StartDate ?? ayEntity.StartDate.ToString("yyyy-MM-dd");
            string endDate = gen?.EndDate ?? t.EndDate ?? ayEntity.EndDate.ToString("yyyy-MM-dd");
            string dueDate = !string.IsNullOrWhiteSpace(t.DueDate) ? t.DueDate : (gen?.DueDate ?? startDate);
            string mode = string.IsNullOrWhiteSpace(t.DueDateMode) ? "AUTO" : t.DueDateMode;

            string termId = string.IsNullOrWhiteSpace(t.Id) ? $"T{t.Sequence}-{ay}" : t.Id;
            var termEntity = new FeeScheduleTerm
            {
                Id = termId,
                FeeScheduleId = sId,
                Sequence = t.Sequence,
                TermName = string.IsNullOrWhiteSpace(t.TermName) ? $"Term {t.Sequence}" : t.TermName,
                StartDate = startDate,
                EndDate = endDate,
                DueDate = dueDate,
                DueDateMode = mode,
                DueDateOffsetDays = offset,
                PercentageShare = (decimal)t.PercentageShare,
                Status = string.IsNullOrWhiteSpace(t.Status) ? "Active" : t.Status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _context.FeeScheduleTerms.AddAsync(termEntity);
        }

        var oldMonths = await _context.FeeScheduleMonthlyDates.Where(m => m.FeeScheduleId == sId).ToListAsync();
        if (oldMonths.Count > 0)
        {
            _context.FeeScheduleMonthlyDates.RemoveRange(oldMonths);
        }

        if (schedule.MonthlyConfig?.MonthDueDates != null && schedule.MonthlyConfig.MonthDueDates.Count > 0)
        {
            foreach (var m in schedule.MonthlyConfig.MonthDueDates)
            {
                var monthEntity = new FeeScheduleMonthlyDate
                {
                    FeeScheduleId = sId,
                    MonthIndex = m.MonthIndex,
                    MonthName = m.MonthName ?? string.Empty,
                    DueDate = m.DueDate ?? string.Empty,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.FeeScheduleMonthlyDates.AddAsync(monthEntity);
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<FinanceSettingsDto> GetFinanceSettingsAsync()
    {
        var activeAy = await _context.AcademicYears.AsNoTracking().FirstOrDefaultAsync(a => !a.IsDeleted && a.IsActive);
        return new FinanceSettingsDto
        {
            AcademicYear = activeAy?.AcademicYearName ?? "2026-2027",
            Currency = "INR",
            ReceiptPrefix = "REC-2026-",
            AutoReceiptNo = true
        };
    }

    public async Task<bool> UpdateFinanceSettingsAsync(FinanceSettingsDto settings)
    {
        return await Task.FromResult(true);
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

        var dynamicStructures = await _context.DynamicFeeStructures.AsNoTracking().ToListAsync();
        var validStructureIds = dynamicStructures.Select(d => d.Id).ToHashSet();
        var assignments = await _context.StudentFeeAssignments.AsNoTracking()
            .Where(a => !a.DynamicFeeStructureId.HasValue || validStructureIds.Contains(a.DynamicFeeStructureId.Value))
            .ToListAsync();
        decimal totalExpected = (dynamicStructures.Count > 0 && assignments.Count > 0) ? assignments.Sum(a => a.TotalAmount) : 0m;
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
        var structures = await _context.DynamicFeeStructures.AsNoTracking()
            .Where(s => s.Status == "Active" || string.IsNullOrEmpty(s.Status))
            .ToListAsync();

        var result = new List<ClassWiseCollectionReportRowDto>();
        foreach (var cls in classes)
        {
            var classStudents = students.Where(s => s.ClassId == cls.ClassId).ToList();
            var studentIds = classStudents.Select(s => s.StudentId.ToString()).ToList();
            var admNos = classStudents.Where(s => !string.IsNullOrEmpty(s.AdmissionNumber)).Select(s => s.AdmissionNumber!).ToList();

            var classPayments = payments.Where(p => studentIds.Contains(p.StudentId) || admNos.Contains(p.StudentId)).ToList();
            decimal collected = classPayments.Sum(p => p.Amount);

            var matchedStructure = structures.FirstOrDefault(s =>
                !string.IsNullOrEmpty(s.ClassName) &&
                (s.ClassName.Equals(cls.ClassName, StringComparison.OrdinalIgnoreCase) ||
                 s.ClassName.Replace(" ", "").Equals(cls.ClassName?.Replace(" ", ""), StringComparison.OrdinalIgnoreCase)));

            decimal feePerStudent = matchedStructure?.TotalAmount ?? 0m;
            decimal expected = classStudents.Count * feePerStudent;
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
    // 8. LATE FINE RULES (PERSISTED IN MYSQL DATABASE)
    // =========================================================================

    public async Task<List<FineRuleDto>> GetFineRulesAsync(string? search, string? status)
    {
        var dbRules = await _context.ConcessionRules.AsNoTracking().Where(c => c.Type == "Fine").ToListAsync();
        var list = new List<FineRuleDto>();
        foreach (var r in dbRules)
        {
            list.Add(new FineRuleDto
            {
                Id = r.Id,
                RuleName = r.Name ?? "Late Fee Penalty",
                FineType = r.DiscountType ?? "Daily Fine",
                DailyFine = r.Value,
                FixedFine = r.Value,
                MaximumFine = r.Value * 10,
                GraceDays = 5,
                Status = r.Status ?? "Active"
            });
        }

        if (list.Count == 0)
        {
            list.Add(new FineRuleDto
            {
                Id = 1,
                RuleName = "Standard Late Payment Fine",
                FineType = "Daily Fine",
                DailyFine = 50m,
                FixedFine = 200m,
                MaximumFine = 1000m,
                GraceDays = 5,
                Status = "Active"
            });
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            list = list.Where(x => x.RuleName.ToLower().Contains(s) || x.FineType.ToLower().Contains(s)).ToList();
        }
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            list = list.Where(x => x.Status.Equals(status, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }
        return list;
    }

    public async Task<FineRuleDto?> GetFineRuleByIdAsync(int id)
    {
        var rules = await GetFineRulesAsync(null, null);
        return rules.FirstOrDefault(r => r.Id == id);
    }

    public async Task<FineRuleDto> CreateFineRuleAsync(FineRuleDto rule)
    {
        var entity = new ConcessionRule
        {
            Name = rule.RuleName,
            Type = "Fine",
            DiscountType = rule.FineType ?? "Daily Fine",
            Value = rule.DailyFine,
            Status = rule.Status ?? "Active",
            CreatedAt = DateTime.UtcNow
        };
        _context.ConcessionRules.Add(entity);
        await _context.SaveChangesAsync();
        rule.Id = entity.Id;
        return rule;
    }

    public async Task<FineRuleDto?> UpdateFineRuleAsync(int id, FineRuleDto rule)
    {
        var entity = await _context.ConcessionRules.FirstOrDefaultAsync(c => c.Id == id && c.Type == "Fine");
        if (entity != null)
        {
            entity.Name = rule.RuleName;
            entity.DiscountType = rule.FineType ?? entity.DiscountType;
            entity.Value = rule.DailyFine;
            entity.Status = rule.Status ?? entity.Status;
            await _context.SaveChangesAsync();
            return rule;
        }
        return rule;
    }

    public async Task<bool> DeleteFineRuleAsync(int id)
    {
        var entity = await _context.ConcessionRules.FirstOrDefaultAsync(c => c.Id == id && c.Type == "Fine");
        if (entity != null)
        {
            _context.ConcessionRules.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }
        return true;
    }

    // =========================================================================
    // 9. HOSTEL FEE CONFIGURATIONS (PERSISTED IN MYSQL DATABASE)
    // =========================================================================

    public async Task<List<FinanceHostelConfigDto>> GetHostelFeeConfigsAsync(string? search, string? hostelId, string? status)
    {
        var dbFeeHeads = await _context.FeeHeads.AsNoTracking().Where(f => f.Category == "Hostel").ToListAsync();
        var list = new List<FinanceHostelConfigDto>();
        foreach (var fh in dbFeeHeads)
        {
            list.Add(new FinanceHostelConfigDto
            {
                Id = fh.Id,
                HostelId = "HOS-01",
                HostelName = fh.Name ?? "Main Campus Hostel",
                RoomTypeId = "RT-01",
                RoomTypeName = "Double Occupancy Non-AC",
                RoomId = "RM-101",
                RoomNo = "101",
                FeePlan = fh.Frequency ?? "Term Wise",
                HostelFee = fh.DefaultAmount,
                SecurityDeposit = 5000m,
                EffectiveFrom = "2026-06-01",
                Status = "Active"
            });
        }

        return list;
    }

    public async Task<FinanceHostelConfigDto?> GetHostelFeeConfigByIdAsync(int id)
    {
        var list = await GetHostelFeeConfigsAsync(null, null, null);
        return list.FirstOrDefault(h => h.Id == id);
    }

    public async Task<FinanceHostelConfigDto> CreateHostelFeeConfigAsync(CreateFinanceHostelConfigDto dto)
    {
        var feeHead = new FeeHead
        {
            Name = $"{dto.HostelName} - {dto.RoomTypeName}",
            Category = "Hostel",
            Frequency = dto.FeePlan ?? "Annual",
            Mandatory = false,
            DefaultAmount = dto.HostelFee,
            Status = "Active"
        };
        _context.FeeHeads.Add(feeHead);
        await _context.SaveChangesAsync();

        return new FinanceHostelConfigDto
        {
            Id = feeHead.Id,
            HostelId = dto.HostelId,
            HostelName = dto.HostelName,
            RoomTypeId = dto.RoomTypeId,
            RoomTypeName = dto.RoomTypeName,
            RoomId = dto.RoomId ?? "",
            RoomNo = dto.RoomNo ?? "All Rooms",
            FeePlan = dto.FeePlan ?? "",
            HostelFee = dto.HostelFee,
            SecurityDeposit = dto.SecurityDeposit,
            EffectiveFrom = dto.EffectiveFrom ?? DateTime.Now.ToString("yyyy-MM-dd"),
            Status = dto.Status
        };
    }

    public async Task<FinanceHostelConfigDto?> UpdateHostelFeeConfigAsync(int id, CreateFinanceHostelConfigDto dto)
    {
        var feeHead = await _context.FeeHeads.FirstOrDefaultAsync(f => f.Id == id && f.Category == "Hostel");
        if (feeHead != null)
        {
            feeHead.Name = $"{dto.HostelName} - {dto.RoomTypeName}";
            feeHead.DefaultAmount = dto.HostelFee;
            feeHead.Frequency = dto.FeePlan ?? feeHead.Frequency;
            await _context.SaveChangesAsync();
        }

        return new FinanceHostelConfigDto
        {
            Id = id,
            HostelId = dto.HostelId,
            HostelName = dto.HostelName,
            RoomTypeId = dto.RoomTypeId,
            RoomTypeName = dto.RoomTypeName,
            RoomId = dto.RoomId ?? "",
            RoomNo = dto.RoomNo ?? "All Rooms",
            FeePlan = dto.FeePlan ?? "",
            HostelFee = dto.HostelFee,
            SecurityDeposit = dto.SecurityDeposit,
            EffectiveFrom = dto.EffectiveFrom ?? DateTime.Now.ToString("yyyy-MM-dd"),
            Status = dto.Status
        };
    }

    public async Task<bool> DeleteHostelFeeConfigAsync(int id)
    {
        var feeHead = await _context.FeeHeads.FirstOrDefaultAsync(f => f.Id == id && f.Category == "Hostel");
        if (feeHead != null)
        {
            _context.FeeHeads.Remove(feeHead);
            await _context.SaveChangesAsync();
            return true;
        }
        return true;
    }

    // =========================================================================
    // 10. UNIFORM FEE CONFIGURATIONS (PERSISTED IN MYSQL DATABASE)
    // =========================================================================

    public async Task<List<FinanceUniformConfigDto>> GetUniformFeeConfigsAsync(string? search, string? className, string? academicYear, string? status)
    {
        var dbFeeHeads = await _context.FeeHeads.AsNoTracking().Where(f => f.Category == "Uniform").ToListAsync();
        var list = new List<FinanceUniformConfigDto>();
        foreach (var fh in dbFeeHeads)
        {
            list.Add(new FinanceUniformConfigDto
            {
                Id = fh.Id,
                AcademicYear = "2026-2027",
                Branch = "Main Campus",
                ClassName = "All Classes",
                Gender = "Unisex",
                UniformPackage = fh.Name ?? "Full Uniform Set",
                UniformItemId = "UNI-SET",
                FeePlan = "Annual",
                FeeAmount = fh.DefaultAmount,
                EffectiveFrom = "2026-06-01",
                Status = "Active"
            });
        }

        return list;
    }

    public async Task<FinanceUniformConfigDto?> GetUniformFeeConfigByIdAsync(int id)
    {
        var list = await GetUniformFeeConfigsAsync(null, null, null, null);
        return list.FirstOrDefault(u => u.Id == id);
    }

    public async Task<FinanceUniformConfigDto> CreateUniformFeeConfigAsync(CreateFinanceUniformConfigDto dto)
    {
        var feeHead = new FeeHead
        {
            Name = dto.UniformPackage ?? "Uniform Set",
            Category = "Uniform",
            Frequency = dto.FeePlan ?? "Annual",
            Mandatory = false,
            DefaultAmount = dto.FeeAmount,
            Status = "Active"
        };
        _context.FeeHeads.Add(feeHead);
        await _context.SaveChangesAsync();

        return new FinanceUniformConfigDto
        {
            Id = feeHead.Id,
            AcademicYear = dto.AcademicYear ?? "2026-2027",
            Branch = dto.Branch ?? "Main Campus",
            ClassName = dto.ClassName,
            Gender = dto.Gender,
            UniformPackage = dto.UniformPackage ?? "",
            UniformItemId = dto.UniformItemId,
            FeePlan = dto.FeePlan ?? "Annual",
            FeeAmount = dto.FeeAmount,
            EffectiveFrom = dto.EffectiveFrom ?? DateTime.Now.ToString("yyyy-MM-dd"),
            Status = dto.Status
        };
    }

    public async Task<FinanceUniformConfigDto?> UpdateUniformFeeConfigAsync(int id, CreateFinanceUniformConfigDto dto)
    {
        var feeHead = await _context.FeeHeads.FirstOrDefaultAsync(f => f.Id == id && f.Category == "Uniform");
        if (feeHead != null)
        {
            feeHead.Name = dto.UniformPackage ?? feeHead.Name;
            feeHead.DefaultAmount = dto.FeeAmount;
            feeHead.Frequency = dto.FeePlan ?? feeHead.Frequency;
            await _context.SaveChangesAsync();
        }

        return new FinanceUniformConfigDto
        {
            Id = id,
            AcademicYear = dto.AcademicYear ?? "2026-2027",
            Branch = dto.Branch ?? "Main Campus",
            ClassName = dto.ClassName,
            Gender = dto.Gender,
            UniformPackage = dto.UniformPackage ?? "",
            UniformItemId = dto.UniformItemId,
            FeePlan = dto.FeePlan ?? "Annual",
            FeeAmount = dto.FeeAmount,
            EffectiveFrom = dto.EffectiveFrom ?? DateTime.Now.ToString("yyyy-MM-dd"),
            Status = dto.Status
        };
    }

    public async Task<bool> DeleteUniformFeeConfigAsync(int id)
    {
        var feeHead = await _context.FeeHeads.FirstOrDefaultAsync(f => f.Id == id && f.Category == "Uniform");
        if (feeHead != null)
        {
            _context.FeeHeads.Remove(feeHead);
            await _context.SaveChangesAsync();
            return true;
        }
        return true;
    }
}