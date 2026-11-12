namespace Backend.Tests.Repositories;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Implementations.FinanceManagement;
using Xunit;

public class FinanceMasterRepositoryTests
{
    private static AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAndGetTransactions_DoesNotDoubleCountManualExpense_AndUpdatesBalance()
    {
        using var db = GetInMemoryDbContext();
        var account = new FinancialAccount
        {
            Name = "Main Bank Account",
            Type = "Bank",
            OpeningBalance = 50000m,
            CurrentBalance = 50000m,
            Status = "Active"
        };
        db.FinancialAccounts.Add(account);
        await db.SaveChangesAsync();

        var repo = new FinanceMasterRepository(db);

        var created = await repo.CreateTransactionAsync(new CreateTransactionRequestDto
        {
            Type = "Expense",
            Category = "Utilities & Facilities",
            Description = "Electricity Bill",
            Amount = 4500m,
            PaymentMode = "Bank Transfer",
            Account = "Main Bank Account",
            TransactionDate = DateTime.UtcNow.ToString("yyyy-MM-dd")
        });

        Assert.Equal("Expense", created.Type);
        Assert.Equal(4500m, created.Amount);

        var updatedAccount = await db.FinancialAccounts.FirstAsync(a => a.Id == account.Id);
        Assert.Equal(45500m, updatedAccount.CurrentBalance);

        var list = await repo.GetTransactionsAsync(null, null, null, null, null, null, 1, 50);
        Assert.Single(list);
        Assert.Equal(4500m, list[0].Amount);

        var summary = await repo.GetTransactionSummaryAsync();
        Assert.Equal(0m, summary.TotalInflow);
        Assert.Equal(4500m, summary.TotalOutflow);
        Assert.Equal(-4500m, summary.NetBalance);
    }

    [Fact]
    public async Task ReverseTransaction_RevertsReceiptAssignmentAccountAndWritesContraLedger()
    {
        using var db = GetInMemoryDbContext();
        var cash = new FinancialAccount
        {
            Name = "Cash Counter",
            Type = "Cash",
            OpeningBalance = 10000m,
            CurrentBalance = 12000m,
            Status = "Active"
        };
        db.FinancialAccounts.Add(cash);
        db.StudentFeeAssignments.Add(new StudentFeeAssignment
        {
            StudentId = "42",
            TotalAmount = 5000m,
            PaidAmount = 2000m,
            DueAmount = 3000m,
            Status = "Active"
        });
        var payment = new FeePayment
        {
            ReceiptNo = "REC-2026-0042",
            StudentId = "42",
            Amount = 2000m,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Cash",
            Status = "Completed",
            FeeHeadName = "Tuition Fee"
        };
        db.FeePayments.Add(payment);
        await db.SaveChangesAsync();

        var repo = new FinanceMasterRepository(db);
        bool reversed = await repo.ReverseTransactionAsync(payment.Id, new ReverseTransactionRequestDto
        {
            ReversalReason = "Duplicate entry",
            AuthorizedBy = "Principal"
        });

        Assert.True(reversed);

        var dbPayment = await db.FeePayments.FirstAsync(p => p.Id == payment.Id);
        Assert.Equal("Cancelled", dbPayment.Status);

        var dbAssignment = await db.StudentFeeAssignments.FirstAsync(a => a.StudentId == "42");
        Assert.Equal(0m, dbAssignment.PaidAmount);
        Assert.Equal(5000m, dbAssignment.DueAmount);

        var dbCash = await db.FinancialAccounts.FirstAsync(a => a.Id == cash.Id);
        Assert.Equal(10000m, dbCash.CurrentBalance);

        var contra = await db.LedgerEntries.FirstOrDefaultAsync(l => l.TransactionType == "Reversal" && l.ReferenceNo == "REV-REC-2026-0042");
        Assert.NotNull(contra);
        Assert.Equal(2000m, contra.Debit);
    }

