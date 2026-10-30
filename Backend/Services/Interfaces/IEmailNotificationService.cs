namespace SMS.Api.Services.Interfaces;

using System.Threading.Tasks;
using SMS.Api.Dtos;

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

    Task<EmailDeliveryResultDto> SendParentWelcomeEmailWithResultAsync(
        string parentEmail,
        string parentName,
        string studentName,
        string admissionNo,
        string loginEmail,
        string initialPassword,
        bool isNewAccount,
        string? portalUrl = null,
        string? schoolName = null);

    Task<bool> SendStaffWelcomeEmailAsync(
        string recipientEmail,
        string recipientName,
        string employeeId,
        string employeeCategory,
        string designation,
        string? department = null,
        string? portalUrl = null,
        string? schoolName = null);
}
