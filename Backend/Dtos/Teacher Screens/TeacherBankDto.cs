namespace SMS.Api.Dtos.TeacherScreens;

using System.ComponentModel.DataAnnotations;

public class TeacherBankDto
{
    public int StaffId { get; set; }

    public string AccountHolderName { get; set; } = string.Empty;

    public string BankName { get; set; } = string.Empty;

    public string Branch { get; set; } = string.Empty;

    public string AccountNumber { get; set; } = string.Empty;

    public string IfscCode { get; set; } = string.Empty;

    public string? UpiId { get; set; }
}

public class CreateTeacherBankDto
{
    [Required(ErrorMessage = "Account holder name is required.")]
    public string AccountHolderName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Bank name is required.")]
    public string BankName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Branch is required.")]
    public string Branch { get; set; } = string.Empty;

    [Required(ErrorMessage = "Account number is required.")]
    public string AccountNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Confirm account number is required.")]
    [Compare(nameof(AccountNumber), ErrorMessage = "Account numbers must match.")]
    public string ConfirmAccountNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "IFSC code is required.")]
    public string IfscCode { get; set; } = string.Empty;

    public string? UpiId { get; set; }
}

public class UpdateTeacherBankDto
{
    public string? AccountHolderName { get; set; }

    public string? BankName { get; set; }

    public string? Branch { get; set; }

    public string? AccountNumber { get; set; }

    public string? ConfirmAccountNumber { get; set; }

    public string? IfscCode { get; set; }

    public string? UpiId { get; set; }
}
