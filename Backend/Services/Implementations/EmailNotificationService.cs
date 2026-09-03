namespace SMS.Api.Services.Implementations;

using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SMS.Api.Services.Interfaces;

public class EmailNotificationService : IEmailNotificationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailNotificationService> _logger;

    public EmailNotificationService(
        IConfiguration configuration,
        ILogger<EmailNotificationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendWelcomeCredentialsAsync(
        string recipientEmail,
        string recipientName,
        string loginIdentifier,
        string defaultPassword,
        string roleName,
        string? portalUrl = null)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail) || !recipientEmail.Contains('@'))
        {
            _logger.LogWarning("[EMAIL] Skipped sending welcome email. Invalid or empty email: {Email}", recipientEmail);
            return;
        }

        try
        {
            var smtpHost = _configuration["Smtp:Host"] ?? "smtp.gmail.com";
            var smtpPort = int.TryParse(_configuration["Smtp:Port"], out var p) ? p : 587;
            var senderEmail = _configuration["Smtp:Email"] ?? "pirnavsms@gmail.com";
            var senderPassword = _configuration["Smtp:Password"] ?? "";

            if (string.IsNullOrWhiteSpace(senderPassword))
            {
                _logger.LogWarning("[EMAIL] SMTP Password not configured. Welcome email not sent.");
                return;
            }

            var loginUrl = !string.IsNullOrWhiteSpace(portalUrl) 
                ? portalUrl 
                : "https://unison-guileless-managing.ngrok-free.dev";

            var cleanName = string.IsNullOrWhiteSpace(recipientName) ? "User" : recipientName.Trim();
            var cleanRole = string.IsNullOrWhiteSpace(roleName) ? "Member" : roleName.Trim();

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, "Pirnav Schools Management"),
                Subject = $"Welcome to Pirnav Schools - Your {cleanRole} Account Credentials",
                IsBodyHtml = true,
                Body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <title>Welcome to Pirnav Schools</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;"">
    <table role=""presentation"" style=""width: 100%; border-collapse: collapse;"">
        <tr>
            <td align=""center"" style=""padding: 30px 15px;"">
                <table role=""presentation"" style=""width: 100%; max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);"">
                    <!-- Header -->
                    <tr>
                        <td style=""background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px 24px; text-align: center;"">
                            <h1 style=""margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;"">PIRNAV SCHOOLS</h1>
                            <p style=""margin: 6px 0 0 0; color: #e0f2fe; font-size: 13px; font-weight: 500;"">School Management & Information System</p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style=""padding: 32px 28px;"">
                            <h2 style=""margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 700;"">Welcome, {WebUtility.HtmlEncode(cleanName)}! 👋</h2>
                            <p style=""margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;"">
                                Your account has been registered successfully on the <strong>Pirnav Schools Portal</strong> with the role of <strong style=""color: #0284c7;"">{WebUtility.HtmlEncode(cleanRole)}</strong>.
                            </p>
                            <p style=""margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;"">
                                Below are your login credentials:
                            </p>
                            
                            <!-- Credentials Card -->
                            <div style=""background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;"">
                                <table style=""width: 100%; border-collapse: collapse;"">
                                    <tr>
                                        <td style=""padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 40%;"">Login ID / Username:</td>
                                        <td style=""padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 700;"">{WebUtility.HtmlEncode(loginIdentifier)}</td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 600;"">Default Password:</td>
                                        <td style=""padding: 6px 0; color: #0284c7; font-size: 15px; font-weight: 800; font-family: monospace;"">{WebUtility.HtmlEncode(defaultPassword)}</td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 600;"">Assigned Role:</td>
                                        <td style=""padding: 6px 0; color: #0f172a; font-size: 13px; font-weight: 600;"">{WebUtility.HtmlEncode(cleanRole)}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- CTA Button -->
                            <div style=""text-align: center; margin: 28px 0;"">
                                <a href=""{loginUrl}"" style=""display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);"">
                                    Log In to School Portal
                                </a>
                            </div>

                            <p style=""margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center;"">
                                For security reasons, we recommend changing your password after your first login.<br>
                                If you did not expect this email, please contact school administration.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style=""background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;"">
                            <p style=""margin: 0; color: #64748b; font-size: 12px;"">© 2026 Pirnav Schools. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"
            };

            mailMessage.To.Add(recipientEmail);
            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("[EMAIL] Welcome credentials email sent successfully to {Email} for {Name} ({Role})", recipientEmail, cleanName, cleanRole);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[EMAIL ERROR] Failed to send welcome email to {Email}", recipientEmail);
        }
    }
}
