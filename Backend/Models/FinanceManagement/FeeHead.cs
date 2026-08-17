using System.ComponentModel.DataAnnotations;
namespace SMS.Api.Models.FinanceManagement;

public class FeeHead
{
    [Key]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public decimal DefaultAmount { get; set; }
    public bool IsRefundable { get; set; }
    public bool IsTaxable { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
}
