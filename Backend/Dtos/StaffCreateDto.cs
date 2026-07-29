namespace SMS.Api.Dtos;

using System.ComponentModel.DataAnnotations;

public class StaffCreateDto
{
    public string? EmployeeId { get; set; } // Optional: auto-generated if omitted
    public string EmployeeCategory { get; set; } = "Teaching Staff";
    [Required] public string FirstName { get; set; } = string.Empty;
    [Required] public string LastName { get; set; } = string.Empty;
    [Required][EmailAddress] public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Gender { get; set; }
    public string? DateOfBirth { get; set; }
    public string? ResidentialAddress { get; set; }

    [Required] public string Designation { get; set; } = string.Empty;
    [Required] public string Department { get; set; } = string.Empty;
    public string? SystemRole { get; set; }
    public string? JoiningDate { get; set; }
    public string? Qualification { get; set; }

    public string? PrimarySubject { get; set; }
    public string? Specialization { get; set; }

    public decimal MonthlySalary { get; set; }

    // Bank Account Information
    public string? AccountHolderName { get; set; }
    public string? AccountNumber { get; set; }
    public string? BankName { get; set; }
    public string? BranchName { get; set; }
    public string? IfscCode { get; set; }
    public string? UpiId { get; set; }
}