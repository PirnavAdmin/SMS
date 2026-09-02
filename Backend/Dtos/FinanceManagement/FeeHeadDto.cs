namespace SMS.Api.Dtos.FinanceManagement;

using System.Collections.Generic;

public class FeeHeadDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Category { get; set; } = "Tuition";
    public string Frequency { get; set; } = "Quarterly";
    public decimal DefaultAmount { get; set; }
    public bool Mandatory { get; set; } = true;
    public bool IsRefundable { get; set; }
    public bool IsTaxable { get; set; }
    public decimal TaxPercentage { get; set; }
    public int DisplayOrder { get; set; } = 1;
    public string Status { get; set; } = "Active";
    public string Description { get; set; } = string.Empty;
    public List<string> ApplicableClasses { get; set; } = new();
    public List<string> ApplicableBranches { get; set; } = new() { "Main Campus" };
}