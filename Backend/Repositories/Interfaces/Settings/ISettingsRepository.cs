using System.Threading.Tasks;
using SMS.Api.Models;

namespace SMS.Api.Repositories.Interfaces.Settings
{
    public interface ISettingsRepository
    {
        Task<SchoolSettings> GetSettingsAsync();
        Task<SchoolSettings> UpdateSettingsAsync(SchoolSettings settings);
        Task<string> UpdateLogoAsync(string logoUrl, string? logoFormat = null);
        Task<bool> UpdateCertificateTemplatesAsync(string json);
        Task<bool> UpdateCampusesAsync(string json);
        Task<string?> GetIdSequenceSettingsJsonAsync();
        Task<bool> UpdateIdSequenceSettingsAsync(string json);
    }
}
