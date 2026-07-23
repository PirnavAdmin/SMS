namespace SMS.Api.Dtos;

using System.ComponentModel.DataAnnotations;

public class ResetPasswordDto
{
    [Required]
    public string EmailOrPhone { get; set; } = string.Empty;

    public string? OldPassword { get; set; }

    public string? OtpCode { get; set; }

    [Required]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [Compare(nameof(NewPassword), ErrorMessage = "New password and confirmation password do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}