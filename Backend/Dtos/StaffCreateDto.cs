namespace SMS.Api.Dtos;

using System.ComponentModel.DataAnnotations;

public class StaffCreateDto
{
    [Required] public string FirstName { get; set; } = string.Empty;
    [Required] public string LastName { get; set; } = string.Empty;
    [Required][EmailAddress] public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    [Required] public string Designation { get; set; } = string.Empty;
    [Required] public string Department { get; set; } = string.Empty;
    public decimal MonthlySalary { get; set; }
    public string? DateOfBirth { get; set; }
}