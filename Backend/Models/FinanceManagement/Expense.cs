using System;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models.FinanceManagement;

public class Expense
{
    [Key]
    public int Id { get; set; }
    public string ExpenseNo { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string Category { get; set; } = string.Empty;
    public string Vendor { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int? FinancialAccountId { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string ReferenceNo { get; set; } = string.Empty;
    public string Status { get; set; } = "Approved"; // Draft, Submitted, Approved, Paid, Rejected
    public int AcademicYearId { get; set; }
    public int BranchId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
