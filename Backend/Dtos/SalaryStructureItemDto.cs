namespace SMS.Api.Dtos;

public class SalaryStructureItemDto
{
    public string ComponentName { get; set; } = string.Empty;
    public string ComponentType { get; set; } = "Earning";
    public decimal Amount { get; set; }
}
