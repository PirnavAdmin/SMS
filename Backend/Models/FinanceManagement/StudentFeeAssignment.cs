using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace SMS.Api.Models.FinanceManagement;

[Table("student_fee_assignments")]
public class StudentFeeAssignment
{
    [Key]
    public int Id { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public int? DynamicFeeStructureId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DueAmount { get; set; }
    public string Status { get; set; } = "Active";
    public string FeePolicy { get; set; } = string.Empty;
}
