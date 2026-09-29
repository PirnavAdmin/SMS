namespace SMS.Api.Controllers.Auth;

using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Otp;
using SMS.Api.Dtos;

using SMS.Api.Services.Interfaces;

[ApiController]
[Route("api/auth/otp")]
public class OtpController : ControllerBase
{
	private readonly IOtpService _otpService;

	public OtpController(IOtpService otpService)
	{
		_otpService = otpService;
	}

	[HttpPost("send")]
	public async Task<IActionResult> SendOtp([FromBody] SendOtpRequestDto dto)
	{
		var response = await _otpService.SendOtpAsync(dto);
		return Ok(response);
	}

	[HttpPost("verify")]
	public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto dto)
	{
		await _otpService.VerifyOtpAsync(dto);
		return Ok(new { Message = "OTP verified successfully." });
	}

	[HttpPost("reset-password")]
	public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
	{
		await _otpService.ResetPasswordAsync(dto);
		return Ok(new { Message = "Password reset successfully." });
	}
}