    [Fact]
    public async Task CategoriesCrud_UsesDedicatedTableWithoutMutatingFeeHeads()
    {
        using var db = GetInMemoryDbContext();
        db.FeeHeads.Add(new FeeHead
        {
            Name = "Annual Tuition",
            Category = "Tuition & Academic Fees",
            Frequency = "Annual",
            DefaultAmount = 15000m,
            Status = "Active"
        });
        await db.SaveChangesAsync();

        var repo = new FinanceMasterRepository(db);

        var created = await repo.CreateCategoryAsync(new FinancialCategoryDto
        {
            Name = "Sports & Athletics Grant",
            Type = "Income",
            SourceModule = "Manual",
            Status = "Active"
        });

        Assert.True(created.Id > 0);
        Assert.Single(await db.FeeHeads.ToListAsync());
        Assert.Single(await db.FinancialCategories.ToListAsync());

        bool updated = await repo.UpdateCategoryAsync(created.Id, new FinancialCategoryDto
        {
            Name = "Sports & Events Grant",
            Type = "Income"
        });
        Assert.True(updated);

        var categories = await repo.GetCategoriesAsync("Income");
        Assert.Contains(categories, c => c.Id == created.Id && c.Name == "Sports & Events Grant" && !c.IsSystem);

        bool deleted = await repo.DeleteCategoryAsync(created.Id);
        Assert.True(deleted);
        Assert.Empty(await db.FinancialCategories.ToListAsync());
        Assert.Single(await db.FeeHeads.ToListAsync());
        Assert.False(await repo.DeleteCategoryAsync(-1));
    }

    [Fact]
    public async Task RefundRequestLifecycle_CreateAndProcessApproved_PersistsFieldsAndDisbursesOnce()
    {
        using var db = GetInMemoryDbContext();
        var bank = new FinancialAccount
        {
            Name = "Main Bank",
            Type = "Bank",
            OpeningBalance = 20000m,
            CurrentBalance = 20000m,
            Status = "Active"
        };
        var cls = new ClassGrade { ClassId = 5, ClassName = "Class 8", Status = "Active", DisplayOrder = 8 };
        var sec = new ClassSection { SectionId = 3, SectionName = "B", ClassId = 5, Status = "Active" };
        db.FinancialAccounts.Add(bank);
        db.Classes.Add(cls);
        db.ClassSections.Add(sec);
        db.Students.Add(new Student
        {
            StudentId = 88,
            AdmissionNumber = "ADM-088",
            RollNumber = "88",
            StudentName = "Ananya Rao",
            ClassId = 5,
            SectionId = 3,
            Status = "Active"
        });
        await db.SaveChangesAsync();

        var repo = new FinanceMasterRepository(db);

        var created = await repo.CreateRefundRequestAsync(new CreateRefundRequestDto
        {
            StudentId = 88,
            ReceiptNo = "REC-2026-8801",
            RefundAmount = 3500m,
            Reason = "Scholarship Adjustment",
            PaymentMode = "Bank Transfer",
            Remarks = "Merit waiver approved"
        });

        Assert.Equal("Pending", created.Status);
        Assert.Equal("Class 8", created.ClassName);
        Assert.Equal("B", created.Section);
        Assert.Equal("Ananya Rao", created.StudentName);
        Assert.Empty(await db.LedgerEntries.ToListAsync());

        bool processed = await repo.ProcessRefundRequestAsync(created.Id, new ProcessRefundRequestDto
        {
            Status = "Approved",
            ProcessedBy = "Accountant A",
            Remarks = "Transferred via NEFT"
        });
        Assert.True(processed);

        var updatedBank = await db.FinancialAccounts.FirstAsync(a => a.Id == bank.Id);
        Assert.Equal(16500m, updatedBank.CurrentBalance);
        Assert.Single(await db.LedgerEntries.Where(l => l.TransactionType == "Refund").ToListAsync());

        // Subsequent Disbursed transition is idempotent on ledger & balance
        bool markedDisbursed = await repo.ProcessRefundRequestAsync(created.Id, new ProcessRefundRequestDto
        {
            Status = "Disbursed",
            ProcessedBy = "Accountant A"
        });
        Assert.True(markedDisbursed);
        Assert.Single(await db.LedgerEntries.Where(l => l.TransactionType == "Refund").ToListAsync());
        Assert.Equal(16500m, (await db.FinancialAccounts.FirstAsync(a => a.Id == bank.Id)).CurrentBalance);
    }

