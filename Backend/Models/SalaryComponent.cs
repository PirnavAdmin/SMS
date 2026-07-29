namespace SMS.Api.Models;

using System.ComponentModel.DataAnnotations;

public class SalaryComponent
{
    [Key]
    public int ComponentId { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public string Category { get; set; } = "Earning";

    public string Type { get; set; } = "Fixed";

    public decimal Value { get; set; }

    public bool Taxable { get; set; } = true;

    public bool Mandatory { get; set; } = false;

    public string Status { get; set; } = "Active";
}
