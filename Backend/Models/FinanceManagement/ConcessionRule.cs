using System;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models.FinanceManagement;

public class ConcessionRule
{
    [Key]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Type { get; set; } = "Discount"; // Scholarship, Sibling Discount, Staff Child Discount, Merit Discount, Waiver
    public string DiscountType { get; set; } = "Percentage"; // Percentage, Flat
    public decimal Value { get; set; }
    public int? ApplicableFeeHeadId { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
