namespace SMS.Api.Dtos.FinanceManagement;

using System;
using System.Collections.Generic;

// =========================================================================
// 1. GENERAL LEDGER & TRANSACTIONS DTOs
// =========================================================================

public class FinanceTransactionDto
{
    public int Id { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string Type { get; set; } = "Income"; // "Income" or "Expense"
    public string SourceModule { get; set; } = "Manual"; // "Student Fee Collection", "Admissions", "Payroll", "Hostel", "Transport", "Uniform", "Inventory", "Manual"
    public string Category { get; set; } = "General";
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string FormattedAmount => $"₹{Amount:N0}";
    public string PaymentMode { get; set; } = "Bank Transfer"; // "Cash", "Bank Transfer", "UPI", "Cheque", "POS / Card"
    public string Account { get; set; } = "Main Bank Account";
    public DateTime TransactionDate { get; set; }
    public string FormattedDate => TransactionDate.ToString("yyyy-MM-dd");
    public string Date => FormattedDate;
    public string Time => TransactionDate.ToString("hh:mm tt");
    public string Status { get; set; } = "Completed"; // "Completed", "Pending", "Reversed", "Cancelled"
    public string ReferenceNumber { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = "Admin";
    public string ApprovedBy { get; set; } = "Chief Accountant";
    public string Branch { get; set; } = "Main Campus";
    public string AcademicYear { get; set; } = "2025-2026";
    public string Notes { get; set; } = string.Empty;
    public string AttachmentName { get; set; } = string.Empty;
}

public class CreateTransactionRequestDto
{
    public string Type { get; set; } = "Income";
    public string SourceModule { get; set; } = "Manual";
    public string Category { get; set; } = "General";
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = "Bank Transfer";
    public string Account { get; set; } = "Main Bank Account";
    public string TransactionDate { get; set; } = string.Empty;
    public string Branch { get; set; } = "Main Campus";
    public string AcademicYear { get; set; } = "2025-2026";
    public string Notes { get; set; } = string.Empty;
    public string AttachmentName { get; set; } = string.Empty;
}

public class ReverseTransactionRequestDto
{
    public string ReversalReason { get; set; } = string.Empty;
    public string AuthorizedBy { get; set; } = "Admin";
}

public class FinanceTransactionSummaryDto
{
    public decimal TotalInflow { get; set; }
    public decimal TotalOutflow { get; set; }
    public decimal NetBalance { get; set; }
    public decimal TodayInflow { get; set; }
    public decimal PendingClearances { get; set; }
    public string FormattedInflow => $"₹{TotalInflow:N0}";
    public string FormattedOutflow => $"₹{TotalOutflow:N0}";
    public string FormattedNetBalance => $"₹{NetBalance:N0}";
    public string FormattedTodayInflow => $"₹{TodayInflow:N0}";
}

// =========================================================================
// 2. BANK ACCOUNTS, CATEGORIES & BUDGETS DTOs
// =========================================================================

public class FinancialCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Income"; // "Income" or "Expense"
    public string SourceModule { get; set; } = "Manual";
    public string Status { get; set; } = "Active";
    public bool IsSystem { get; set; } = false;
}

public class FinancialAccountDto
{
    public int Id { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string AccountType { get; set; } = "Main Bank Account"; // "Main Bank Account", "Petty Cash", "Gateway Account", "Escrow Account", "Hostel Account", "Transport Account", "Cash"
    public string AccountNumber { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public decimal CurrentBalance { get; set; }
    public string Currency { get; set; } = "INR";
    public string FormattedBalance => $"₹{CurrentBalance:N0}";
    public string Status { get; set; } = "Active";
}

public class FinancialBudgetDto
{
    public int Id { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = "2025-2026";
    public string Branch { get; set; } = "Main Campus";
    public decimal AllocatedAmount { get; set; }
    public decimal ConsumedAmount { get; set; }
    public decimal RemainingAmount => Math.Max(0m, AllocatedAmount - ConsumedAmount);
    public decimal AllocatedBudget { get => AllocatedAmount; set => AllocatedAmount = value; }
    public decimal UtilizedBudget { get => ConsumedAmount; set => ConsumedAmount = value; }
    public decimal RemainingBudget => RemainingAmount;
    public double UtilizationPercentage => AllocatedAmount > 0 ? Math.Round((double)(ConsumedAmount / AllocatedAmount) * 100, 1) : 0;
    public string FormattedAllocated => $"₹{AllocatedAmount:N0}";
    public string FormattedUtilized => $"₹{ConsumedAmount:N0}";
    public string FormattedRemaining => $"₹{RemainingAmount:N0}";
    public string Status { get; set; } = "Active";
}

// =========================================================================
// 3. REFUND MANAGEMENT DTOs
// =========================================================================

public class FeeRefundRequestDto
{
    public int Id { get; set; }
    public string RefundRequestId { get; set; } = string.Empty;
    public string RefundNo { get; set; } = string.Empty;
    public string ReceiptNo { get; set; } = string.Empty;
    public int StudentId { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public string FormattedAmount => $"₹{RefundAmount:N0}";
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Rejected", "Disbursed"
    public string RequestedBy { get; set; } = "Admin";
    public string ApprovedBy { get; set; } = string.Empty;
    public DateTime RequestedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedDate { get; set; }
    public string PaymentMode { get; set; } = "Bank Transfer";
    public string Remarks { get; set; } = string.Empty;
}

public class CreateRefundRequestDto
{
    public int StudentId { get; set; }
    public string? StudentName { get; set; }
    public string? AdmissionNo { get; set; }
    public string? ClassName { get; set; }
    public string? Section { get; set; }
    public string? ReceiptNo { get; set; }
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = "Scholarship Adjustment";
    public string PaymentMode { get; set; } = "Bank Transfer";
    public string Remarks { get; set; } = string.Empty;
}

public class ProcessRefundRequestDto
{
    public string Status { get; set; } = "Approved"; // "Approved" or "Rejected"
    public string Remarks { get; set; } = string.Empty;
    public string ProcessedBy { get; set; } = "Admin";
}

// =========================================================================
// 4. FINANCE SETUP & MASTER DTOs
// =========================================================================

public class FeeScheduleTermDto
{
    public string Id { get; set; } = string.Empty;
    public int Sequence { get; set; } = 1;
    public string TermName { get; set; } = "Term 1";
    public string StartDate { get; set; } = "2026-04-01";
    public string EndDate { get; set; } = "2026-06-30";
    public string DueDate { get; set; } = "2026-04-15";
    public string Status { get; set; } = "Active";
    public double PercentageShare { get; set; } = 25.0;
}

public class MonthDueDateItemDto
{
    public int MonthIndex { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
}

public class MonthlyDueDateConfigDto
{
    public bool ApplySameDayToAllMonths { get; set; } = true;
    public int DueDay { get; set; } = 10;
    public List<MonthDueDateItemDto> MonthDueDates { get; set; } = new();
}

public class FeeScheduleConfigDto
{
    public string Id { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = "2026-2027";
    public int NumberOfTerms { get; set; } = 4;
    public string Status { get; set; } = "Published";
    public List<FeeScheduleTermDto> Terms { get; set; } = new();
    public MonthlyDueDateConfigDto? MonthlyConfig { get; set; }
    public string AnnualDueDate { get; set; } = "2026-04-15";
    public string OneTimeDueDate { get; set; } = "2026-04-15";
}

public class FinanceSettingsTaxDto
{
    public bool Enabled { get; set; } = true;
    public string TaxName { get; set; } = "GST";
    public decimal Percentage { get; set; } = 0m;
}

public class FinanceSettingsDto
{
    public string AcademicYear { get; set; } = "2025-2026";
    public string? ActiveAcademicYear { get; set; } = "2025-2026";
    public string FinancialYear { get; set; } = "2025-2026";
    public string DefaultCurrency { get; set; } = "INR";
    public string Currency { get; set; } = "INR";
    public string LateFeeRuleId { get; set; } = "1";
    public string ReceiptPrefix { get; set; } = "REC-2026-";
    public string InvoicePrefix { get; set; } = "INV-2026-";
    public string ReceiptFormat { get; set; } = "{PREFIX}{YEAR}-{NUMBER}";
    public bool AutoReceiptNo { get; set; } = true;
    public bool AutoEnforceLateFines { get; set; } = true;
    public decimal DefaultLateFinePerDay { get; set; } = 50m;
    public int DefaultGracePeriodDays { get; set; } = 7;
    public bool EnablePartialFeePayments { get; set; } = true;
    public bool EnableOnlinePaymentGateway { get; set; } = true;
    public string PaymentGatewayProvider { get; set; } = "Razorpay";
    public List<string> PaymentModes { get; set; } = new() { "Bank Transfer", "Cash", "Cheque", "UPI / Online" };
    public FinanceSettingsTaxDto TaxSettings { get; set; } = new();
}

// =========================================================================
// 5. FINANCE REPORTS DTOs
// =========================================================================

public class FinanceReportsSummaryDto
{
    public decimal TodayCollection { get; set; }
    public decimal MonthlyCollection { get; set; }
    public decimal PendingDues { get; set; }
    public int StudentsPaidCount { get; set; }
    public decimal ScholarshipsAndDiscounts { get; set; }
    public decimal TransportAndHostel { get; set; }

    public string FormattedToday => $"₹{TodayCollection:N0}";
    public string FormattedMonthly => $"₹{MonthlyCollection:N0}";
    public string FormattedPending => $"₹{PendingDues:N0}";
    public string FormattedConcessions => $"₹{ScholarshipsAndDiscounts:N0}";
    public string FormattedServices => $"₹{TransportAndHostel:N0}";
}

public class DailyCollectionReportRowDto
{
    public string ReceiptNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string PaymentMode { get; set; } = "Cash";
    public decimal Amount { get; set; }
    public string FormattedAmount => $"₹{Amount:N0}";
    public string CollectedBy { get; set; } = "Counter 1";
    public DateTime PaymentTime { get; set; }
}

public class DailyCollectionReportResponseDto
{
    public string ReportDate { get; set; } = string.Empty;
    public decimal TotalCash { get; set; }
    public decimal TotalOnline { get; set; }
    public decimal TotalCheque { get; set; }
    public decimal GrandTotal { get; set; }
    public string FormattedGrandTotal => $"₹{GrandTotal:N0}";
    public List<DailyCollectionReportRowDto> Transactions { get; set; } = new();
}

public class ClassWiseCollectionReportRowDto
{
    public string ClassName { get; set; } = string.Empty;
    public int TotalStudents { get; set; }
    public decimal ExpectedRevenue { get; set; }
    public decimal CollectedRevenue { get; set; }
    public decimal OutstandingDues { get; set; }
    public double CollectionPercentage => ExpectedRevenue > 0 ? Math.Round((double)(CollectedRevenue / ExpectedRevenue) * 100, 1) : 0;
    public string FormattedExpected => $"₹{ExpectedRevenue:N0}";
    public string FormattedCollected => $"₹{CollectedRevenue:N0}";
    public string FormattedOutstanding => $"₹{OutstandingDues:N0}";
}

// =========================================================================
// 6. SCHOLARSHIP MASTER & STUDENT SCHOLARSHIP DTOs
// =========================================================================

public class ScholarshipMasterDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Type { get; set; } = "Merit";
    public string DiscountType { get; set; } = "Percentage"; // "Percentage" or "Fixed Amount"
    public decimal Percentage { get; set; } = 15m;
    public decimal FixedAmount { get; set; } = 0m;
    public List<string> ApplicableFeeHeadIds { get; set; } = new();
    public List<string> ApplicableClasses { get; set; } = new();
    public string StartDate { get; set; } = "2026-04-01";
    public string EndDate { get; set; } = "2027-03-31";
    public string Eligibility { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
}

public class StudentScholarshipAwardDto
{
    public int Id { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public int ScholarshipId { get; set; }
    public string ScholarshipName { get; set; } = string.Empty;
    public string ScholarshipCode { get; set; } = string.Empty;
    public string DiscountType { get; set; } = "Percentage";
    public decimal DiscountValue { get; set; }
    public string AppliedDate { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
}

public class AwardScholarshipRequestDto
{
    public string StudentId { get; set; } = string.Empty;
    public int ScholarshipId { get; set; }
    public string? Remarks { get; set; }
}

// =========================================================================
// 7. DISCOUNTS & STUDENT CONCESSIONS DTOs
// =========================================================================

public class DiscountRuleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Type { get; set; } = "Sibling Discount";
    public string Mode { get; set; } = "Percentage"; // "Percentage" or "Fixed Amount"
    public decimal Value { get; set; } = 10m;
    public string Status { get; set; } = "Active";
}

public class StudentDiscountDto
{
    public int Id { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public int DiscountId { get; set; }
    public string DiscountName { get; set; } = string.Empty;
    public string DiscountCode { get; set; } = string.Empty;
    public string Mode { get; set; } = "Percentage";
    public decimal Value { get; set; }
    public string AppliedDate { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
}

public class GrantDiscountRequestDto
{
    public string StudentId { get; set; } = string.Empty;
    public int DiscountId { get; set; }
    public string? Remarks { get; set; }
}

// =========================================================================
// 8. LATE FINE RULES DTOs
// =========================================================================

public class FineRuleDto
{
    public int Id { get; set; }
    public string RuleName { get; set; } = string.Empty;
    public string DueDate { get; set; } = "2026-08-15";
    public int GraceDays { get; set; } = 5;
    public string FineType { get; set; } = "Daily Fine"; // "Daily Fine", "Fixed Fine", "Percentage"
    public decimal DailyFine { get; set; } = 50m;
    public decimal FixedFine { get; set; } = 200m;
    public decimal MaximumFine { get; set; } = 1500m;
    public string Status { get; set; } = "Active";
}

// =========================================================================
// 9. HOSTEL FEE CONFIGURATIONS DTOs
// =========================================================================

public class FinanceHostelConfigDto
{
    public int Id { get; set; }
    public string HostelId { get; set; } = string.Empty;
    public string HostelName { get; set; } = string.Empty;
    public string RoomTypeId { get; set; } = string.Empty;
    public string RoomTypeName { get; set; } = string.Empty;
    public string RoomId { get; set; } = string.Empty;
    public string RoomNo { get; set; } = "All Rooms";
    public string FeePlan { get; set; } = "Annual"; // "Monthly", "Quarterly", "Half Yearly", "Annual"
    public decimal HostelFee { get; set; } = 40000m;
    public decimal SecurityDeposit { get; set; } = 5000m;
    public decimal TotalFee => HostelFee + SecurityDeposit;
    public string EffectiveFrom { get; set; } = "2026-09-02";
    public string Status { get; set; } = "Active"; // "Active", "Inactive"
}

public class CreateFinanceHostelConfigDto
{
    public string HostelId { get; set; } = string.Empty;
    public string HostelName { get; set; } = string.Empty;
    public string RoomTypeId { get; set; } = string.Empty;
    public string RoomTypeName { get; set; } = string.Empty;
    public string? RoomId { get; set; }
    public string? RoomNo { get; set; } = "All Rooms";
    public string FeePlan { get; set; } = "Annual";
    public decimal HostelFee { get; set; } = 40000m;
    public decimal SecurityDeposit { get; set; } = 5000m;
    public string? EffectiveFrom { get; set; }
    public string Status { get; set; } = "Active";
}

// =========================================================================
// 10. UNIFORM FEE CONFIGURATIONS DTOs
// =========================================================================

public class FinanceUniformConfigDto
{
    public int Id { get; set; }
    public string AcademicYear { get; set; } = "2026-2027";
    public string Branch { get; set; } = "Main Campus";
    public string ClassName { get; set; } = "Class 10";
    public string Gender { get; set; } = "Unisex"; // "Male", "Female", "Unisex"
    public string UniformPackage { get; set; } = "Full Kit";
    public string? UniformItemId { get; set; }
    public string FeePlan { get; set; } = "Annual"; // "One Time", "Annual", "Term-wise"
    public decimal FeeAmount { get; set; } = 3500m;
    public string EffectiveFrom { get; set; } = "2026-09-02";
    public string Status { get; set; } = "Active"; // "Active", "Inactive"
}

public class CreateFinanceUniformConfigDto
{
    public string? AcademicYear { get; set; } = "2026-2027";
    public string? Branch { get; set; } = "Main Campus";
    public string ClassName { get; set; } = "Class 10";
    public string Gender { get; set; } = "Unisex";
    public string UniformPackage { get; set; } = "Full Kit";
    public string? UniformItemId { get; set; }
    public string? FeePlan { get; set; } = "Annual";
    public decimal FeeAmount { get; set; } = 3500m;
    public string? EffectiveFrom { get; set; }
    public string Status { get; set; } = "Active";
}