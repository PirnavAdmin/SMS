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
    public string SourceModule { get; set; } = "Manual"; // "Fees", "Payroll", "Hostel", "Transport", "Uniform", "Inventory", "Manual"
    public string Category { get; set; } = "General";
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string FormattedAmount => $"₹{Amount:N0}";
    public string PaymentMode { get; set; } = "Cash"; // "Cash", "Bank Transfer", "UPI / QR", "Cheque", "POS / Card"
    public string Account { get; set; } = "Main Bank Account";
    public DateTime TransactionDate { get; set; }
    public string FormattedDate => TransactionDate.ToString("yyyy-MM-dd");
    public string Status { get; set; } = "Completed"; // "Completed", "Pending", "Reversed", "Cancelled"
    public string ReferenceNumber { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = "Admin";
    public string Branch { get; set; } = "Main Campus";
    public string AcademicYear { get; set; } = "2026-2027";
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
    public string AcademicYear { get; set; } = "2026-2027";
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
}

public class FinancialAccountDto
{
    public int Id { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string AccountType { get; set; } = "Main Bank Account"; // "Main Bank Account", "Petty Cash", "Gateway Account", "Escrow Account", "Hostel Account", "Transport Account"
    public string AccountNumber { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public decimal CurrentBalance { get; set; }
    public string FormattedBalance => $"₹{CurrentBalance:N0}";
    public string Status { get; set; } = "Active";
}

public class FinancialBudgetDto
{
    public int Id { get; set; }
    public string Department { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = "2026-2027";
    public decimal AllocatedBudget { get; set; }
    public decimal UtilizedBudget { get; set; }
    public decimal RemainingBudget => Math.Max(0m, AllocatedBudget - UtilizedBudget);
    public double UtilizationPercentage => AllocatedBudget > 0 ? Math.Round((double)(UtilizedBudget / AllocatedBudget) * 100, 1) : 0;
    public string FormattedAllocated => $"₹{AllocatedBudget:N0}";
    public string FormattedUtilized => $"₹{UtilizedBudget:N0}";
    public string FormattedRemaining => $"₹{RemainingBudget:N0}";
    public string Status { get; set; } = "On Track";
}

// =========================================================================
// 3. REFUND MANAGEMENT DTOs
// =========================================================================

public class FeeRefundRequestDto
{
    public int Id { get; set; }
    public string RefundRequestId { get; set; } = string.Empty;
    public int StudentId { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public string FormattedAmount => $"₹{RefundAmount:N0}";
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Rejected", "Disbursed"
    public string RequestedBy { get; set; } = "Parent";
    public string ApprovedBy { get; set; } = string.Empty;
    public DateTime RequestedDate { get; set; }
    public DateTime? ProcessedDate { get; set; }
    public string PaymentMode { get; set; } = "Bank Transfer";
    public string Remarks { get; set; } = string.Empty;
}

public class CreateRefundRequestDto
{
    public int StudentId { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
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

public class FinanceSettingsDto
{
    public string Currency { get; set; } = "INR (₹)";
    public string AcademicYear { get; set; } = "2026-2027";
    public string ReceiptPrefix { get; set; } = "REC";
    public bool AutoEnforceLateFines { get; set; } = true;
    public decimal DefaultLateFinePerDay { get; set; } = 50m;
    public int DefaultGracePeriodDays { get; set; } = 7;
    public bool EnablePartialFeePayments { get; set; } = true;
    public bool EnableOnlinePaymentGateway { get; set; } = true;
    public string PaymentGatewayProvider { get; set; } = "Razorpay";
}

// =========================================================================
// 5. FINANCE REPORTS DTOs
// =========================================================================

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