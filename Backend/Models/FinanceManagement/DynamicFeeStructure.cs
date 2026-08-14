using System.ComponentModel.DataAnnotations;
namespace SMS.Api.Models.FinanceManagement;

public class DynamicFeeStructure
{
    [Key]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string StudentCategory { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Active";
}
