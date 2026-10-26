namespace SMS.Api.Dtos.Auth;

using System.ComponentModel.DataAnnotations;

public class ChangePasswordRequestDto
{
    public string? EmailOrPhone { get; set; }

    [Required(ErrorMessage = "Current password is required.")]
    public string OldPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required.")]
    [MinLength(6, ErrorMessage = "New password must be at least 6 characters.")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Confirm password is required.")]
    [Compare(nameof(NewPassword), ErrorMessage = "New password and confirmation do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