    [Fact]
    public async Task FineRulesCrud_PersistsAllFieldsWithoutSyntheticFallback()
    {
        using var db = GetInMemoryDbContext();
        var repo = new FinanceMasterRepository(db);

        Assert.Empty(await repo.GetFineRulesAsync(null, null));

        var created = await repo.CreateFineRuleAsync(new FineRuleDto
        {
            RuleName = "Quarterly Late Fine",
            DueDate = "2026-07-10",
            GraceDays = 4,
            FineType = "Daily Fine",
            DailyFine = 75m,
            FixedFine = 250m,
            MaximumFine = 1200m,
            Status = "Active"
        });

        Assert.True(created.Id > 0);
        var fetched = await repo.GetFineRuleByIdAsync(created.Id);
        Assert.NotNull(fetched);
        Assert.Equal("2026-07-10", fetched.DueDate);
        Assert.Equal(4, fetched.GraceDays);
        Assert.Equal(75m, fetched.DailyFine);
        Assert.Equal(250m, fetched.FixedFine);
        Assert.Equal(1200m, fetched.MaximumFine);

        Assert.Null(await repo.UpdateFineRuleAsync(9999, new FineRuleDto { RuleName = "Missing" }));
        Assert.False(await repo.DeleteFineRuleAsync(9999));

        Assert.True(await repo.DeleteFineRuleAsync(created.Id));
        Assert.Empty(await repo.GetFineRulesAsync(null, null));
    }

    [Fact]
    public async Task GetBudgets_DeduplicatesExpensesAgainstLedgerAndFiltersAcademicYear()
    {
        using var db = GetInMemoryDbContext();
        db.FinancialBudgets.Add(new FinancialBudget
        {
            CategoryName = "Campus Maintenance",
            Department = "Facilities",
            AcademicYear = "2026-27",
            Branch = "All",
            AllocatedAmount = 25000m,
            Status = "Active"
        });
        db.Expenses.Add(new Expense
        {
            Date = new DateTime(2026, 8, 10, 0, 0, 0, DateTimeKind.Utc),
            Category = "Campus Maintenance",
            Description = "Electrical repair",
            Amount = 6000m,
            ReferenceNo = "EXP-1001",
            Status = "Approved"
        });
        // Matching ledger entry referencing the same expense must NOT double count
        db.LedgerEntries.Add(new LedgerEntry
        {
            TransactionDate = new DateTime(2026, 8, 10, 0, 0, 0, DateTimeKind.Utc),
            TransactionType = "Expense",
            Category = "Campus Maintenance",
            Particulars = "Campus Maintenance",
            ReferenceNo = "EXP-1001",
            Debit = 6000m
        });
        // Separate prior-year expense outside 2026-27 window must NOT count toward 2026-27 budget
        db.Expenses.Add(new Expense
        {
            Date = new DateTime(2024, 9, 10, 0, 0, 0, DateTimeKind.Utc),
            Category = "Campus Maintenance",
            Description = "Old repair",
            Amount = 9000m,
            ReferenceNo = "EXP-0999",
            Status = "Approved"
        });
        await db.SaveChangesAsync();

        var repo = new FinanceMasterRepository(db);
        var budgets = await repo.GetBudgetsAsync(null, "2026-27");

        Assert.Single(budgets);
        Assert.Equal(6000m, budgets[0].ConsumedAmount);
        Assert.Equal("Active", budgets[0].Status);
    }
}
