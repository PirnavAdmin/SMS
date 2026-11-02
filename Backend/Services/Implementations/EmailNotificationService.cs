namespace SMS.Api.Services.Implementations;

using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SMS.Api.Dtos;
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
                : (_configuration["AppUrl"] ?? "https://roping-crumpled-exclude.ngrok-free.dev");

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
    public async Task<bool> SendParentWelcomeEmailAsync(
        string parentEmail,
        string parentName,
        string studentName,
        string admissionNo,
        string loginEmail,
        string initialPassword,
        bool isNewAccount,
        string? portalUrl = null,
        string? schoolName = null)
    {
        var result = await SendParentWelcomeEmailWithResultAsync(
            parentEmail,
            parentName,
            studentName,
            admissionNo,
            loginEmail,
            initialPassword,
            isNewAccount,
            portalUrl,
            schoolName);
        return result.Success;
    }

    public async Task<EmailDeliveryResultDto> SendParentWelcomeEmailWithResultAsync(
        string parentEmail,
        string parentName,
        string studentName,
        string admissionNo,
        string loginEmail,
        string initialPassword,
        bool isNewAccount,
        string? portalUrl = null,
        string? schoolName = null)
    {
        var result = new EmailDeliveryResultDto();

        if (string.IsNullOrWhiteSpace(parentEmail) || !parentEmail.Contains('@'))
        {
            var msg = $"Skipped sending parent welcome email. Invalid or empty email: '{parentEmail}'";
            _logger.LogWarning("[EMAIL] {Message}", msg);
            result.Success = false;
            result.ErrorMessage = msg;
            return result;
        }

        var cleanSchoolName = !string.IsNullOrWhiteSpace(schoolName) ? schoolName.Trim() : "Pirnav Schools";
        var cleanParentName = !string.IsNullOrWhiteSpace(parentName) ? parentName.Trim() : "Parent / Guardian";
        var cleanStudentName = !string.IsNullOrWhiteSpace(studentName) ? studentName.Trim() : "Student";
        var cleanAdmNo = !string.IsNullOrWhiteSpace(admissionNo) ? admissionNo.Trim() : "N/A";
        var cleanLoginEmail = !string.IsNullOrWhiteSpace(loginEmail) ? loginEmail.Trim() : parentEmail.Trim();

        var loginUrl = !string.IsNullOrWhiteSpace(portalUrl) 
            ? portalUrl 
            : (_configuration["AppUrl"] ?? "http://localhost:5173/login");

        if (!loginUrl.EndsWith("/#login") && !loginUrl.Contains("login"))
        {
            loginUrl = loginUrl.TrimEnd('/') + "/login";
        }

        string passwordRowHtml = isNewAccount
            ? $@"<tr>
                    <td style=""padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;"">Initial Password:</td>
                    <td style=""padding: 8px 0; color: #0284c7; font-size: 14px; font-weight: 700; font-family: monospace;"">{WebUtility.HtmlEncode(initialPassword)}</td>
                </tr>"
            : $@"<tr>
                    <td style=""padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;"">Password:</td>
                    <td style=""padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 600;"">Your existing Parent Portal password</td>
                </tr>";

        string emailBodyHtml = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <title>Parent Portal Welcome - {WebUtility.HtmlEncode(cleanSchoolName)}</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;"">
    <table role=""presentation"" style=""width: 100%; border-collapse: collapse;"">
        <tr>
            <td align=""center"" style=""padding: 30px 15px;"">
                <table role=""presentation"" style=""width: 100%; max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);"">
                    <!-- Header -->
                    <tr>
                        <td style=""background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px 24px; text-align: center;"">
                            <h1 style=""margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;"">{WebUtility.HtmlEncode(cleanSchoolName.ToUpper())}</h1>
                            <p style=""margin: 6px 0 0 0; color: #e0f2fe; font-size: 13px; font-weight: 500;"">Official Parent Portal & Student Information System</p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style=""padding: 32px 28px;"">
                            <h2 style=""margin: 0 0 14px 0; color: #0f172a; font-size: 20px; font-weight: 700;"">Welcome, {WebUtility.HtmlEncode(cleanParentName)}! 👋</h2>
                            <p style=""margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;"">
                                We are pleased to confirm that the enrollment of your child, <strong>{WebUtility.HtmlEncode(cleanStudentName)}</strong> (Admission No: <strong style=""color: #0284c7;"">{WebUtility.HtmlEncode(cleanAdmNo)}</strong>), has been successfully completed.
                            </p>
                            <p style=""margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;"">
                                Your Parent Portal account has been activated. Through this portal, you can monitor your child's academic progress, track real-time attendance, review homework assignments, view examination results, and manage fee dues securely.
                            </p>
                            
                            <!-- Credentials Card -->
                            <div style=""background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;"">
                                <h3 style=""margin: 0 0 12px 0; color: #1e293b; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;"">Parent Portal Credentials</h3>
                                <table style=""width: 100%; border-collapse: collapse;"">
                                    <tr>
                                        <td style=""padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 38%;"">Portal URL:</td>
                                        <td style=""padding: 8px 0; color: #0284c7; font-size: 13px; font-weight: 600;""><a href=""{loginUrl}"" style=""color: #0284c7; text-decoration: underline;"">{WebUtility.HtmlEncode(loginUrl)}</a></td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;"">Login Email / Username:</td>
                                        <td style=""padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 700;"">{WebUtility.HtmlEncode(cleanLoginEmail)}</td>
                                    </tr>
                                    {passwordRowHtml}
                                    <tr>
                                        <td style=""padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;"">Enrolled Student:</td>
                                        <td style=""padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;"">{WebUtility.HtmlEncode(cleanStudentName)} ({WebUtility.HtmlEncode(cleanAdmNo)})</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- CTA Button -->
                            <div style=""text-align: center; margin: 28px 0;"">
                                <a href=""{loginUrl}"" style=""display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);"">
                                    Log In to Parent Portal
                                </a>
                            </div>

                            <!-- Security Advice -->
                            <div style=""background-color: #eff6ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;"">
                                <p style=""margin: 0; color: #1e40af; font-size: 12px; line-height: 1.5;"">
                                    <strong>Security Notice:</strong> Your registered email address is set as your initial login password. You can update your password at any time via the <strong>Change Password</strong> option in your Parent Portal profile.
                                </p>
                            </div>

                            <p style=""margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center;"">
                                If you have any questions or require assistance, please feel free to contact the school administration office.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style=""background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;"">
                            <p style=""margin: 0; color: #64748b; font-size: 12px;"">© {DateTime.UtcNow.Year} {WebUtility.HtmlEncode(cleanSchoolName)}. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

        // Primary SMTP configuration
        var primaryHost = _configuration["Smtp:Host"] ?? "smtp.gmail.com";
        var primaryPort = int.TryParse(_configuration["Smtp:Port"], out var pp) ? pp : 587;
        var primaryEmail = _configuration["Smtp:Email"] ?? "pirnavsms@gmail.com";
        var primaryPassword = _configuration["Smtp:Password"] ?? "";

        // Backup / Secondary SMTP configuration
        var backupHost = _configuration["Smtp:Backup:Host"] ?? _configuration["Smtp:Secondary:Host"];
        var backupPort = int.TryParse(_configuration["Smtp:Backup:Port"] ?? _configuration["Smtp:Secondary:Port"], out var bp) ? bp : 587;
        var backupEmail = _configuration["Smtp:Backup:Email"] ?? _configuration["Smtp:Secondary:Email"];
        var backupPassword = _configuration["Smtp:Backup:Password"] ?? _configuration["Smtp:Secondary:Password"];

        if (string.IsNullOrWhiteSpace(primaryPassword))
        {
            var msg = "SMTP Password not configured in application settings. Welcome email not sent.";
            _logger.LogWarning("[EMAIL] {Message}", msg);
            result.Success = false;
            result.ErrorMessage = msg;
            return result;
        }

        // Try primary provider
        try
        {
            using var client = new SmtpClient(primaryHost, primaryPort)
            {
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(primaryEmail, primaryPassword),
                EnableSsl = true,
                Timeout = 15000
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(primaryEmail, $"{cleanSchoolName} Management"),
                Subject = $"Welcome to {cleanSchoolName} - Parent Portal Access for {cleanStudentName}",
                IsBodyHtml = true,
                Body = emailBodyHtml
            };
            mailMessage.To.Add(parentEmail);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("[EMAIL] Parent welcome credentials email successfully sent to {Email} via primary SMTP ({Host})", parentEmail, primaryHost);

            result.Success = true;
            result.SentAt = DateTime.UtcNow;
            result.ProviderUsed = primaryHost;
            result.ErrorMessage = null;
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[EMAIL] Primary SMTP ({Host}) delivery failed for {Email}: {Message}", primaryHost, parentEmail, ex.Message);

            // Attempt backup provider if configured
            if (!string.IsNullOrWhiteSpace(backupHost) && !string.IsNullOrWhiteSpace(backupPassword))
            {
                try
                {
                    _logger.LogInformation("[EMAIL] Attempting fallback to backup SMTP ({Host}) for {Email}", backupHost, parentEmail);
                    using var backupClient = new SmtpClient(backupHost, backupPort)
                    {
                        UseDefaultCredentials = false,
                        Credentials = new NetworkCredential(backupEmail, backupPassword),
                        EnableSsl = true,
                        Timeout = 15000
                    };

                    using var backupMail = new MailMessage
                    {
                        From = new MailAddress(backupEmail ?? primaryEmail, $"{cleanSchoolName} Management"),
                        Subject = $"Welcome to {cleanSchoolName} - Parent Portal Access for {cleanStudentName}",
                        IsBodyHtml = true,
                        Body = emailBodyHtml
                    };
                    backupMail.To.Add(parentEmail);

                    await backupClient.SendMailAsync(backupMail);
                    _logger.LogInformation("[EMAIL] Parent welcome email delivered successfully via backup SMTP ({Host}) to {Email}", backupHost, parentEmail);

                    result.Success = true;
                    result.SentAt = DateTime.UtcNow;
                    result.ProviderUsed = backupHost;
                    result.ErrorMessage = null;
                    return result;
                }
                catch (Exception backupEx)
                {
                    _logger.LogError(backupEx, "[EMAIL ERROR] Backup SMTP ({Host}) also failed for {Email}: {Message}", backupHost, parentEmail, backupEx.Message);
                }
            }

            // Capture exact structured error message
            string detailedReason;
            if (ex is SmtpException smtpEx)
            {
                if (smtpEx.Message.Contains("Daily user sending limit exceeded", StringComparison.OrdinalIgnoreCase) ||
                    smtpEx.Message.Contains("5.4.5", StringComparison.OrdinalIgnoreCase))
                {
                    detailedReason = "Provider SMTP daily sending limit reached (5.4.5 Daily user sending limit exceeded). Queued for retry.";
                }
                else
                {
                    detailedReason = $"SMTP Error ({smtpEx.StatusCode}): {smtpEx.Message}";
                }
            }
            else
            {
                detailedReason = ex.Message;
            }

            result.Success = false;
            result.ErrorMessage = detailedReason;
            return result;
        }
    }

    public async Task<bool> SendStaffWelcomeEmailAsync(
        string recipientEmail,
        string recipientName,
        string employeeId,
        string employeeCategory,
        string designation,
        string? department = null,
        string? portalUrl = null,
        string? schoolName = null)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail) || !recipientEmail.Contains('@'))
        {
            _logger.LogWarning("[EMAIL] Skipped sending staff welcome email. Invalid or empty email: {Email}", recipientEmail);
            return false;
        }

        try
        {
            var smtpHost = _configuration["Smtp:Host"] ?? "smtp.gmail.com";
            var smtpPort = int.TryParse(_configuration["Smtp:Port"], out var p) ? p : 587;
            var senderEmail = _configuration["Smtp:Email"] ?? "pirnavsms@gmail.com";
            var senderPassword = _configuration["Smtp:Password"] ?? "";

            if (string.IsNullOrWhiteSpace(senderPassword))
            {
                _logger.LogWarning("[EMAIL] SMTP Password not configured. Staff welcome email not sent.");
                return false;
            }

            var cleanSchoolName = !string.IsNullOrWhiteSpace(schoolName) ? schoolName.Trim() : "Pirnav Schools";
            var cleanName = !string.IsNullOrWhiteSpace(recipientName) ? recipientName.Trim() : "Staff Member";
            var cleanEmpId = !string.IsNullOrWhiteSpace(employeeId) ? employeeId.Trim() : "N/A";
            var cleanDesignation = !string.IsNullOrWhiteSpace(designation) ? designation.Trim() : "Staff Member";
            var cleanDept = !string.IsNullOrWhiteSpace(department) ? department.Trim() : "General";

            bool isTeaching = !string.IsNullOrWhiteSpace(employeeCategory) &&
                (employeeCategory.Equals("Teacher", StringComparison.OrdinalIgnoreCase) ||
                 employeeCategory.Equals("Teaching Staff", StringComparison.OrdinalIgnoreCase));

            string categoryLabel = isTeaching ? "Teaching Staff" : "Non-Teaching Staff";
            string idLabel = isTeaching ? "Teaching ID" : "Non-Teaching ID";

            var loginUrl = !string.IsNullOrWhiteSpace(portalUrl) 
                ? portalUrl 
                : (_configuration["AppUrl"] ?? "http://localhost:5173");

            if (!loginUrl.EndsWith("/#login") && !loginUrl.Contains("login"))
            {
                loginUrl = loginUrl.TrimEnd('/') + "/#login";
            }

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, $"{cleanSchoolName} Administration"),
                Subject = $"Welcome to {cleanSchoolName} - Your {idLabel} & Account Credentials",
                IsBodyHtml = true,
                Body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <title>Welcome to {WebUtility.HtmlEncode(cleanSchoolName)} - Staff Account</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;"">
    <table role=""presentation"" style=""width: 100%; border-collapse: collapse;"">
        <tr>
            <td align=""center"" style=""padding: 30px 15px;"">
                <table role=""presentation"" style=""width: 100%; max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);"">
                    <!-- Header -->
                    <tr>
                        <td style=""background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px 24px; text-align: center;"">
                            <h1 style=""margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;"">{WebUtility.HtmlEncode(cleanSchoolName.ToUpper())}</h1>
                            <p style=""margin: 6px 0 0 0; color: #e0f2fe; font-size: 13px; font-weight: 500;"">Official School Management & Staff Information Portal</p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style=""padding: 32px 28px;"">
                            <h2 style=""margin: 0 0 14px 0; color: #0f172a; font-size: 20px; font-weight: 700;"">Welcome, {WebUtility.HtmlEncode(cleanName)}! 👋</h2>
                            <p style=""margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;"">
                                We are pleased to welcome you to <strong>{WebUtility.HtmlEncode(cleanSchoolName)}</strong>. Your official staff profile has been created successfully as <strong>{WebUtility.HtmlEncode(categoryLabel)}</strong> with designation <strong>{WebUtility.HtmlEncode(cleanDesignation)}</strong> ({WebUtility.HtmlEncode(cleanDept)} Department).
                            </p>
                            <p style=""margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;"">
                                Your account has been activated on the school portal. Below are your official staff credentials:
                            </p>

                            <!-- Credentials Box -->
                            <div style=""background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 24px;"">
                                <table style=""width: 100%; border-collapse: collapse;"">
                                    <tr>
                                        <td style=""padding: 7px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 42%;"">Staff Type:</td>
                                        <td style=""padding: 7px 0; color: #0f172a; font-size: 13px; font-weight: 700;"">{WebUtility.HtmlEncode(categoryLabel)}</td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 7px 0; color: #64748b; font-size: 13px; font-weight: 600;"">{WebUtility.HtmlEncode(idLabel)}:</td>
                                        <td style=""padding: 7px 0; color: #0284c7; font-size: 15px; font-weight: 800; font-family: monospace;"">{WebUtility.HtmlEncode(cleanEmpId)}</td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 7px 0; color: #64748b; font-size: 13px; font-weight: 600;"">Login ID / Username:</td>
                                        <td style=""padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 800; font-family: monospace;"">{WebUtility.HtmlEncode(cleanEmpId)}</td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 7px 0; color: #64748b; font-size: 13px; font-weight: 600;"">Initial Password:</td>
                                        <td style=""padding: 7px 0; color: #0284c7; font-size: 15px; font-weight: 800; font-family: monospace;"">{WebUtility.HtmlEncode(cleanEmpId)}</td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 7px 0; color: #64748b; font-size: 13px; font-weight: 600;"">Designation:</td>
                                        <td style=""padding: 7px 0; color: #0f172a; font-size: 13px; font-weight: 600;"">{WebUtility.HtmlEncode(cleanDesignation)}</td>
                                    </tr>
                                    <tr>
                                        <td style=""padding: 7px 0; color: #64748b; font-size: 13px; font-weight: 600;"">Department:</td>
                                        <td style=""padding: 7px 0; color: #0f172a; font-size: 13px; font-weight: 600;"">{WebUtility.HtmlEncode(cleanDept)}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Prominent ID = ID and Password = ID Callout Banner -->
                            <div style=""background: #eff6ff; border: 2px dashed #0284c7; border-radius: 12px; padding: 16px 20px; text-align: center; margin-bottom: 24px;"">
                                <p style=""margin: 0; color: #0369a1; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;"">Quick Login Summary</p>
                                <p style=""margin: 8px 0 0 0; color: #0f172a; font-size: 16px; font-weight: 800; font-family: monospace;"">
                                    id = <span style=""color: #0284c7;"">{WebUtility.HtmlEncode(cleanEmpId)}</span> &nbsp;|&nbsp; password = <span style=""color: #0284c7;"">{WebUtility.HtmlEncode(cleanEmpId)}</span>
                                </p>
                                <p style=""margin: 6px 0 0 0; color: #64748b; font-size: 12px;"">Your login ID and initial password are both set to your {WebUtility.HtmlEncode(idLabel)}.</p>
                            </div>

                            <!-- CTA Button -->
                            <div style=""text-align: center; margin: 28px 0;"">
                                <a href=""{loginUrl}"" style=""display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);"">
                                    Log In to Staff Portal
                                </a>
                            </div>

                            <p style=""margin: 0 0 8px 0; color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;"">
                                You can sign in using your <strong>{WebUtility.HtmlEncode(idLabel)}</strong> (or registered email) with your default password.
                            </p>
                            <p style=""margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center;"">
                                For security reasons, please change your password after your first login.<br>
                                If you have questions or encounter any issues, please contact school administration.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style=""background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;"">
                            <p style=""margin: 0; color: #64748b; font-size: 12px;"">© {DateTime.UtcNow.Year} {WebUtility.HtmlEncode(cleanSchoolName)}. All rights reserved.</p>
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
            _logger.LogInformation("[EMAIL] Staff welcome email sent successfully to {Email} for {Name} (ID: {EmpId}, Category: {Category})", recipientEmail, cleanName, cleanEmpId, categoryLabel);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[EMAIL ERROR] Failed to send staff welcome email to {Email}", recipientEmail);
            return false;
        }
    }
}
