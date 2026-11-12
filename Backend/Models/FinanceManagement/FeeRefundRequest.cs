using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.FinanceManagement;

[Table("fee_refund_requests")]
public class FeeRefundRequest
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string RefundNo { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ReceiptNo { get; set; } = string.Empty;

    public int StudentId { get; set; }

    [MaxLength(100)]
    public string AdmissionNo { get; set; } = string.Empty;

    [MaxLength(150)]
    public string StudentName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ClassName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Section { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal RefundAmount { get; set; }

    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Rejected", "Disbursed"

    [MaxLength(150)]
    public string RequestedBy { get; set; } = "Admin";

    [MaxLength(150)]
    public string ApprovedBy { get; set; } = string.Empty;

    public DateTime RequestedDate { get; set; } = DateTime.UtcNow;

    public DateTime? ProcessedDate { get; set; }

    [MaxLength(50)]
    public string PaymentMode { get; set; } = "Bank Transfer";

    [MaxLength(500)]
    public string Remarks { get; set; } = string.Empty;
}
