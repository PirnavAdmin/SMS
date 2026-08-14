using System.ComponentModel.DataAnnotations;
namespace SMS.Api.Models.FinanceManagement;

public class FeeStructureItem
{
    [Key]
    public int Id { get; set; }
    public int DynamicFeeStructureId { get; set; }
    public int FeeHeadId { get; set; }
    public decimal Amount { get; set; }
}
