using System.ComponentModel.DataAnnotations;
namespace SMS.Api.Models.FinanceManagement;

public class FeePayment
{
    [Key]
    public int Id { get; set; }
    public string ReceiptNo { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FineAmount { get; set; }
    public decimal TransportFee { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public System.DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = "Completed";
}
