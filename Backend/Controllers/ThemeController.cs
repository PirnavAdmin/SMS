using Microsoft.AspNetCore.Authorization;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ThemeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ThemeController(AppDbContext context)
        {
            _context = context;
        }

        private static string? NormalizeHex(string? hex)
        {
            if (string.IsNullOrWhiteSpace(hex)) return null;
            var clean = hex.Trim();
            if (!clean.StartsWith("#")) clean = "#" + clean;
            return clean.Length == 4 || clean.Length == 7 || clean.Length == 9 ? clean : null;
        }

        private async Task<(SchoolSettings settings, ThemeSettingsContainer container)> GetThemeContainerAsync()
        {
            var settings = await _context.SchoolSettings.IgnoreQueryFilters().FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new SchoolSettings
                {
                    SchoolName = "Pirnav Educational Institutions",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SchoolSettings.Add(settings);
            }

            ThemeSettingsContainer container;
            if (!string.IsNullOrWhiteSpace(settings.ThemeSettingsJson))
            {
                try
                {
                    container = JsonSerializer.Deserialize<ThemeSettingsContainer>(settings.ThemeSettingsJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new ThemeSettingsContainer();
                }
                catch
                {
                    container = new ThemeSettingsContainer();
                }
            }
            else
            {
                container = new ThemeSettingsContainer();
            }

            if (container.UserThemes == null)
            {
                container.UserThemes = new Dictionary<string, ThemeItemDto>(StringComparer.OrdinalIgnoreCase);
            }

            return (settings, container);
        }

        private string? ResolveUserKey(string? userKeyParam)
        {
            if (!string.IsNullOrWhiteSpace(userKeyParam))
            {
                return userKeyParam.Trim().ToLowerInvariant();
            }

            var email = User?.FindFirst(ClaimTypes.Email)?.Value;
            if (!string.IsNullOrWhiteSpace(email)) return email.Trim().ToLowerInvariant();

            var id = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrWhiteSpace(id)) return id.Trim().ToLowerInvariant();

            var name = User?.FindFirst(ClaimTypes.Name)?.Value;
            if (!string.IsNullOrWhiteSpace(name)) return name.Trim().ToLowerInvariant();

            return null;
        }

        // GET: api/Theme
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetTheme([FromQuery] string? userKey)
        {
            try
            {
                var (_, container) = await GetThemeContainerAsync();
                var key = ResolveUserKey(userKey);

                ThemeItemDto? userTheme = null;
                var isUserOverride = false;

                if (!string.IsNullOrWhiteSpace(key) && container.UserThemes.TryGetValue(key, out var overrideTheme))
                {
                    userTheme = overrideTheme;
                    isUserOverride = true;
                }

                var effectiveTheme = userTheme ?? container.SchoolDefault;

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        schoolDefault = container.SchoolDefault,
                        superAdminTheme = container.SuperAdminTheme,
                        userTheme,
                        effectiveTheme,
                        isUserOverride,
                        activeUserKey = key ?? "default"
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/Theme/superadmin
        [HttpGet("superadmin")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSuperAdminTheme()
        {
            try
            {
                var (_, container) = await GetThemeContainerAsync();
                return Ok(new
                {
                    success = true,
                    data = container.SuperAdminTheme ?? new ThemeItemDto
                    {
                        Primary = "#0284c7",
                        Secondary = "#f59e0b",
                        UpdatedAt = DateTime.UtcNow.ToString("o")
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Theme/superadmin
        [HttpPost("superadmin")]
        [HttpPut("superadmin")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateSuperAdminTheme([FromBody] ApplyThemeRequestDto dto)
        {
            if (dto == null) return BadRequest(new { success = false, message = "Payload required." });

            try
            {
                var (settings, container) = await GetThemeContainerAsync();

                var primary = NormalizeHex(dto.Primary) ?? dto.Primary?.Trim() ?? "#0284c7";
                var secondary = NormalizeHex(dto.Secondary) ?? dto.Secondary?.Trim() ?? "#f59e0b";

                container.SuperAdminTheme = new ThemeItemDto
                {
                    Primary = primary,
                    Secondary = secondary,
                    UpdatedAt = DateTime.UtcNow.ToString("o")
                };

                settings.ThemeSettingsJson = JsonSerializer.Serialize(container);
                settings.UpdatedAt = DateTime.UtcNow;

                // Synchronize PrimaryColor on PlatformCompanyProfile if present
                try
                {
                    var profile = await _context.PlatformCompanyProfiles.FirstOrDefaultAsync();
                    if (profile != null)
                    {
                        profile.PrimaryColor = primary;
                        profile.UpdatedAt = DateTime.UtcNow;
                    }
                }
                catch { }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Super Admin platform theme applied exclusively to Super Admin screens.",
                    data = container.SuperAdminTheme
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Theme/superadmin/reset
        [HttpPost("superadmin/reset")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetSuperAdminTheme()
        {
            try
            {
                var (settings, container) = await GetThemeContainerAsync();
                container.SuperAdminTheme = null;

                settings.ThemeSettingsJson = JsonSerializer.Serialize(container);
                settings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Super Admin platform theme reset to default.",
                    data = (ThemeItemDto?)null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Theme/school-default
        [HttpPost("school-default")]
        [HttpPut("school-default")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateSchoolDefaultTheme([FromBody] ApplyThemeRequestDto dto)
        {
            if (dto == null) return BadRequest(new { success = false, message = "Payload required." });

            try
            {
                var (settings, container) = await GetThemeContainerAsync();

                var primary = NormalizeHex(dto.Primary) ?? dto.Primary?.Trim() ?? string.Empty;
                var secondary = NormalizeHex(dto.Secondary) ?? dto.Secondary?.Trim() ?? string.Empty;

                container.SchoolDefault = new ThemeItemDto
                {
                    Primary = primary,
                    Secondary = secondary,
                    UpdatedAt = DateTime.UtcNow.ToString("o")
                };

                settings.ThemeSettingsJson = JsonSerializer.Serialize(container);
                settings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "School default theme applied successfully to all users.",
                    data = container.SchoolDefault
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Theme/school-default/reset
        [HttpPost("school-default/reset")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetSchoolDefaultTheme()
        {
            try
            {
                var (settings, container) = await GetThemeContainerAsync();

                container.SchoolDefault = null;

                settings.ThemeSettingsJson = JsonSerializer.Serialize(container);
                settings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "School default theme reset.",
                    data = (ThemeItemDto?)null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Theme/user
        [HttpPost("user")]
        [HttpPut("user")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateUserTheme([FromBody] ApplyThemeRequestDto dto)
        {
            if (dto == null) return BadRequest(new { success = false, message = "Payload required." });

            try
            {
                var (settings, container) = await GetThemeContainerAsync();

                var key = ResolveUserKey(dto.UserKey);
                if (string.IsNullOrWhiteSpace(key) || key == "default")
                {
                    key = "default_user";
                }

                var primary = NormalizeHex(dto.Primary) ?? dto.Primary?.Trim() ?? string.Empty;
                var secondary = NormalizeHex(dto.Secondary) ?? dto.Secondary?.Trim() ?? string.Empty;

                var userItem = new ThemeItemDto
                {
                    Primary = primary,
                    Secondary = secondary,
                    UpdatedAt = DateTime.UtcNow.ToString("o")
                };

                container.UserThemes[key] = userItem;

                settings.ThemeSettingsJson = JsonSerializer.Serialize(container);
                settings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Personal theme applied to your screen.",
                    data = new
                    {
                        theme = userItem,
                        userKey = key
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/Theme/user/reset
        [HttpPost("user/reset")]
        [HttpDelete("user")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetUserTheme([FromQuery] string? userKey)
        {
            try
            {
                var (settings, container) = await GetThemeContainerAsync();
                var key = ResolveUserKey(userKey);

                if (!string.IsNullOrWhiteSpace(key) && container.UserThemes.ContainsKey(key))
                {
                    container.UserThemes.Remove(key);
                    settings.ThemeSettingsJson = JsonSerializer.Serialize(container);
                    settings.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    success = true,
                    message = "Personal theme reset to school default.",
                    data = container.SchoolDefault
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class ThemeItemDto
    {
        [JsonPropertyName("primary")]
        public string? Primary { get; set; }

        [JsonPropertyName("secondary")]
        public string? Secondary { get; set; }

        [JsonPropertyName("updatedAt")]
        public string? UpdatedAt { get; set; }
    }

    public class ThemeSettingsContainer
    {
        [JsonPropertyName("schoolDefault")]
        public ThemeItemDto? SchoolDefault { get; set; }

        [JsonPropertyName("superAdminTheme")]
        public ThemeItemDto? SuperAdminTheme { get; set; }

        [JsonPropertyName("userThemes")]
        public Dictionary<string, ThemeItemDto> UserThemes { get; set; } = new Dictionary<string, ThemeItemDto>(StringComparer.OrdinalIgnoreCase);
    }

    public class ApplyThemeRequestDto
    {
        [JsonPropertyName("primary")]
        public string? Primary { get; set; }

        [JsonPropertyName("secondary")]
        public string? Secondary { get; set; }

        [JsonPropertyName("userKey")]
        public string? UserKey { get; set; }
    }
}
