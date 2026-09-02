using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SettingsController(AppDbContext context)
        {
            _context = context;
        }

        private async Task<SchoolSettings> GetOrCreateSettingsAsync()
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
                    LogoUrl = "",
                    LogoFormat = "PNG",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SchoolSettings.Add(settings);
                await _context.SaveChangesAsync();
            }
            return settings;
        }

        // GET: api/Settings
        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var s = await GetOrCreateSettingsAsync();

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

            return Ok(new
            {
                success = true,
                data = new SchoolSettingsDto
                {
                    SchoolName = s.SchoolName,
                    Tagline = s.Tagline,
                    Address = s.Address,
                    Phone = s.Phone,
                    Email = s.Email,
                    Website = s.Website,
                    PrincipalName = s.PrincipalName,
                    LogoUrl = s.LogoUrl,
                    LogoFormat = s.LogoFormat,
                    Campuses = campuses,
                    CertificateTemplates = certificateTemplates
                }
            });
        }

        // POST: api/Settings
        [HttpPost]
        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] SchoolSettingsDto dto)
        {
            if (dto == null) return BadRequest("Invalid settings payload.");

            var s = await GetOrCreateSettingsAsync();

            if (!string.IsNullOrWhiteSpace(dto.SchoolName)) s.SchoolName = dto.SchoolName;
            if (dto.Tagline != null) s.Tagline = dto.Tagline;
            if (dto.Address != null) s.Address = dto.Address;
            if (dto.Phone != null) s.Phone = dto.Phone;
            if (dto.Email != null) s.Email = dto.Email;
            if (dto.Website != null) s.Website = dto.Website;
            if (dto.PrincipalName != null) s.PrincipalName = dto.PrincipalName;
            if (dto.LogoUrl != null) s.LogoUrl = dto.LogoUrl;
            if (!string.IsNullOrWhiteSpace(dto.LogoFormat)) s.LogoFormat = dto.LogoFormat;

            if (dto.Campuses != null)
            {
                s.CampusesJson = JsonSerializer.Serialize(dto.Campuses);
            }

            if (dto.CertificateTemplates != null)
            {
                s.CertificateTemplatesJson = JsonSerializer.Serialize(dto.CertificateTemplates);
            }

            s.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "School profile and settings saved successfully to database.", data = dto });
        }

        // POST: api/Settings/logo
        [HttpPost("logo")]
        public async Task<IActionResult> UploadLogo([FromBody] UploadLogoDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.LogoData))
                return BadRequest("Logo data is required.");

            var s = await GetOrCreateSettingsAsync();
            s.LogoUrl = dto.LogoData;
            if (!string.IsNullOrWhiteSpace(dto.LogoFormat))
            {
                s.LogoFormat = dto.LogoFormat;
            }
            s.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Logo saved to database.", logoUrl = s.LogoUrl });
        }

        // POST: api/Settings/certificate-templates
        [HttpPost("certificate-templates")]
        public async Task<IActionResult> UpdateCertificateTemplates([FromBody] object templates)
        {
            if (templates == null) return BadRequest("Templates payload required.");

            var s = await GetOrCreateSettingsAsync();
            s.CertificateTemplatesJson = JsonSerializer.Serialize(templates);
            s.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Certificate templates saved to database." });
        }

        // POST: api/Settings/campuses
        [HttpPost("campuses")]
        public async Task<IActionResult> UpdateCampuses([FromBody] object campuses)
        {
            if (campuses == null) return BadRequest("Campuses payload required.");

            var s = await GetOrCreateSettingsAsync();
            s.CampusesJson = JsonSerializer.Serialize(campuses);
            s.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Campuses saved to database." });
        }
    }
}
