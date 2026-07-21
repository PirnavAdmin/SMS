namespace SMS.Api.Services.Implementations;

using System;
using System.Net;
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
        var user = await _userRepository.GetByIdentifierAsync(dto.Identifier)
            ?? throw new Exception("User not found.");

        // Generate 6-digit random plain OTP
        var rawOtpCode = new Random().Next(100000, 999999).ToString();

        // Invalidate previous active OTPs
        await _otpRepository.InvalidateExistingOtpsAsync(user.UserId, dto.Purpose);

        // Save OTP using your exact model properties
        await _otpRepository.SaveOtpAsync(new OtpVerification
        {
            UserId = user.UserId,
            OtpCodeHash = BCrypt.Net.BCrypt.HashPassword(rawOtpCode), // Hashed for DB security
            Purpose = dto.Purpose,
            DeliveryMethod = dto.DeliveryMethod,
            ExpiryTime = DateTime.UtcNow.AddMinutes(5),
            CreatedAt = DateTime.UtcNow
        });
        await _otpRepository.SaveChangesAsync();

        // Dispatch plain OTP to Email/SMS
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
        var latestOtp = await _otpRepository.GetLatestActiveOtpAsync(dto.UserId, dto.Purpose);

        if (latestOtp == null || latestOtp.IsUsed || latestOtp.ExpiryTime < DateTime.UtcNow)
        {
            return false;
        }

        // Verify plain OTP against the hashed value in DB
        bool isValid = BCrypt.Net.BCrypt.Verify(dto.OtpCode, latestOtp.OtpCodeHash);

        if (!isValid)
        {
            latestOtp.AttemptCount += 1;
            await _otpRepository.SaveChangesAsync();
            return false;
        }

        latestOtp.IsUsed = true;
        await _otpRepository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
    {
        // Pass positional arguments: (UserId, OtpCode, Purpose)
        var isVerified = await VerifyOtpAsync(new VerifyOtpRequestDto(
            dto.UserId,
            dto.OtpCode,
            "ForgotPassword"
        ));

        if (!isVerified)
        {
            return false;
        }

        var user = await _userRepository.GetByIdAsync(dto.UserId)
            ?? throw new Exception("User not found.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _userRepository.SaveChangesAsync();
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
            Subject = $"{plainOtp} is your verification code", // Clear subject with code
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

            // Fast2SMS OTP Route URL
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