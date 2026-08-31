namespace SMS.Api.Dtos;

public class SalaryComponentDto
{
    public int ComponentId { get; set; }
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "Earning";
    public string Type { get; set; } = "Fixed";
    public decimal Value { get; set; }
    public bool Taxable { get; set; }
    public bool Mandatory { get; set; }
    public string Status { get; set; } = "Active";
}
