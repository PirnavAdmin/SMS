using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using SMS.Api.Dtos;

namespace SMS.Api.Services.Interfaces.Settings
{
    public interface ISettingsService
    {
        Task<SchoolSettingsDto> GetSettingsAsync();
        Task<SchoolSettingsDto> UpdateSettingsAsync(SchoolSettingsDto dto);
        Task<string> UploadLogoAsync(UploadLogoDto dto);
        Task<string> UploadLogoFileAsync(IFormFile file);
        Task<bool> UpdateCertificateTemplatesAsync(object templates);
        Task<bool> UpdateCampusesAsync(object campuses);
        Task<IdSequenceSettingsDto> GetIdSequenceSettingsAsync();
        Task<IdSequenceSettingsDto> UpdateIdSequenceSettingsAsync(IdSequenceSettingsDto dto);
        Task<GeneratedIdResponseDto> GenerateNextIdAsync(string type, string? customId = null);
        Task<bool> DeleteCustomIdFormatAsync(string formatKey);
        Task<AutomatedIdFormatDto> AddOrUpdateCustomIdFormatAsync(CustomIdSequenceDto dto);
        Task<UserProfileDto> GetUserProfileAsync(string? userId = null, string? email = null, string? mobile = null, string? claimName = null, string? claimRole = null);
        Task<UserProfileDto> UpdateUserProfileAsync(UserProfileDto dto, string? userId = null, string? claimEmail = null);
        Task<string> UploadProfileImageFileAsync(IFormFile file, string? userId = null, string? claimEmail = null);
    }
}
