using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces.Settings;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;

        public SettingsController(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        // GET: api/Settings
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetSettings()
        {
            try
            {
                var settings = await _settingsService.GetSettingsAsync();
                return Ok(new
                {
                    success = true,
                    data = settings
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Settings
        [HttpPost]
        [HttpPut]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateSettings([FromBody] SchoolSettingsDto dto)
        {
            if (dto == null) return BadRequest("Invalid settings payload.");

            try
            {
                var updated = await _settingsService.UpdateSettingsAsync(dto);
                return Ok(new
                {
                    success = true,
                    message = "School profile and settings saved successfully to database.",
                    data = updated
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Settings/logo
        [HttpPost("logo")]
        [AllowAnonymous]
        public async Task<IActionResult> UploadLogo([FromBody] UploadLogoDto dto)
        {
            if (dto == null)
                return BadRequest("Logo payload is required.");

            try
            {
                var logoUrl = await _settingsService.UploadLogoAsync(dto);
                return Ok(new
                {
                    success = true,
                    message = string.IsNullOrWhiteSpace(logoUrl) ? "School logo removed from database successfully." : "School logo saved to database successfully.",
                    logoUrl = logoUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Settings/logo/upload
        [HttpPost("logo/upload")]
        [AllowAnonymous]
        public async Task<IActionResult> UploadLogoFile([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No image file provided.");

            try
            {
                var logoUrl = await _settingsService.UploadLogoFileAsync(file);
                return Ok(new
                {
                    success = true,
                    message = "School logo uploaded and saved to database successfully.",
                    logoUrl = logoUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Settings/certificate-templates
        [HttpPost("certificate-templates")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateCertificateTemplates([FromBody] object templates)
        {
            if (templates == null) return BadRequest("Templates payload required.");

            try
            {
                await _settingsService.UpdateCertificateTemplatesAsync(templates);
                return Ok(new { success = true, message = "Certificate templates saved to database." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Settings/campuses
        [HttpPost("campuses")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateCampuses([FromBody] object campuses)
        {
            if (campuses == null) return BadRequest("Campuses payload required.");

            try
            {
                await _settingsService.UpdateCampusesAsync(campuses);
                return Ok(new { success = true, message = "Campuses saved to database." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
