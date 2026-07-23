namespace SMS.Api.Services.Implementations;

using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using SMS.Api.Dtos.Otp;
using SMS.Api.Dtos;
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
        // 1. Resolve User
        var user = await _userRepository.GetByIdentifierAsync(dto.EmailOrPhone)
            ?? throw new Exception("User not found.");

        // 2. Generate 6-digit OTP
        var rawOtpCode = new Random().Next(100000, 999999).ToString();

        Console.WriteLine("=================================================");
        Console.WriteLine($"[DEV DEBUG] Generated OTP for {dto.EmailOrPhone} (UserId: {user.UserId}): {rawOtpCode}");
        Console.WriteLine($"[DEV DEBUG] Delivery Method: {dto.DeliveryMethod}");
        Console.WriteLine("=================================================");

        // 3. Save OTP in DB
        await _otpRepository.SaveOtpAsync(new OtpVerification
        {
            UserId = user.UserId,
            OtpCodeHash = BCrypt.Net.BCrypt.HashPassword(rawOtpCode),
            Purpose = "General",
            DeliveryMethod = dto.DeliveryMethod,
            ExpiryTime = DateTime.UtcNow.AddMinutes(5),
            CreatedAt = DateTime.UtcNow
        });

        // 4. Send plain code via Email or SMS
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
        var user = await _userRepository.GetByIdentifierAsync(dto.EmailOrPhone);
        if (user == null)
        {
            Console.WriteLine($"[OTP VERIFY FAILED] User not found: {dto.EmailOrPhone}");
            return false;
        }

        var latestOtp = await _otpRepository.GetLatestActiveOtpAsync(user.UserId, "General");

        if (latestOtp == null)
        {
            Console.WriteLine($"[OTP VERIFY FAILED] No active OTP found for UserId: {user.UserId}");
            return false;
        }

        if (latestOtp.ExpiryTime <= DateTime.UtcNow)
        {
            Console.WriteLine($"[OTP VERIFY FAILED] OTP expired for UserId: {user.UserId}");
            return false;
        }

        bool isValid = BCrypt.Net.BCrypt.Verify(dto.OtpCode, latestOtp.OtpCodeHash);

        if (isValid)
        {
            Console.WriteLine($"[OTP VERIFY SUCCESS] OTP validated for: {dto.EmailOrPhone}");
        }
        else
        {
            Console.WriteLine($"[OTP VERIFY FAILED] Invalid OTP code for: {dto.EmailOrPhone}");
        }

        return isValid;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await _userRepository.GetByIdentifierAsync(dto.EmailOrPhone);
        if (user == null)
        {
            Console.WriteLine($"[RESET FAILED] User not found: {dto.EmailOrPhone}");
            throw new Exception("User not found.");
        }

        bool isAuthorized = false;

        // Option A: Old Password Verification
        if (!string.IsNullOrWhiteSpace(dto.OldPassword))
        {
            isAuthorized = BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash);
            if (!isAuthorized)
            {
                Console.WriteLine($"[RESET FAILED] Incorrect old password for: {dto.EmailOrPhone}");
                throw new Exception("Incorrect old password.");
            }
        }
        // Option B: OTP Verification
        else if (!string.IsNullOrWhiteSpace(dto.OtpCode))
        {
            isAuthorized = await VerifyOtpAsync(new VerifyOtpRequestDto(
                dto.EmailOrPhone,
                dto.OtpCode
            ));

            if (!isAuthorized)
            {
                Console.WriteLine($"[RESET FAILED] Invalid or expired OTP for: {dto.EmailOrPhone}");
                throw new Exception("Invalid or expired OTP code.");
            }

            var latestOtp = await _otpRepository.GetLatestActiveOtpAsync(user.UserId, "General");
            if (latestOtp != null)
            {
                latestOtp.IsUsed = true;
                await _otpRepository.SaveChangesAsync();
            }
        }
        else
        {
            throw new Exception("Please provide either your Old Password or an OTP code to reset your password.");
        }

        // Hash new password & save to DB
        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _userRepository.UpdatePasswordAsync(user.UserId, newPasswordHash);

        Console.WriteLine($"[RESET SUCCESS] Password updated in DB for: {dto.EmailOrPhone}");
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
            client.DefaultRequestHeaders.Add("authorization", apiKey);

            var cleanMobile = new string(mobileNumber.Where(char.IsDigit).ToArray());
            if (cleanMobile.Length > 10)
            {
                cleanMobile = cleanMobile.Substring(cleanMobile.Length - 10);
            }

            var messageText = Uri.EscapeDataString($"Your verification code is {plainOtp}. Valid for 5 minutes.");
            var requestUrl = $"https://www.fast2sms.com/dev/bulkV2?route=q&message={messageText}&flash=0&numbers={cleanMobile}";

            var response = await client.GetAsync(requestUrl);
            var responseString = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"[SMS GATEWAY RESPONSE]: Status: {response.StatusCode} | Body: {responseString}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SMS EXCEPTION] Failed to send SMS: {ex.Message}");
        }
    }
}