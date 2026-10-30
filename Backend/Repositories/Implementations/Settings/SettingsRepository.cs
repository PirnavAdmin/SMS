using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using System.Text.Json;
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
            if (settings.BoardType != null) existing.BoardType = settings.BoardType;
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

            try
            {
                var campuses = JsonSerializer.Deserialize<List<BranchDto>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (campuses != null && campuses.Count > 0)
                {
                    var existingBranches = await _context.Branches.ToListAsync();
                    bool changed = false;

                    foreach (var c in campuses)
                    {
                        if (string.IsNullOrWhiteSpace(c.Name)) continue;

                        int parsedBranchId = 0;
                        if (c.BranchId > 0) parsedBranchId = c.BranchId;
                        else if (!string.IsNullOrWhiteSpace(c.Id) && c.Id.StartsWith("CMP-") && int.TryParse(c.Id.Replace("CMP-", ""), out var pid)) parsedBranchId = pid;
                        else if (!string.IsNullOrWhiteSpace(c.Id) && int.TryParse(c.Id, out var pid2)) parsedBranchId = pid2;

                        var branch = existingBranches.FirstOrDefault(b => 
                            (parsedBranchId > 0 && b.BranchId == parsedBranchId) ||
                            string.Equals(b.BranchName.Trim(), c.Name.Trim(), StringComparison.OrdinalIgnoreCase) ||
                            (!string.IsNullOrWhiteSpace(c.Code) && string.Equals(b.BranchCode.Trim(), c.Code.Trim(), StringComparison.OrdinalIgnoreCase))
                        );

                        if (branch != null)
                        {
                            branch.BranchName = c.Name.Trim();
                            if (!string.IsNullOrWhiteSpace(c.Code)) branch.BranchCode = c.Code.Trim().ToUpper();
                            branch.Address = c.Address?.Trim() ?? "";
                            branch.Phone = c.Phone?.Trim() ?? "";
                            branch.Email = c.Email?.Trim() ?? "";
                            branch.Status = string.IsNullOrWhiteSpace(c.Status) ? "Active" : c.Status;
                            changed = true;
                        }
                        else
                        {
                            _context.Branches.Add(new Branch
                            {
                                BranchName = c.Name.Trim(),
                                BranchCode = !string.IsNullOrWhiteSpace(c.Code) ? c.Code.Trim().ToUpper() : c.Name.Trim().Substring(0, Math.Min(5, c.Name.Trim().Length)).ToUpper(),
                                Address = c.Address?.Trim() ?? "",
                                Phone = c.Phone?.Trim() ?? "",
                                Email = c.Email?.Trim() ?? "",
                                Status = string.IsNullOrWhiteSpace(c.Status) ? "Active" : c.Status
                            });
                            changed = true;
                        }
                    }

                    if (changed)
                    {
                        await _context.SaveChangesAsync();
                    }
                }
            }
            catch { }

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

        public async Task<List<AutomatedIdFormat>> GetAutomatedIdFormatsAsync()
        {
            var formats = await _context.AutomatedIdFormats.OrderBy(f => f.IsCustom).ThenBy(f => f.Id).ToListAsync();
            if (formats.Count == 0)
            {
                var defaults = new List<AutomatedIdFormat>
                {
                    new AutomatedIdFormat { FormatKey = "student", Name = "Student ID", Prefix = "", StartNo = 0, Padding = 0, IncludeYear = true, Separator = "", Position = "", IsCustom = false },
                    new AutomatedIdFormat { FormatKey = "teaching", Name = "Teaching Staff ID", Prefix = "", StartNo = 0, Padding = 0, IncludeYear = true, Separator = "", Position = "", IsCustom = false },
                    new AutomatedIdFormat { FormatKey = "non-teaching", Name = "Non-Teaching Staff ID", Prefix = "", StartNo = 0, Padding = 0, IncludeYear = true, Separator = "", Position = "", IsCustom = false },
                    new AutomatedIdFormat { FormatKey = "admission", Name = "Admission No", Prefix = "", StartNo = 0, Padding = 0, IncludeYear = true, Separator = "", Position = "", IsCustom = false }
                };
                _context.AutomatedIdFormats.AddRange(defaults);
                await _context.SaveChangesAsync();
                return defaults;
            }
            return formats;
        }

        public async Task<AutomatedIdFormat> SaveOrUpdateIdFormatAsync(AutomatedIdFormat format)
        {
            var existing = await _context.AutomatedIdFormats.FirstOrDefaultAsync(f => f.FormatKey == format.FormatKey);
            if (existing == null)
            {
                format.CreatedAt = DateTime.UtcNow;
                format.UpdatedAt = DateTime.UtcNow;
                _context.AutomatedIdFormats.Add(format);
                await _context.SaveChangesAsync();
                return format;
            }

            if (existing.IsCustom && !string.IsNullOrWhiteSpace(format.Name))
            {
                existing.Name = format.Name;
            }
            existing.Prefix = format.Prefix;
            existing.StartNo = format.StartNo;
            existing.Padding = format.Padding;
            existing.IncludeYear = format.IncludeYear;
            existing.Separator = format.Separator;
            existing.Position = format.Position;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteCustomIdFormatAsync(string formatKey)
        {
            var existing = await _context.AutomatedIdFormats.FirstOrDefaultAsync(f => f.FormatKey == formatKey && f.IsCustom);
            if (existing != null)
            {
                _context.AutomatedIdFormats.Remove(existing);
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        public async Task<bool> BulkSaveIdFormatsAsync(List<AutomatedIdFormat> incomingFormats)
        {
            var existingFormats = await _context.AutomatedIdFormats.ToListAsync();
            var incomingKeys = incomingFormats.Select(f => f.FormatKey).ToHashSet(StringComparer.OrdinalIgnoreCase);

            // 1. Remove custom formats that were deleted from the UI
            var toRemove = existingFormats.Where(f => f.IsCustom && !incomingKeys.Contains(f.FormatKey)).ToList();
            if (toRemove.Count > 0)
            {
                _context.AutomatedIdFormats.RemoveRange(toRemove);
            }

            // 2. Update or insert formats
            foreach (var inc in incomingFormats)
            {
                var match = existingFormats.FirstOrDefault(f => string.Equals(f.FormatKey, inc.FormatKey, StringComparison.OrdinalIgnoreCase));
                if (match != null)
                {
                    if (match.IsCustom && !string.IsNullOrWhiteSpace(inc.Name))
                    {
                        match.Name = inc.Name;
                    }
                    match.Prefix = inc.Prefix;
                    match.StartNo = inc.StartNo;
                    match.Padding = inc.Padding;
                    match.IncludeYear = inc.IncludeYear;
                    match.Separator = inc.Separator;
                    match.Position = inc.Position;
                    match.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    inc.CreatedAt = DateTime.UtcNow;
                    inc.UpdatedAt = DateTime.UtcNow;
                    _context.AutomatedIdFormats.Add(inc);
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<SchoolSettings> UpdateUserProfileAsync(string userProfileJson)
        {
            var existing = await GetOrCreateSettingsInternalAsync();
            existing.UserProfileJson = userProfileJson;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return existing;
        }
    }
}
