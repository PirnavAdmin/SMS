using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces.Settings;

namespace SMS.Api.Repositories.Implementations.Settings
{
    public class SettingsRepository : ISettingsRepository
    {
        private readonly AppDbContext _context;

        public SettingsRepository(AppDbContext context)
        {
            _context = context;
        }

        private async Task<SchoolSettings> GetOrCreateSettingsInternalAsync()
        {
            var settings = await _context.SchoolSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new SchoolSettings
                {
                    Id = 1,
                    SchoolName = "Pirnav Educational Institutions",
                    Tagline = "Empowering Minds, Shaping Tomorrow",
                    Address = "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081",
                    Phone = "+91 9123456789",
                    Email = "contact@pirnavschools.edu",
                    Website = "https://pirnavschools.edu",
                    PrincipalName = "Dr. Eleanor Vance",
                    LogoUrl = "/pirnav-school-logo.png",
                    LogoFormat = "PNG",
                    CampusesJson = "[]",
                    CertificateTemplatesJson = "[]",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SchoolSettings.Add(settings);
                await _context.SaveChangesAsync();
            }
            return settings;
        }

        public async Task<SchoolSettings> GetSettingsAsync()
        {
            return await GetOrCreateSettingsInternalAsync();
        }

        public async Task<SchoolSettings> UpdateSettingsAsync(SchoolSettings settings)
        {
            var existing = await GetOrCreateSettingsInternalAsync();
            
            if (!string.IsNullOrWhiteSpace(settings.SchoolName)) existing.SchoolName = settings.SchoolName;
            if (settings.Tagline != null) existing.Tagline = settings.Tagline;
            if (settings.Address != null) existing.Address = settings.Address;
            if (settings.Phone != null) existing.Phone = settings.Phone;
            if (settings.Email != null) existing.Email = settings.Email;
            if (settings.Website != null) existing.Website = settings.Website;
            if (settings.PrincipalName != null) existing.PrincipalName = settings.PrincipalName;
            if (settings.LogoUrl != null) existing.LogoUrl = settings.LogoUrl;
            if (!string.IsNullOrWhiteSpace(settings.LogoFormat)) existing.LogoFormat = settings.LogoFormat;
            if (settings.CampusesJson != null) existing.CampusesJson = settings.CampusesJson;
            if (settings.CertificateTemplatesJson != null) existing.CertificateTemplatesJson = settings.CertificateTemplatesJson;
            if (settings.IdSequenceSettingsJson != null) existing.IdSequenceSettingsJson = settings.IdSequenceSettingsJson;

            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<string> UpdateLogoAsync(string logoUrl, string? logoFormat = null)
        {
            var existing = await GetOrCreateSettingsInternalAsync();
            existing.LogoUrl = logoUrl;
            if (!string.IsNullOrWhiteSpace(logoFormat))
            {
                existing.LogoFormat = logoFormat;
            }
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return existing.LogoUrl;
        }

        public async Task<bool> UpdateCertificateTemplatesAsync(string json)
        {
            var existing = await GetOrCreateSettingsInternalAsync();
            existing.CertificateTemplatesJson = json;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateCampusesAsync(string json)
        {
            var existing = await GetOrCreateSettingsInternalAsync();
            existing.CampusesJson = json;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string?> GetIdSequenceSettingsJsonAsync()
        {
            var existing = await GetOrCreateSettingsInternalAsync();
            return existing.IdSequenceSettingsJson;
        }

        public async Task<bool> UpdateIdSequenceSettingsAsync(string json)
        {
            var existing = await GetOrCreateSettingsInternalAsync();
            existing.IdSequenceSettingsJson = json;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
