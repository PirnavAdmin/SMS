namespace SMS.Api.Services.Interfaces;

using System.Threading.Tasks;

public interface IEmailNotificationService
{
    Task SendWelcomeCredentialsAsync(
        string recipientEmail,
        string recipientName,
        string loginIdentifier,
        string defaultPassword,
        string roleName,
        string? portalUrl = null);

    Task<bool> SendParentWelcomeEmailAsync(
        string parentEmail,
        string parentName,
        string studentName,
        string admissionNo,
        string loginEmail,
        string initialPassword,
        bool isNewAccount,
        string? portalUrl = null,
        string? schoolName = null);
}
