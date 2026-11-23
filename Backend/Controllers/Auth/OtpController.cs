namespace SMS.Api.Controllers.Auth;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Otp;
using SMS.Api.Dtos;

using SMS.Api.Services.Interfaces;

[ApiController]
[AllowAnonymous]
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
		try
		{
			var response = await _otpService.SendOtpAsync(dto);
			return Ok(response);
		}
		catch (Exception ex)
		{
			return BadRequest(new { Message = ex.Message });
		}
	}

	[HttpPost("verify")]
	public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto dto)
	{
		try
		{
			var isValid = await _otpService.VerifyOtpAsync(dto);
			if (!isValid)
			{
				return BadRequest(new { Message = "Incorrect or expired verification code. Please check and try again." });
			}
			return Ok(new { Message = "OTP verified successfully." });
		}
		catch (Exception ex)
		{
			return BadRequest(new { Message = ex.Message });
		}
	}

	[HttpPost("reset-password")]
	public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
	{
		try
		{
			var isSuccess = await _otpService.ResetPasswordAsync(dto);
			if (!isSuccess)
			{
				return BadRequest(new { Message = "Password reset failed. Please ensure the verification code is valid." });
			}
			return Ok(new { Message = "Password reset successfully." });
		}
		catch (Exception ex)
		{
			return BadRequest(new { Message = ex.Message });
		}
	}
}