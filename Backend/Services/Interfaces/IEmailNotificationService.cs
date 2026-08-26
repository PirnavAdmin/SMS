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
}
