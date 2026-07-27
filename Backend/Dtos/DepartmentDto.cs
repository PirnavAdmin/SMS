namespace SMS.Api.Dtos;

using System;

public class DepartmentDto
{
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string? DepartmentCode { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedDate { get; set; }
    public int NumberOfSubjects { get; set; }
}
