namespace SMS.Api.Services.Implementations;

using System;
using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using SMS.Api.Dtos.Otp;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

public class OtpService : IOtpService
{
    private readonly IOtpRepository _otpRepository;
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public OtpService(
        IOtpRepository otpRepository,
        IUserRepository userRepository,
        IConfiguration configuration)
    {
        _otpRepository = otpRepository;
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public async Task<SendOtpResponseDto> SendOtpAsync(SendOtpRequestDto dto)
    {
        // 1. Fetch user by email or mobile via sp_GetUserForLogin
        var user = await _userRepository.GetByIdentifierAsync(dto.EmailOrPhone)
            ?? throw new Exception("User not found.");

        // 2. Generate 6-digit plain OTP
        var rawOtpCode = new Random().Next(100000, 999999).ToString();

        // 3. Save OTP via sp_SaveOtp (handles invalidating older active OTPs automatically)
        await _otpRepository.SaveOtpAsync(new OtpVerification
        {
            UserId = user.UserId,
            OtpCodeHash = BCrypt.Net.BCrypt.HashPassword(rawOtpCode),
            Purpose = dto.Purpose,
            DeliveryMethod = dto.DeliveryMethod,
            ExpiryTime = DateTime.UtcNow.AddMinutes(5),
            CreatedAt = DateTime.UtcNow
        });

        // 4. Dispatch plain OTP code via Email or SMS
        if (dto.DeliveryMethod.Equals("Email", StringComparison.OrdinalIgnoreCase))
        {
            await SendEmailAsync(user.Email!, rawOtpCode);
        }
        else if (dto.DeliveryMethod.Equals("SMS", StringComparison.OrdinalIgnoreCase))
        {
            await SendSmsAsync(user.MobileNumber, rawOtpCode);
        }

        return new SendOtpResponseDto
        {
            Message = $"OTP sent successfully to your {dto.DeliveryMethod}.",
            DeliveryMethod = dto.DeliveryMethod
        };
    }

    public async Task<bool> VerifyOtpAsync(VerifyOtpRequestDto dto)
    {
        // 1. Fetch latest active OTP record to compare hashed code via BCrypt
        var latestOtp = await _otpRepository.GetLatestActiveOtpAsync(dto.UserId, dto.Purpose);

        if (latestOtp == null)
        {
            return false;
        }

        // 2. Delegate validation, expiry checks, and attempt counter to sp_ValidateOtp
        return await _otpRepository.ValidateOtpAsync(dto.UserId, latestOtp.OtpCodeHash, dto.Purpose);
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
    {
        // 1. Verify OTP eligibility
        var isVerified = await VerifyOtpAsync(new VerifyOtpRequestDto(
            dto.UserId,
            dto.OtpCode,
            "ForgotPassword"
        ));

        if (!isVerified)
        {
            return false;
        }

        // 2. Hash new password and update directly via sp_ResetPassword
        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _userRepository.UpdatePasswordAsync(dto.UserId, newPasswordHash);

        return true;
    }

    private async Task SendEmailAsync(string toEmail, string plainOtp)
    {
        var smtpHost = _configuration["Smtp:Host"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(_configuration["Smtp:Port"] ?? "587");
        var senderEmail = _configuration["Smtp:Email"];
        var senderPassword = _configuration["Smtp:Password"];

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(senderEmail, senderPassword),
            EnableSsl = true
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(senderEmail!, "Pirnav School Management"),
            Subject = $"{plainOtp} is your verification code",
            IsBodyHtml = true,
            Body = $@"
            <!DOCTYPE html>
            <html>
            <body style='font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;'>
                <div style='max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px;'>
                    <h2 style='color: #2c3e50; margin-bottom: 10px;'>Verification Code</h2>
                    <p style='color: #555555; font-size: 14px;'>Use the following One-Time Password (OTP) to complete your request:</p>
                    <div style='background: #eef2f7; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;'>
                        <span style='font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1a365d;'>{plainOtp}</span>
                    </div>
                    <p style='color: #777777; font-size: 12px;'>This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
                </div>
            </body>
            </html>"
        };

        mailMessage.To.Add(toEmail);
        await client.SendMailAsync(mailMessage);
    }

    private async Task SendSmsAsync(string mobileNumber, string plainOtp)
    {
        var apiKey = _configuration["Sms:Fast2SmsApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            Console.WriteLine("[SMS WARNING] Fast2SmsApiKey is missing in appsettings.json.");
            return;
        }

        try
        {
            using var client = new HttpClient();

            var requestUrl = $"https://www.fast2sms.com/dev/bulkV2?authorization={apiKey}&route=otp&variables_values={plainOtp}&numbers={mobileNumber}";

            var response = await client.GetAsync(requestUrl);
            var responseString = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[SMS SUCCESS] OTP successfully sent to {mobileNumber}. Gateway Response: {responseString}");
            }
            else
            {
                Console.WriteLine($"[SMS ERROR] Fast2SMS Gateway returned an error: {responseString}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SMS EXCEPTION] Failed to send SMS: {ex.Message}");
        }
    }
}