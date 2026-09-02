namespace SMS.Api.Dtos.FinanceManagement;

using System;
using System.Collections.Generic;

// =========================================================================
// 1. FEE COLLECTION STUDENT ROSTER DTOs
// =========================================================================

public class FeeCollectionStudentSummaryDto
{
    public int StudentId { get; set; }
    public string Id => StudentId.ToString();
    public string AdmissionNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public int SectionId { get; set; }
    public string Section { get; set; } = string.Empty;
    public string StudentType { get; set; } = "Day Scholar";
    public string Branch { get; set; } = "Main Campus";
    public string AcademicYear { get; set; } = "2026-2027";
    public string FatherName { get; set; } = string.Empty;
    public string FatherMobile { get; set; } = string.Empty;
    public decimal TotalFee { get; set; }
    public decimal PaidFee { get; set; }
    public decimal TotalOutstanding { get; set; }
    public decimal CurrentYearDue { get; set; }
    public decimal PreviousYearsDue { get; set; }
    public string FormattedTotalOutstanding => $"₹{TotalOutstanding:N0}";
    public string Status { get; set; } = "Active";
}

public class FeeCollectionStudentRosterResponseDto
{
    public int TotalRecords { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public List<FeeCollectionStudentSummaryDto> Items { get; set; } = new();
}

// =========================================================================
// 2. DETAILED STUDENT FEE PROFILE & CALCULATION DTOs
// =========================================================================

public class FeeTermItemDto
{
    public string TermId { get; set; } = string.Empty;
    public string TermName { get; set; } = string.Empty;
    public int TermNumber { get; set; }
    public string DueDate { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public string Status { get; set; } = "PENDING";
    public bool IsOverdue { get; set; }
    public int DaysOverdue { get; set; }
    public string FormattedAmount => $"₹{Amount:N0}";
    public string FormattedPaidAmount => $"₹{PaidAmount:N0}";
    public string FormattedRemainingAmount => $"₹{RemainingAmount:N0}";
}

public class FeeLineItemDto
{
    public string FeeHeadId { get; set; } = string.Empty;
    public string HeadName { get; set; } = string.Empty;
    public string Frequency { get; set; } = "Term-Wise";
    public string DueDate { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public string Status { get; set; } = "PENDING";
    public bool IsOverdue { get; set; }
    public int DaysOverdue { get; set; }
    public string FormattedTotal => $"₹{TotalAmount:N0}";
    public string FormattedPaid => $"₹{PaidAmount:N0}";
    public string FormattedRemaining => $"₹{RemainingAmount:N0}";
    public List<FeeTermItemDto> Terms { get; set; } = new();
}

public class LateFineRuleDetailDto
{
    public string RuleName { get; set; } = "Standard Monthly Late Fine Rule";
    public int DaysOverdue { get; set; } = 0;
    public decimal CalculatedFineAmount { get; set; } = 0m;
    public bool IsWaived { get; set; } = false;
    public string Description => $"{RuleName} ({DaysOverdue} Days Overdue)";
    public string FormattedFineAmount => $"₹{CalculatedFineAmount:N0}";
}

public class ConcessionOptionDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Percentage";
    public decimal Value { get; set; }
    public string ApplicableHead { get; set; } = "Tuition Fee";
}

public class StudentPaymentReceiptSummaryDto
{
    public string ReceiptNo { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public string FormattedDate => PaymentDate.ToString("yyyy-MM-dd");
    public string PaymentMethod { get; set; } = "Cash";
    public decimal AmountPaid { get; set; }
    public string FormattedAmount => $"₹{AmountPaid:N0}";
    public string Status { get; set; } = "Paid";
    public string TransactionId { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
    public List<string> PaidHeads { get; set; } = new();
}

public class StudentFeeProfileResponseDto
{
    public int StudentId { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string StudentType { get; set; } = "Day Scholar";
    public string Branch { get; set; } = "Main Campus";
    public string AcademicYear { get; set; } = "2026-2027";
    public string FatherName { get; set; } = string.Empty;
    public string FatherMobile { get; set; } = string.Empty;

    public decimal CurrentYearDues { get; set; }
    public decimal PreviousYearsArrears { get; set; }
    public decimal TotalConcessions { get; set; }
    public decimal TotalOutstandingBalance { get; set; }

    public string FormattedCurrentDues => $"₹{CurrentYearDues:N0}";
    public string FormattedPreviousArrears => $"₹{PreviousYearsArrears:N0}";
    public string FormattedConcessions => $"₹{TotalConcessions:N0}";
    public string FormattedTotalOutstanding => $"₹{TotalOutstandingBalance:N0}";

    public LateFineRuleDetailDto FineRule { get; set; } = new();
    public List<ConcessionOptionDto> AvailableScholarships { get; set; } = new();
    public List<ConcessionOptionDto> AvailableDiscounts { get; set; } = new();
    public List<FeeLineItemDto> CurrentAcademicYearFees { get; set; } = new();
    public List<StudentPaymentReceiptSummaryDto> RecordedReceipts { get; set; } = new();
}

// =========================================================================
// 3. PAYMENT COLLECTION & RECEIPT PROCESSING DTOs
// =========================================================================

public class SelectedFeeItemPaymentDto
{
    public string FeeHeadId { get; set; } = string.Empty;
    public string HeadName { get; set; } = string.Empty;
    public string TermId { get; set; } = string.Empty;
    public string TermName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class CollectFeePaymentRequestDto
{
    public int StudentId { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = "2026-2027";
    public decimal TotalAmountPaid { get; set; }
    public decimal ConcessionDiscountAmount { get; set; } = 0m;
    public decimal FineAmount { get; set; } = 0m;
    public bool IsFineWaived { get; set; } = false;
    public string PaymentMethod { get; set; } = "Cash";
    public string TransactionId { get; set; } = string.Empty;
    public string ChequeNo { get; set; } = string.Empty;
    public string ChequeDate { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
    public List<SelectedFeeItemPaymentDto> SelectedItems { get; set; } = new();
}

public class CollectFeePaymentResponseDto
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "Payment collected and receipt generated successfully.";
    public string ReceiptNo { get; set; } = string.Empty;
    public int PaymentId { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal RemainingOutstanding { get; set; }
    public string FormattedAmountPaid => $"₹{AmountPaid:N0}";
    public string FormattedRemaining => $"₹{RemainingOutstanding:N0}";
}

// =========================================================================
// 4. DUE FEES & DEFAULTERS DTOs
// =========================================================================

public class DueFeeStudentDto
{
    public int StudentId { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string ParentName { get; set; } = string.Empty;
    public string ParentMobile { get; set; } = string.Empty;
    public decimal TotalDueAmount { get; set; }
    public int MaxDaysOverdue { get; set; }
    public string OverdueStatus => MaxDaysOverdue > 90 ? "Critical (>90 Days)" : MaxDaysOverdue > 30 ? "Overdue (>30 Days)" : "Due Soon";
    public string FormattedDueAmount => $"₹{TotalDueAmount:N0}";
    public List<string> OverdueHeads { get; set; } = new();
}

public class DueFeesSummaryResponseDto
{
    public int TotalOverdueStudents { get; set; }
    public decimal TotalOverdueAmount { get; set; }
    public int CriticalDefaultersCount { get; set; }
    public string FormattedTotalOverdue => $"₹{TotalOverdueAmount:N0}";
    public List<DueFeeStudentDto> Items { get; set; } = new();
}

public class SendFeeReminderRequestDto
{
    public int StudentId { get; set; }
    public string ReminderType { get; set; } = "SMS";
    public string CustomMessage { get; set; } = string.Empty;
}

// =========================================================================
// 5. PROMOTED STUDENTS DUES DTOs
// =========================================================================

public class PromotedDueStudentDto
{
    public int StudentId { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string CurrentClass { get; set; } = string.Empty;
    public string PreviousClass { get; set; } = string.Empty;
    public string PreviousAcademicYear { get; set; } = "2025-2026";
    public decimal PreviousArrearsAmount { get; set; }
    public string FormattedArrears => $"₹{PreviousArrearsAmount:N0}";
    public string FatherName { get; set; } = string.Empty;
    public string FatherMobile { get; set; } = string.Empty;
}

// =========================================================================
// 6. FEE RECEIPTS REGISTER DTOs
// =========================================================================

public class FeeReceiptDetailDto
{
    public int PaymentId { get; set; }
    public string ReceiptNo { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public string FormattedDate => PaymentDate.ToString("yyyy-MM-dd HH:mm");
    public int StudentId { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = "2026-2027";
    public string Branch { get; set; } = "Main Campus";
    public decimal AmountPaid { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FineAmount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string TransactionId { get; set; } = string.Empty;
    public string Status { get; set; } = "Completed";
    public string Remarks { get; set; } = string.Empty;
    public string FormattedAmount => $"₹{AmountPaid:N0}";
    public List<FeeBreakdownItemDto> ItemizedBreakdown { get; set; } = new();
}

public class FeeReceiptsRegisterResponseDto
{
    public int TotalRecords { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public decimal TotalCollectedAmount { get; set; }
    public string FormattedTotalCollected => $"₹{TotalCollectedAmount:N0}";
    public List<FeeReceiptDetailDto> Items { get; set; } = new();
}

// =========================================================================
// 7. FINANCE DASHBOARD & REPORTS DTOs
// =========================================================================

public class MonthlyCollectionTrendDto
{
    public string Month { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CollectedAmount { get; set; }
}

public class FeeHeadCollectionShareDto
{
    public string HeadName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public double Percentage { get; set; }
    public string Color { get; set; } = "#3b82f6";
}

public class PaymentModeSplitDto
{
    public string Mode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int TransactionsCount { get; set; }
}

public class ClassWiseCollectionShareDto
{
    public string ClassName { get; set; } = string.Empty;
    public decimal ExpectedAmount { get; set; }
    public decimal CollectedAmount { get; set; }
    public decimal PendingAmount => Math.Max(0m, ExpectedAmount - CollectedAmount);
    public double Percentage => ExpectedAmount > 0 ? Math.Min(100.0, Math.Round((double)(CollectedAmount / ExpectedAmount) * 100, 1)) : 0;
    public string FormattedExpected => $"₹{ExpectedAmount:N0}";
    public string FormattedCollected => $"₹{CollectedAmount:N0}";
}

public class FinanceDashboardStatsDto
{
    public decimal TotalExpectedRevenue { get; set; }
    public decimal TotalCollectedRevenue { get; set; }
    public decimal TotalOutstandingDues { get; set; }
    public decimal TotalConcessionsGranted { get; set; }
    public decimal TodayCollectionAmount { get; set; }
    public decimal MonthlyCollectionAmount { get; set; }
    public int StudentsPaidCount { get; set; }
    public double CollectionEfficiencyPercentage { get; set; }

    public decimal TransportRevenue { get; set; }
    public decimal HostelRevenue { get; set; }
    public decimal UniformRevenue { get; set; }
    public decimal ScholarshipsGranted { get; set; }
    public decimal FineCollected { get; set; }

    public string FormattedExpected => $"₹{TotalExpectedRevenue:N0}";
    public string FormattedCollected => $"₹{TotalCollectedRevenue:N0}";
    public string FormattedOutstanding => $"₹{TotalOutstandingDues:N0}";
    public string FormattedConcessions => $"₹{TotalConcessionsGranted:N0}";
    public string FormattedToday => $"₹{TodayCollectionAmount:N0}";
    public string FormattedMonthly => $"₹{MonthlyCollectionAmount:N0}";
    public string FormattedTransport => $"₹{TransportRevenue:N0}";
    public string FormattedHostel => $"₹{HostelRevenue:N0}";
    public string FormattedUniform => $"₹{UniformRevenue:N0}";
    public string FormattedScholarships => $"₹{ScholarshipsGranted:N0}";
    public string FormattedFine => $"₹{FineCollected:N0}";

    public List<ClassWiseCollectionShareDto> ClassWiseRevenue { get; set; } = new();
    public List<MonthlyCollectionTrendDto> MonthlyTrends { get; set; } = new();
    public List<FeeHeadCollectionShareDto> HeadWiseDistribution { get; set; } = new();
    public List<PaymentModeSplitDto> PaymentModeDistribution { get; set; } = new();
    public List<FeeReceiptDetailDto> RecentTransactions { get; set; } = new();
}