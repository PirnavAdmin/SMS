using System;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models.FinanceManagement;

public class PaymentAllocation
{
    [Key]
    public int Id { get; set; }
    public int PaymentId { get; set; }
    public int FeeChargeId { get; set; }
    public decimal AllocatedAmount { get; set; }
    public DateTime AllocatedAt { get; set; } = DateTime.UtcNow;
}
