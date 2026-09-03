using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces.Settings;
using SMS.Api.Services.Interfaces.Settings;

namespace SMS.Api.Services.Implementations.Settings
{
    public class SettingsService : ISettingsService
    {
        private readonly ISettingsRepository _repository;
        private readonly IWebHostEnvironment _env;

        public SettingsService(ISettingsRepository repository, IWebHostEnvironment env)
        {
            _repository = repository;
            _env = env;
        }

        public async Task<SchoolSettingsDto> GetSettingsAsync()
        {
            var s = await _repository.GetSettingsAsync();

            object? campuses = null;
            if (!string.IsNullOrWhiteSpace(s.CampusesJson))
            {
                try { campuses = JsonSerializer.Deserialize<object>(s.CampusesJson); } catch { }
            }

            object? certificateTemplates = null;
            if (!string.IsNullOrWhiteSpace(s.CertificateTemplatesJson))
            {
                try { certificateTemplates = JsonSerializer.Deserialize<object>(s.CertificateTemplatesJson); } catch { }
            }

            return new SchoolSettingsDto
            {
                SchoolName = s.SchoolName,
                Tagline = s.Tagline,
                Address = s.Address,
                Phone = s.Phone,
                Email = s.Email,
                Website = s.Website,
                PrincipalName = s.PrincipalName,
                LogoUrl = s.LogoUrl ?? string.Empty,
                LogoFormat = s.LogoFormat,
                Campuses = campuses,
                CertificateTemplates = certificateTemplates
            };
        }

        public async Task<SchoolSettingsDto> UpdateSettingsAsync(SchoolSettingsDto dto)
        {
            var entity = new SchoolSettings
            {
                SchoolName = dto.SchoolName,
                Tagline = dto.Tagline,
                Address = dto.Address,
                Phone = dto.Phone,
                Email = dto.Email,
                Website = dto.Website,
                PrincipalName = dto.PrincipalName,
                LogoUrl = dto.LogoUrl ?? string.Empty,
                LogoFormat = dto.LogoFormat,
                CampusesJson = dto.Campuses != null ? JsonSerializer.Serialize(dto.Campuses) : null,
                CertificateTemplatesJson = dto.CertificateTemplates != null ? JsonSerializer.Serialize(dto.CertificateTemplates) : null
            };

            var updated = await _repository.UpdateSettingsAsync(entity);
            return await GetSettingsAsync();
        }

        public async Task<string> UploadLogoAsync(UploadLogoDto dto)
        {
            if (dto == null)
                throw new ArgumentException("Logo payload is required.");

            string logoUrl = dto.LogoData?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(logoUrl))
            {
                var cleared = await _repository.UpdateLogoAsync(string.Empty, null);
                return cleared;
            }

            // If base64 image data is provided, save it as a physical file
            if (logoUrl.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var parts = logoUrl.Split(',');
                    if (parts.Length == 2)
                    {
                        var header = parts[0];
                        var base64Data = parts[1];
                        var ext = ".png";
                        if (header.Contains("image/jpeg") || header.Contains("image/jpg")) ext = ".jpg";
                        else if (header.Contains("image/svg")) ext = ".svg";
                        else if (header.Contains("image/webp")) ext = ".webp";

                        var bytes = Convert.FromBase64String(base64Data);
                        var fileName = $"school-logo-{DateTime.UtcNow.Ticks}{ext}";

                        // 1. Save to wwwroot/uploads/branding
                        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                        var uploadFolder = Path.Combine(webRoot, "uploads", "branding");
                        Directory.CreateDirectory(uploadFolder);
                        var filePath = Path.Combine(uploadFolder, fileName);
                        await File.WriteAllBytesAsync(filePath, bytes);

                        // 2. Also mirror to Frontend/school-management-system/public/uploads/branding
                        try
                        {
                            var frontendUploadFolder = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", "school-management-system", "public", "uploads", "branding"));
                            Directory.CreateDirectory(frontendUploadFolder);
                            var frontendFilePath = Path.Combine(frontendUploadFolder, fileName);
                            await File.WriteAllBytesAsync(frontendFilePath, bytes);
                        }
                        catch { }

                        logoUrl = $"/uploads/branding/{fileName}";
                    }
                }
                catch { }
            }

            var savedLogo = await _repository.UpdateLogoAsync(logoUrl, dto.LogoFormat);
            return savedLogo;
        }

        public async Task<string> UploadLogoFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file was uploaded.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".png", ".jpg", ".jpeg", ".webp", ".svg" };
            if (Array.IndexOf(allowedExtensions, ext) < 0)
            {
                ext = ".png";
            }

            var fileName = $"school-logo-{DateTime.UtcNow.Ticks}{ext}";

            // 1. Save to wwwroot/uploads/branding
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadFolder = Path.Combine(webRoot, "uploads", "branding");
            Directory.CreateDirectory(uploadFolder);
            var filePath = Path.Combine(uploadFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 2. Mirror to Frontend public folder
            try
            {
                var frontendUploadFolder = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", "school-management-system", "public", "uploads", "branding"));
                Directory.CreateDirectory(frontendUploadFolder);
                var frontendFilePath = Path.Combine(frontendUploadFolder, fileName);
                File.Copy(filePath, frontendFilePath, true);
            }
            catch { }

            var logoUrl = $"/uploads/branding/{fileName}";
            var format = ext.TrimStart('.').ToUpperInvariant();

            await _repository.UpdateLogoAsync(logoUrl, format);
            return logoUrl;
        }

        public async Task<bool> UpdateCertificateTemplatesAsync(object templates)
        {
            var json = JsonSerializer.Serialize(templates);
            return await _repository.UpdateCertificateTemplatesAsync(json);
        }

        public async Task<bool> UpdateCampusesAsync(object campuses)
        {
            var json = JsonSerializer.Serialize(campuses);
            return await _repository.UpdateCampusesAsync(json);
        }
    }
}
