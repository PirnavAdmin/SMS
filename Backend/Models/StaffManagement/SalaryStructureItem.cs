namespace SMS.Api.Models.StaffManagement;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class SalaryStructureItem
{
    [Key]
    public int ItemId { get; set; }

    [Required]
    public int StructureId { get; set; }

    [ForeignKey("StructureId")]
    public SalaryStructure? Structure { get; set; }

    public string ComponentName { get; set; } = string.Empty;

    public string ComponentType { get; set; } = "Earning";

    public decimal Amount { get; set; }
}

