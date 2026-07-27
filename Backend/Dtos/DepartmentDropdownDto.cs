namespace SMS.Api.Dtos;

public class DepartmentDropdownDto
{
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string? DepartmentCode { get; set; }
    public string DisplayText => string.IsNullOrWhiteSpace(DepartmentCode) ? DepartmentName : $"{DepartmentName} ({DepartmentCode})";
}
