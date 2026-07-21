using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Otp;

public record ResetPasswordDto(
    [Required] int UserId,
    [Required] string OtpCode,
    [Required] string NewPassword
);