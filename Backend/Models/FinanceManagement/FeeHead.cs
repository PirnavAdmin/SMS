using System.ComponentModel.DataAnnotations;
namespace SMS.Api.Models.FinanceManagement;

public class FeeHead
{
    [Key]
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public decimal DefaultAmount { get; set; }
    public bool Mandatory { get; set; } = true;
    public bool IsRefundable { get; set; }
    public bool IsTaxable { get; set; }
    public decimal TaxPercentage { get; set; }
    public int DisplayOrder { get; set; } = 1;
    public string Status { get; set; } = "Active";
}
