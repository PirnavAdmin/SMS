using System;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models.FinanceManagement;

public class FeeCharge
{
    [Key]
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public int AcademicYearId { get; set; }
    public int BranchId { get; set; }
    public int FeeHeadId { get; set; }
    public int? FeeStructureId { get; set; }
    public string TermName { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal ScholarshipAmount { get; set; }
    public decimal FineAmount { get; set; }
    public decimal NetAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal OutstandingAmount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, PartiallyPaid, Paid, Overdue, Cancelled
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
