using System;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models.FinanceManagement;

public class LedgerEntry
{
    [Key]
    public int Id { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string TransactionType { get; set; } = "Fee Payment"; // Fee Payment, Expense, Refund, Adjustment
    public string ReferenceNo { get; set; } = string.Empty;
    public int? FinancialAccountId { get; set; }
    public int? StudentId { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public decimal Balance { get; set; }
    public string Particulars { get; set; } = string.Empty;
    public string Category { get; set; } = "Income"; // Income, Expense, Transfer
    public int AcademicYearId { get; set; }
    public int BranchId { get; set; }
}
