namespace Backend.Tests.Repositories;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Controllers;
using SMS.Api.Controllers.FinanceManagement;
using SMS.Api.Data;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Dtos.Parent;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Implementations.FinanceManagement;
using SMS.Api.Repositories.Implementations.Parent;
using Xunit;

public class FeeCollectionRepositoryTests
{
    private static AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<(Student Student, DynamicFeeStructure Structure)> SeedStudentWithTuitionAsync(
        AppDbContext db,
        decimal tuitionAmount = 12000m)
    {
        var branch = new Branch { BranchId = 1, BranchName = "Main Campus", Status = "Active" };
        var ay = new AcademicYear
        {
            AcademicYearId = 1,
            AcademicYearName = "2026-2027",
            StartDate = DateTime.UtcNow.AddMonths(-3),
            EndDate = DateTime.UtcNow.AddMonths(9),
            IsActive = true
        };
        var cls = new ClassGrade { ClassId = 1, ClassName = "Class 10", Status = "Active", DisplayOrder = 10 };
        var sec = new ClassSection { SectionId = 1, SectionName = "A", ClassId = 1, Status = "Active" };

        db.Branches.Add(branch);
        db.AcademicYears.Add(ay);
        db.Classes.Add(cls);
        db.ClassSections.Add(sec);

        var student = new Student
        {
            StudentId = 201,
            AdmissionNumber = "ADM-201",
            RollNumber = "201",
            StudentName = "Kabir Mehta",
            BranchId = 1,
            AcademicYearId = 1,
            ClassId = 1,
            SectionId = 1,
            Status = "Active"
        };
        db.Students.Add(student);

        var structure = new DynamicFeeStructure
        {
            Name = "Class 10 Tuition",
            AcademicYear = "2026-2027",
            Branch = "Main Campus",
            ClassName = "Class 10",
            Section = "All Sections",
            StudentCategory = "All",
            TotalAmount = tuitionAmount,
            Status = "Active",
            ItemsJson = JsonSerializer.Serialize(new[]
            {
                new FeeStructureItemDto
                {
                    FeeHeadId = "1",
                    FeeHeadName = "Tuition Fee",
                    Amount = tuitionAmount
                }
            })
        };
        db.DynamicFeeStructures.Add(structure);
        await db.SaveChangesAsync();

        db.StudentFeeAssignments.Add(new StudentFeeAssignment
        {
            StudentId = "201",
            DynamicFeeStructureId = structure.Id,
            TotalAmount = tuitionAmount,
            PaidAmount = 0m,
            DueAmount = tuitionAmount,
            Status = "Active"
        });
        await db.SaveChangesAsync();

        return (student, structure);
    }

    [Fact]
    public async Task GetStudentFeeProfile_ComputesOverdueFineFromActiveFineRule()
    {
        using var db = GetInMemoryDbContext();
        await SeedStudentWithTuitionAsync(db, 10000m);

        // Overdue fine rule 15 days in the past with 5 grace days => 10 chargeable days * 50 = 500
        db.FineRules.Add(new FineRule
        {
            RuleName = "Overdue Penalty",
            DueDate = DateTime.UtcNow.AddDays(-15).ToString("yyyy-MM-dd"),
            GraceDays = 5,
            FineType = "Daily Fine",
            DailyFine = 50m,
            FixedFine = 200m,
            MaximumFine = 400m,
            Status = "Active"
        });
        await db.SaveChangesAsync();

        var repo = new FeeCollectionRepository(db);
        var profile = await repo.GetStudentFeeProfileAsync(201, "2026-2027");

        Assert.NotNull(profile);
        Assert.Equal("Overdue Penalty", profile.FineRule.RuleName);
        Assert.True(profile.FineRule.DaysOverdue >= 15);
        Assert.Equal(400m, profile.FineRule.CalculatedFineAmount); // capped at MaximumFine
        Assert.False(profile.FineRule.IsWaived);
    }

    [Fact]
    public async Task CollectPayment_HonorsReceiptPrefixUpdatesAccountAndWritesLedger()
    {
        using var db = GetInMemoryDbContext();
        await SeedStudentWithTuitionAsync(db, 12000m);

        var cashAccount = new FinancialAccount
        {
            Name = "Petty Cash",
            Type = "Cash",
            OpeningBalance = 1000m,
            CurrentBalance = 1000m,
            Status = "Active"
        };
        db.FinancialAccounts.Add(cashAccount);
        db.SchoolSettings.Add(new SchoolSettings
        {
            Id = 1,
            FinanceSettingsJson = JsonSerializer.Serialize(new { receiptPrefix = "PIR-26-" })
        });
        await db.SaveChangesAsync();

        var repo = new FeeCollectionRepository(db);
        var result = await repo.CollectPaymentAsync(new CollectFeePaymentRequestDto
        {
            StudentId = 201,
            AcademicYear = "2026-2027",
            TotalAmountPaid = 5000m,
            PaymentMethod = "Cash",
            Remarks = "First installment",
            SelectedItems = new List<SelectedFeeItemPaymentDto>
            {
                new() { FeeHeadId = "1", FeeHeadName = "Tuition Fee", TermName = "Term 1", Amount = 5000m }
            }
        });

        Assert.True(result.Success);
        Assert.StartsWith("PIR-26-", result.ReceiptNo);
        Assert.Equal(5000m, result.AmountPaid);

        var updatedAccount = await db.FinancialAccounts.FirstAsync(a => a.Id == cashAccount.Id);
        Assert.Equal(6000m, updatedAccount.CurrentBalance);

        var ledgerEntry = await db.LedgerEntries.FirstOrDefaultAsync(l => l.ReferenceNo == result.ReceiptNo);
        Assert.NotNull(ledgerEntry);
        Assert.Equal(5000m, ledgerEntry.Credit);
        Assert.Equal(cashAccount.Id, ledgerEntry.FinancialAccountId);
    }

    [Fact]
    public async Task GetReceiptsRegisterAndCancelReceipt_FiltersDateExcludesCancelledAndRevertsBalances()
    {
        using var db = GetInMemoryDbContext();
        await SeedStudentWithTuitionAsync(db, 10000m);

        var bank = new FinancialAccount
        {
            Name = "Main Bank",
            Type = "Bank",
            OpeningBalance = 0m,
            CurrentBalance = 7000m,
            Status = "Active"
        };
        db.FinancialAccounts.Add(bank);

        var p1 = new FeePayment
        {
            ReceiptNo = "REC-OLD-001",
            StudentId = "201",
            Amount = 3000m,
            PaymentDate = new DateTime(2026, 1, 15, 10, 0, 0, DateTimeKind.Utc),
            PaymentMethod = "UPI",
            Status = "Completed",
            FeeHeadName = "Tuition Fee"
        };
        var p2 = new FeePayment
        {
            ReceiptNo = "REC-NEW-002",
            StudentId = "201",
            Amount = 4000m,
            PaymentDate = new DateTime(2026, 6, 15, 10, 0, 0, DateTimeKind.Utc),
            PaymentMethod = "UPI",
            Status = "Completed",
            FeeHeadName = "Tuition Fee"
        };
        db.FeePayments.AddRange(p1, p2);
        var assignment = await db.StudentFeeAssignments.FirstAsync(a => a.StudentId == "201");
        assignment.PaidAmount = 7000m;
        assignment.DueAmount = 3000m;
        await db.SaveChangesAsync();

        var repo = new FeeCollectionRepository(db);

        // Date filter should exclude REC-OLD-001
        var filtered = await repo.GetReceiptsRegisterAsync(null, null, "2026-06-01", "2026-06-30", 1, 50);
        Assert.Equal(1, filtered.TotalRecords);
        Assert.Single(filtered.Items);
        Assert.Equal("REC-NEW-002", filtered.Items[0].ReceiptNo);
        Assert.Equal(4000m, filtered.TotalCollectedAmount);

        // Cancel REC-NEW-002 and verify assignment + bank + contra-ledger + register total
        bool cancelled = await repo.CancelReceiptAsync("REC-NEW-002", "Cheque bounced");
        Assert.True(cancelled);
        Assert.False(await repo.CancelReceiptAsync("REC-NEW-002", "Repeat cancel"));

        var updatedAssignment = await db.StudentFeeAssignments.FirstAsync(a => a.StudentId == "201");
        Assert.Equal(3000m, updatedAssignment.PaidAmount);
        Assert.Equal(7000m, updatedAssignment.DueAmount);

        var updatedBank = await db.FinancialAccounts.FirstAsync(a => a.Id == bank.Id);
        Assert.Equal(3000m, updatedBank.CurrentBalance);

        var contra = await db.LedgerEntries.FirstOrDefaultAsync(l => l.ReferenceNo == "REV-REC-NEW-002");
        Assert.NotNull(contra);
        Assert.Equal(4000m, contra.Debit);

        var registerAll = await repo.GetReceiptsRegisterAsync(null, null, null, null, 1, 50);
        Assert.Equal(3000m, registerAll.TotalCollectedAmount); // Cancelled receipt excluded from collected sum
    }

    [Fact]
    public async Task ParentRepository_PayFee_RejectsOverpaymentAndSyncsLedger()
    {
        using var db = GetInMemoryDbContext();
        await SeedStudentWithTuitionAsync(db, 8000m);

        var bank = new FinancialAccount
        {
            Name = "Gateway Account",
            Type = "Bank",
            OpeningBalance = 5000m,
            CurrentBalance = 5000m,
            Status = "Active"
        };
        db.FinancialAccounts.Add(bank);
        await db.SaveChangesAsync();

        var feeCollectionRepo = new FeeCollectionRepository(db);
        var parentRepo = new ParentRepository(db, feeCollectionRepo);

        var invalid = await parentRepo.PayFeeAsync(new ParentFeePaymentRequestDto
        {
            StudentId = 201,
            AmountPaid = -100m,
            PaymentMode = "Online"
        });
        Assert.False(invalid.Success);

        var overpay = await parentRepo.PayFeeAsync(new ParentFeePaymentRequestDto
        {
            StudentId = 201,
            AmountPaid = 9500m,
            PaymentMode = "Online"
        });
        Assert.False(overpay.Success);

        var valid = await parentRepo.PayFeeAsync(new ParentFeePaymentRequestDto
        {
            StudentId = 201,
            AmountPaid = 3000m,
            PaymentMode = "Online",
            PaymentType = "Due"
        });
        Assert.True(valid.Success);
        Assert.Equal(3000m, valid.AmountPaid);

        var ledger = await db.LedgerEntries.FirstOrDefaultAsync(l => l.ReferenceNo == valid.ReceiptNo);
        Assert.NotNull(ledger);
        Assert.Equal(3000m, ledger.Credit);
        Assert.Equal(8000m, (await db.FinancialAccounts.FirstAsync(a => a.Id == bank.Id)).CurrentBalance);
    }

    [Fact]
    public void FinanceControllers_EnforceRoleAuthorizationAttributes()
    {
        var financeGetAuth = typeof(FinanceController)
            .GetMethod(nameof(FinanceController.GetFeeHeads))!
            .GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(financeGetAuth);
        Assert.Contains("Accountant", financeGetAuth!.Roles ?? string.Empty);
        Assert.DoesNotContain("Student", financeGetAuth.Roles ?? string.Empty);

        var financePostAuth = typeof(FinanceController)
            .GetMethod(nameof(FinanceController.CreateFeePayment))!
            .GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(financePostAuth);
        Assert.Contains("Accountant", financePostAuth!.Roles ?? string.Empty);

        var masterCreateTxnAuth = typeof(FinanceMasterController)
            .GetMethod(nameof(FinanceMasterController.CreateTransaction))!
            .GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(masterCreateTxnAuth);
        Assert.DoesNotContain("Teacher", masterCreateTxnAuth!.Roles ?? string.Empty);

        var feeDetailsAuth = typeof(FeeDetailsController)
            .GetMethod(nameof(FeeDetailsController.GetStudentFeeDetails))!
            .GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(feeDetailsAuth);
        Assert.Contains("Accountant", feeDetailsAuth!.Roles ?? string.Empty);
        Assert.Contains("Parent", feeDetailsAuth.Roles ?? string.Empty);
    }
}
