using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
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
        private readonly AppDbContext _context;

        public SettingsService(ISettingsRepository repository, IWebHostEnvironment env, AppDbContext context)
        {
            _repository = repository;
            _env = env;
            _context = context;
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

            object? idSequences = null;
            if (!string.IsNullOrWhiteSpace(s.IdSequenceSettingsJson))
            {
                try { idSequences = JsonSerializer.Deserialize<object>(s.IdSequenceSettingsJson); } catch { }
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
                BoardType = s.BoardType,
                Campuses = campuses,
                CertificateTemplates = certificateTemplates,
                IdSequences = idSequences
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
                BoardType = dto.BoardType,
                CampusesJson = dto.Campuses != null ? JsonSerializer.Serialize(dto.Campuses) : "[]",
                CertificateTemplatesJson = dto.CertificateTemplates != null ? JsonSerializer.Serialize(dto.CertificateTemplates) : "[]",
                IdSequenceSettingsJson = dto.IdSequences != null ? JsonSerializer.Serialize(dto.IdSequences) : null
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

        public async Task<IdSequenceSettingsDto> GetIdSequenceSettingsAsync()
        {
            var formats = await _repository.GetAutomatedIdFormatsAsync();
            var result = new IdSequenceSettingsDto();

            var studentFormat = formats.FirstOrDefault(f => string.Equals(f.FormatKey, "student", StringComparison.OrdinalIgnoreCase));
            if (studentFormat != null)
            {
                result.StudentIdPrefix = studentFormat.Prefix;
                result.StudentIdStartNo = studentFormat.StartNo;
                result.StudentIdPadding = studentFormat.Padding;
                result.StudentIdIncludeYear = studentFormat.IncludeYear;
                result.StudentIdSeparator = studentFormat.Separator;
                result.StudentIdPosition = studentFormat.Position;
            }

            var admissionFormat = formats.FirstOrDefault(f => string.Equals(f.FormatKey, "admission", StringComparison.OrdinalIgnoreCase));
            if (admissionFormat != null)
            {
                result.AdmissionNoPrefix = admissionFormat.Prefix;
                result.AdmissionNoStartNo = admissionFormat.StartNo;
                result.AdmissionNoPadding = admissionFormat.Padding;
                result.AdmissionNoIncludeYear = admissionFormat.IncludeYear;
                result.AdmissionNoSeparator = admissionFormat.Separator;
                result.AdmissionNoPosition = admissionFormat.Position;
            }

            var teachingFormat = formats.FirstOrDefault(f => string.Equals(f.FormatKey, "teaching", StringComparison.OrdinalIgnoreCase));
            if (teachingFormat != null)
            {
                result.TeachingIdPrefix = teachingFormat.Prefix;
                result.TeachingIdStartNo = teachingFormat.StartNo;
                result.TeachingIdPadding = teachingFormat.Padding;
                result.TeachingIdIncludeYear = teachingFormat.IncludeYear;
                result.TeachingIdSeparator = teachingFormat.Separator;
                result.TeachingIdPosition = teachingFormat.Position;
            }

            var nonTeachingFormat = formats.FirstOrDefault(f => string.Equals(f.FormatKey, "non-teaching", StringComparison.OrdinalIgnoreCase));
            if (nonTeachingFormat != null)
            {
                result.NonTeachingIdPrefix = nonTeachingFormat.Prefix;
                result.NonTeachingIdStartNo = nonTeachingFormat.StartNo;
                result.NonTeachingIdPadding = nonTeachingFormat.Padding;
                result.NonTeachingIdIncludeYear = nonTeachingFormat.IncludeYear;
                result.NonTeachingIdSeparator = nonTeachingFormat.Separator;
                result.NonTeachingIdPosition = nonTeachingFormat.Position;
            }

            var customList = formats.Where(f => f.IsCustom).Select(f => new CustomIdSequenceDto
            {
                Id = f.FormatKey,
                Name = f.Name,
                Prefix = f.Prefix,
                StartNo = f.StartNo,
                Padding = f.Padding,
                IncludeYear = f.IncludeYear,
                Separator = f.Separator,
                Position = f.Position
            }).ToList();

            result.CustomSequences = customList;

            result.AllFormats = formats.Select(f => new AutomatedIdFormatDto
            {
                Id = f.Id,
                FormatKey = f.FormatKey,
                Name = f.Name,
                Prefix = f.Prefix,
                StartNo = f.StartNo,
                Padding = f.Padding,
                IncludeYear = f.IncludeYear,
                Separator = f.Separator,
                Position = f.Position,
                IsCustom = f.IsCustom
            }).ToList();

            // Also keep SchoolSettings.IdSequenceSettingsJson synchronized
            try
            {
                var json = JsonSerializer.Serialize(result, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                await _repository.UpdateIdSequenceSettingsAsync(json);
            }
            catch { }

            return result;
        }

        public async Task<IdSequenceSettingsDto> UpdateIdSequenceSettingsAsync(IdSequenceSettingsDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            var incomingFormats = new List<AutomatedIdFormat>
            {
                new AutomatedIdFormat
                {
                    FormatKey = "student",
                    Name = "Student ID",
                    Prefix = dto.StudentIdPrefix,
                    StartNo = dto.StudentIdStartNo,
                    Padding = dto.StudentIdPadding,
                    IncludeYear = dto.StudentIdIncludeYear,
                    Separator = dto.StudentIdSeparator,
                    Position = dto.StudentIdPosition,
                    IsCustom = false
                },
                new AutomatedIdFormat
                {
                    FormatKey = "teaching",
                    Name = "Teaching Staff ID",
                    Prefix = dto.TeachingIdPrefix,
                    StartNo = dto.TeachingIdStartNo,
                    Padding = dto.TeachingIdPadding,
                    IncludeYear = dto.TeachingIdIncludeYear,
                    Separator = dto.TeachingIdSeparator,
                    Position = dto.TeachingIdPosition,
                    IsCustom = false
                },
                new AutomatedIdFormat
                {
                    FormatKey = "non-teaching",
                    Name = "Non-Teaching Staff ID",
                    Prefix = dto.NonTeachingIdPrefix,
                    StartNo = dto.NonTeachingIdStartNo,
                    Padding = dto.NonTeachingIdPadding,
                    IncludeYear = dto.NonTeachingIdIncludeYear,
                    Separator = dto.NonTeachingIdSeparator,
                    Position = dto.NonTeachingIdPosition,
                    IsCustom = false
                },
                new AutomatedIdFormat
                {
                    FormatKey = "admission",
                    Name = "Admission No",
                    Prefix = dto.AdmissionNoPrefix,
                    StartNo = dto.AdmissionNoStartNo,
                    Padding = dto.AdmissionNoPadding,
                    IncludeYear = dto.AdmissionNoIncludeYear,
                    Separator = dto.AdmissionNoSeparator,
                    Position = dto.AdmissionNoPosition,
                    IsCustom = false
                }
            };

            if (dto.CustomSequences != null)
            {
                foreach (var custom in dto.CustomSequences)
                {
                    incomingFormats.Add(new AutomatedIdFormat
                    {
                        FormatKey = string.IsNullOrWhiteSpace(custom.Id) ? $"custom_{DateTime.UtcNow.Ticks}" : custom.Id,
                        Name = string.IsNullOrWhiteSpace(custom.Name) ? "Custom Format" : custom.Name,
                        Prefix = custom.Prefix,
                        StartNo = custom.StartNo,
                        Padding = custom.Padding,
                        IncludeYear = custom.IncludeYear,
                        Separator = custom.Separator,
                        Position = custom.Position,
                        IsCustom = true
                    });
                }
            }

            await _repository.BulkSaveIdFormatsAsync(incomingFormats);
            return await GetIdSequenceSettingsAsync();
        }

        public async Task<AutomatedIdFormatDto> AddOrUpdateCustomIdFormatAsync(CustomIdSequenceDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            var key = !string.IsNullOrWhiteSpace(dto.FormatKey) ? dto.FormatKey : (!string.IsNullOrWhiteSpace(dto.Id) ? dto.Id : $"custom_{DateTime.UtcNow.Ticks}");
            var format = new AutomatedIdFormat
            {
                FormatKey = key,
                Name = string.IsNullOrWhiteSpace(dto.Name) ? "Custom Format" : dto.Name,
                Prefix = dto.Prefix,
                StartNo = dto.StartNo,
                Padding = dto.Padding,
                IncludeYear = dto.IncludeYear,
                Separator = dto.Separator,
                Position = dto.Position,
                IsCustom = true
            };

            var saved = await _repository.SaveOrUpdateIdFormatAsync(format);

            // Trigger sync to SchoolSettingsJson
            await GetIdSequenceSettingsAsync();

            return new AutomatedIdFormatDto
            {
                Id = saved.Id,
                FormatKey = saved.FormatKey,
                Name = saved.Name,
                Prefix = saved.Prefix,
                StartNo = saved.StartNo,
                Padding = saved.Padding,
                IncludeYear = saved.IncludeYear,
                Separator = saved.Separator,
                Position = saved.Position,
                IsCustom = saved.IsCustom
            };
        }

        public async Task<bool> DeleteCustomIdFormatAsync(string formatKey)
        {
            var deleted = await _repository.DeleteCustomIdFormatAsync(formatKey);
            if (deleted)
            {
                await GetIdSequenceSettingsAsync();
            }
            return deleted;
        }

        public async Task<GeneratedIdResponseDto> GenerateNextIdAsync(string type, string? customId = null)
        {
            var config = await GetIdSequenceSettingsAsync();
            var normType = (type ?? string.Empty).Trim().ToLowerInvariant();

            string prefix;
            int startNo;
            int padding;
            bool includeYear;
            string separator;
            string position;
            int maxExisting = 0;

            if (normType == "student" || normType == "studentid")
            {
                prefix = config.StudentIdPrefix;
                startNo = config.StudentIdStartNo;
                padding = config.StudentIdPadding;
                includeYear = config.StudentIdIncludeYear;
                separator = config.StudentIdSeparator;
                position = config.StudentIdPosition;

                var rollCodes = await _context.Students
                    .Select(s => s.RollNumber)
                    .ToListAsync();

                var admissionCodes = await _context.Students
                    .Select(s => s.AdmissionNumber)
                    .ToListAsync();

                var appRegNos = await _context.AdmissionApplications
                    .Select(a => a.RegistrationNo)
                    .ToListAsync();

                var admRollNos = await _context.Admissions
                    .Select(a => a.RollNo)
                    .ToListAsync();

                maxExisting = ExtractMaxNumber(rollCodes.Concat(admissionCodes).Concat(appRegNos).Concat(admRollNos), prefix);
            }
            else if (normType == "admission" || normType == "admissionno")
            {
                prefix = config.AdmissionNoPrefix;
                startNo = config.AdmissionNoStartNo;
                padding = config.AdmissionNoPadding;
                includeYear = config.AdmissionNoIncludeYear;
                separator = config.AdmissionNoSeparator;
                position = config.AdmissionNoPosition;

                var studentAdmissions = await _context.Students
                    .Select(s => s.AdmissionNumber)
                    .ToListAsync();

                var appAdmissions = await _context.Admissions
                    .Select(a => a.ApplicationNo)
                    .ToListAsync();

                var appAdmissionNos = await _context.AdmissionApplications
                    .Select(a => a.AdmissionNo)
                    .ToListAsync();

                maxExisting = ExtractMaxNumber(studentAdmissions.Concat(appAdmissions).Concat(appAdmissionNos), prefix);
            }
            else if (normType == "teaching" || normType == "teacher" || normType == "teachingstaff")
            {
                prefix = config.TeachingIdPrefix;
                startNo = config.TeachingIdStartNo;
                padding = config.TeachingIdPadding;
                includeYear = config.TeachingIdIncludeYear;
                separator = config.TeachingIdSeparator;
                position = config.TeachingIdPosition;

                var existingEmpIds = await _context.Staff
                    .Where(s => s.EmployeeCategory == null || s.EmployeeCategory == "Teaching Staff" || s.EmployeeCategory == "Teacher")
                    .Select(s => s.EmployeeId)
                    .ToListAsync();

                maxExisting = ExtractMaxNumber(existingEmpIds, prefix);
            }
            else if (normType == "non-teaching" || normType == "nonteaching" || normType == "nonteachingstaff")
            {
                prefix = config.NonTeachingIdPrefix;
                startNo = config.NonTeachingIdStartNo;
                padding = config.NonTeachingIdPadding;
                includeYear = config.NonTeachingIdIncludeYear;
                separator = config.NonTeachingIdSeparator;
                position = config.NonTeachingIdPosition;

                var existingEmpIds = await _context.Staff
                    .Where(s => s.EmployeeCategory == "Non-Teaching Staff" || s.EmployeeCategory == "Staff")
                    .Select(s => s.EmployeeId)
                    .ToListAsync();

                maxExisting = ExtractMaxNumber(existingEmpIds, prefix);
            }
            else if (normType == "registration" || normType == "reg" || normType == "application" || normType == "applicationno")
            {
                prefix = "REG";
                startNo = 1001;
                padding = 4;
                includeYear = false;
                separator = "-";
                position = "start";

                var appRegNos = await _context.AdmissionApplications
                    .Select(a => a.RegistrationNo)
                    .ToListAsync();

                var admAppNos = await _context.Admissions
                    .Select(a => a.ApplicationNo)
                    .ToListAsync();

                maxExisting = ExtractMaxNumber(appRegNos.Concat(admAppNos), prefix);
            }
            else if (normType == "custom")
            {
                var customSeq = (config.CustomSequences ?? new List<CustomIdSequenceDto>())
                    .FirstOrDefault(s => string.Equals(s.Id, customId, StringComparison.OrdinalIgnoreCase) ||
                                         string.Equals(s.Name, customId, StringComparison.OrdinalIgnoreCase) ||
                                         string.Equals(s.FormatKey, customId, StringComparison.OrdinalIgnoreCase));

                if (customSeq != null)
                {
                    prefix = customSeq.Prefix;
                    startNo = customSeq.StartNo;
                    padding = customSeq.Padding;
                    includeYear = customSeq.IncludeYear;
                    separator = customSeq.Separator;
                    position = customSeq.Position;
                }
                else
                {
                    prefix = "CUST";
                    startNo = 101;
                    padding = 4;
                    includeYear = true;
                    separator = "-";
                    position = "start";
                }
            }
            else
            {
                prefix = normType.ToUpperInvariant();
                startNo = 1001;
                padding = 4;
                includeYear = true;
                separator = "-";
                position = "start";
            }

            // Determine next sequence number without duplicates:
            // Must be at least startNo, and if existing records already used numbers, advance past max
            int nextNumber = Math.Max(startNo, maxExisting + 1);

            string nextId = BuildFormattedId(prefix, nextNumber, padding, includeYear, separator, position);

            if (normType == "student" || normType == "studentid")
            {
                var existingStudentIds = await _context.Students
                    .Select(s => s.RollNumber)
                    .Concat(_context.Students.Select(s => s.AdmissionNumber))
                    .Concat(_context.AdmissionApplications.Select(a => a.RegistrationNo))
                    .Concat(_context.Admissions.Select(a => a.RollNo))
                    .Where(x => !string.IsNullOrEmpty(x))
                    .Select(x => x!)
                    .ToListAsync();
                var set = new HashSet<string>(existingStudentIds, StringComparer.OrdinalIgnoreCase);
                while (set.Contains(nextId))
                {
                    nextNumber++;
                    nextId = BuildFormattedId(prefix, nextNumber, padding, includeYear, separator, position);
                }
            }

            if (normType.Contains("teach") || normType == "staff")
            {
                var existingStaffIds = await _context.Staff
                    .Where(s => s.EmployeeId != null)
                    .Select(s => s.EmployeeId!)
                    .ToListAsync();
                var set = new HashSet<string>(existingStaffIds, StringComparer.OrdinalIgnoreCase);
                while (set.Contains(nextId))
                {
                    nextNumber++;
                    nextId = BuildFormattedId(prefix, nextNumber, padding, includeYear, separator, position);
                }
            }

            return new GeneratedIdResponseDto
            {
                FormatType = normType,
                NextId = nextId,
                SequenceNumber = nextNumber,
                Prefix = prefix
            };
        }

        private static int ExtractMaxNumber(IEnumerable<string?> items, string? prefix)
        {
            int max = 0;
            var cleanPrefix = (prefix ?? string.Empty).Trim();

            var itemList = items?.Where(i => !string.IsNullOrWhiteSpace(i)).ToList() ?? new List<string?>();
            var targetItems = !string.IsNullOrEmpty(cleanPrefix) && itemList.Any(i => i!.Contains(cleanPrefix, StringComparison.OrdinalIgnoreCase))
                ? itemList.Where(i => i!.Contains(cleanPrefix, StringComparison.OrdinalIgnoreCase))
                : itemList;

            foreach (var item in targetItems)
            {
                if (string.IsNullOrWhiteSpace(item)) continue;

                var matches = Regex.Matches(item, @"\d+");
                if (matches.Count == 0) continue;

                foreach (Match m in matches)
                {
                    if (int.TryParse(m.Value, out int val))
                    {
                        // If multiple numbers exist and this looks like a year, skip it
                        if (matches.Count > 1 && val >= 2020 && val <= 2035)
                        {
                            continue;
                        }

                        if (val > max)
                        {
                            max = val;
                        }
                    }
                }
            }

            return max;
        }

        private static string BuildFormattedId(string prefix, int sequenceNumber, int padding, bool includeYear, string separator, string position)
        {
            var cleanPrefix = (prefix ?? string.Empty).Trim().ToUpperInvariant();
            var sep = (string.Equals(separator, "none", StringComparison.OrdinalIgnoreCase) ||
                       string.Equals(separator, "__none__", StringComparison.OrdinalIgnoreCase))
                ? string.Empty
                : (!string.IsNullOrEmpty(separator) ? separator : "-");
            var yearStr = includeYear ? DateTime.UtcNow.Year.ToString() : string.Empty;
            var paddedSeq = sequenceNumber.ToString().PadLeft(padding > 0 ? padding : 4, '0');

            var parts = new List<string>();
            var pos = (position ?? "start").ToLowerInvariant();

            if (pos == "middle")
            {
                if (!string.IsNullOrEmpty(yearStr)) parts.Add(yearStr);
                if (!string.IsNullOrEmpty(cleanPrefix)) parts.Add(cleanPrefix);
                parts.Add(paddedSeq);
            }
            else if (pos == "end")
            {
                if (!string.IsNullOrEmpty(yearStr)) parts.Add(yearStr);
                parts.Add(paddedSeq);
                if (!string.IsNullOrEmpty(cleanPrefix)) parts.Add(cleanPrefix);
            }
            else
            {
                if (!string.IsNullOrEmpty(cleanPrefix)) parts.Add(cleanPrefix);
                if (!string.IsNullOrEmpty(yearStr)) parts.Add(yearStr);
                parts.Add(paddedSeq);
            }

            return string.Join(sep, parts.Where(p => !string.IsNullOrEmpty(p)));
        }

        private static bool IsPlaceholderProfileName(string? name)
        {
            if (string.IsNullOrWhiteSpace(name)) return true;
            var n = name.Trim().ToLowerInvariant();
            return n == "administrator" || n == "admin" || n == "super admin" || n == "superadmin"
                || n == "pirnavsms" || n == "vasantha gokul" || n == "user";
        }

        private static bool IsPlaceholderAvatarUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return true;
            return url.Contains("images.unsplash.com/photo-1573496359142-b8d87734a5a2", StringComparison.OrdinalIgnoreCase);
        }

        private async Task<Admin?> FindMatchingAdminAsync(string? userId, string? email, string? mobile, string? claimRole = null)
        {
            var normalizedEmail = email?.Trim().ToLowerInvariant();
            var normalizedMobile = mobile?.Trim();

            if (!string.IsNullOrWhiteSpace(normalizedEmail))
            {
                var byEmail = await _context.Admins.FirstOrDefaultAsync(a => a.Email != null && a.Email.ToLower() == normalizedEmail);
                if (byEmail != null) return byEmail;
            }

            if (!string.IsNullOrWhiteSpace(normalizedMobile))
            {
                var byMobile = await _context.Admins.FirstOrDefaultAsync(a => a.MobileNumber == normalizedMobile);
                if (byMobile != null) return byMobile;
            }

            var isAdminRole = string.IsNullOrWhiteSpace(claimRole)
                || claimRole.Contains("Admin", StringComparison.OrdinalIgnoreCase);
            if (isAdminRole && int.TryParse(userId, out var adminId))
            {
                var byId = await _context.Admins.FirstOrDefaultAsync(a => a.AdminId == adminId);
                if (byId != null) return byId;
            }

            if (string.IsNullOrWhiteSpace(userId) && string.IsNullOrWhiteSpace(normalizedEmail) && string.IsNullOrWhiteSpace(normalizedMobile))
            {
                return await _context.Admins.FirstOrDefaultAsync();
            }

            return null;
        }

        private async Task<User?> FindMatchingUserAsync(string? userId, string? email, string? mobile)
        {
            var normalizedEmail = email?.Trim().ToLowerInvariant();
            var normalizedMobile = mobile?.Trim();

            if (!string.IsNullOrWhiteSpace(normalizedEmail))
            {
                var byEmail = await _context.Users.FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == normalizedEmail);
                if (byEmail != null) return byEmail;
            }

            if (!string.IsNullOrWhiteSpace(normalizedMobile))
            {
                var byMobile = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == normalizedMobile);
                if (byMobile != null) return byMobile;
            }

            if (int.TryParse(userId, out var uid))
            {
                var byId = await _context.Users.FirstOrDefaultAsync(u => u.UserId == uid);
                if (byId != null) return byId;
            }

            return null;
        }

        public async Task<UserProfileDto> GetUserProfileAsync(string? userId = null, string? email = null, string? mobile = null, string? claimName = null, string? claimRole = null)
        {
            UserProfileDto? dto = null;

            // Primary source of truth: matching Admin or User record in database
            try
            {
                var admin = await FindMatchingAdminAsync(userId, email, mobile, claimRole);
                if (admin != null)
                {
                    dto = new UserProfileDto
                    {
                        Id = admin.AdminId.ToString(),
                        Name = !IsPlaceholderProfileName(admin.FullName) ? admin.FullName.Trim() : (!IsPlaceholderProfileName(claimName) ? claimName!.Trim() : string.Empty),
                        Email = !string.IsNullOrWhiteSpace(admin.Email) ? admin.Email.Trim() : (email ?? string.Empty),
                        Phone = !string.IsNullOrWhiteSpace(admin.MobileNumber) ? admin.MobileNumber.Trim() : (mobile ?? string.Empty),
                        Avatar = !IsPlaceholderAvatarUrl(admin.Avatar) ? admin.Avatar!.Trim() : string.Empty,
                        Branch = string.Empty,
                        Role = !string.IsNullOrWhiteSpace(admin.Role) ? admin.Role : (claimRole ?? "Admin"),
                        Status = "Active Account"
                    };
                }
                else
                {
                    var dbUser = await FindMatchingUserAsync(userId, email, mobile);
                    if (dbUser != null)
                    {
                        dto = new UserProfileDto
                        {
                            Id = dbUser.UserId.ToString(),
                            Name = !IsPlaceholderProfileName(dbUser.FullName) ? dbUser.FullName.Trim() : (!IsPlaceholderProfileName(claimName) ? claimName!.Trim() : string.Empty),
                            Email = !string.IsNullOrWhiteSpace(dbUser.Email) ? dbUser.Email.Trim() : (email ?? string.Empty),
                            Phone = !string.IsNullOrWhiteSpace(dbUser.MobileNumber) ? dbUser.MobileNumber.Trim() : (mobile ?? string.Empty),
                            Avatar = !IsPlaceholderAvatarUrl(dbUser.Avatar) ? dbUser.Avatar!.Trim() : string.Empty,
                            Branch = string.Empty,
                            Role = !string.IsNullOrWhiteSpace(dbUser.Role) ? dbUser.Role : (claimRole ?? string.Empty),
                            Status = "Active Account"
                        };
                    }
                }

                if (dto != null)
                {
                    // Supplemental settings (branch and avatar fallback if not stored on Admin/User)
                    var settings = await _repository.GetSettingsAsync();
                    if (!string.IsNullOrWhiteSpace(settings.UserProfileJson))
                    {
                        try
                        {
                            var parsed = JsonSerializer.Deserialize<UserProfileDto>(settings.UserProfileJson);
                            var matchesUser = parsed != null && (
                                (!string.IsNullOrWhiteSpace(dto.Email) && string.Equals(parsed.Email?.Trim(), dto.Email, StringComparison.OrdinalIgnoreCase)) ||
                                (!string.IsNullOrWhiteSpace(dto.Phone) && string.Equals(parsed.Phone?.Trim(), dto.Phone, StringComparison.OrdinalIgnoreCase)) ||
                                (!string.IsNullOrWhiteSpace(dto.Id) && string.Equals(parsed.Id?.Trim(), dto.Id, StringComparison.OrdinalIgnoreCase))
                            );
                            if (matchesUser && parsed != null)
                            {
                                if (string.IsNullOrWhiteSpace(dto.Avatar) && !IsPlaceholderAvatarUrl(parsed.Avatar))
                                    dto.Avatar = parsed.Avatar.Trim();
                                if (!string.IsNullOrWhiteSpace(parsed.Branch))
                                    dto.Branch = parsed.Branch.Trim();
                                if (string.IsNullOrWhiteSpace(dto.Name) && !IsPlaceholderProfileName(parsed.Name))
                                    dto.Name = parsed.Name.Trim();
                            }
                        }
                        catch { }
                    }

                    return dto;
                }
            }
            catch { }

            return new UserProfileDto
            {
                Id = userId ?? string.Empty,
                Name = !IsPlaceholderProfileName(claimName) ? claimName!.Trim() : string.Empty,
                Email = email ?? string.Empty,
                Phone = mobile ?? string.Empty,
                Avatar = string.Empty,
                Branch = string.Empty,
                Role = claimRole ?? string.Empty,
                Status = "Active Account"
            };
        }

        public async Task<UserProfileDto> UpdateUserProfileAsync(UserProfileDto dto, string? userId = null, string? claimEmail = null)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            string avatarUrl = dto.Avatar?.Trim() ?? string.Empty;
            if (IsPlaceholderAvatarUrl(avatarUrl))
            {
                avatarUrl = string.Empty;
                dto.Avatar = string.Empty;
            }

            // If base64 image data is provided, save it as a physical file
            if (avatarUrl.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var parts = avatarUrl.Split(',');
                    if (parts.Length == 2)
                    {
                        var header = parts[0];
                        var base64Data = parts[1];
                        var ext = ".png";
                        if (header.Contains("image/jpeg") || header.Contains("image/jpg")) ext = ".jpg";
                        else if (header.Contains("image/webp")) ext = ".webp";

                        var bytes = Convert.FromBase64String(base64Data);
                        var fileName = $"profile-avatar-{DateTime.UtcNow.Ticks}{ext}";

                        // 1. Save to wwwroot/uploads/profile
                        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                        var uploadFolder = Path.Combine(webRoot, "uploads", "profile");
                        Directory.CreateDirectory(uploadFolder);
                        var filePath = Path.Combine(uploadFolder, fileName);
                        await File.WriteAllBytesAsync(filePath, bytes);

                        // 2. Also mirror to Frontend public folder
                        try
                        {
                            var frontendUploadFolder = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", "school-management-system", "public", "uploads", "profile"));
                            Directory.CreateDirectory(frontendUploadFolder);
                            var frontendFilePath = Path.Combine(frontendUploadFolder, fileName);
                            await File.WriteAllBytesAsync(frontendFilePath, bytes);
                        }
                        catch { }

                        avatarUrl = $"/uploads/profile/{fileName}";
                        dto.Avatar = avatarUrl;
                    }
                }
                catch { }
            }

            var lookupEmail = !string.IsNullOrWhiteSpace(claimEmail) ? claimEmail : dto.Email;

            // Synchronize with matching Admin or User record in database
            try
            {
                var admin = await FindMatchingAdminAsync(userId, lookupEmail, dto.Phone);
                if (admin != null)
                {
                    if (!IsPlaceholderProfileName(dto.Name)) admin.FullName = dto.Name.Trim();
                    if (!string.IsNullOrWhiteSpace(dto.Email)) admin.Email = dto.Email.Trim();
                    if (!string.IsNullOrWhiteSpace(dto.Phone)) admin.MobileNumber = dto.Phone.Trim();
                    admin.Avatar = dto.Avatar;
                    if (string.IsNullOrWhiteSpace(dto.Id)) dto.Id = admin.AdminId.ToString();
                    await _context.SaveChangesAsync();
                }

                var dbUser = await FindMatchingUserAsync(userId, lookupEmail, dto.Phone);
                if (dbUser != null)
                {
                    if (!IsPlaceholderProfileName(dto.Name)) dbUser.FullName = dto.Name.Trim();
                    if (!string.IsNullOrWhiteSpace(dto.Email)) dbUser.Email = dto.Email.Trim();
                    if (!string.IsNullOrWhiteSpace(dto.Phone)) dbUser.MobileNumber = dto.Phone.Trim();
                    dbUser.Avatar = dto.Avatar;
                    if (string.IsNullOrWhiteSpace(dto.Id)) dto.Id = dbUser.UserId.ToString();
                    await _context.SaveChangesAsync();
                }
            }
            catch { }

            var json = JsonSerializer.Serialize(dto);
            await _repository.UpdateUserProfileAsync(json);

            return dto;
        }

        public async Task<string> UploadProfileImageFileAsync(IFormFile file, string? userId = null, string? claimEmail = null)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file was uploaded.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".png", ".jpg", ".jpeg", ".webp" };
            if (Array.IndexOf(allowedExtensions, ext) < 0)
            {
                ext = ".png";
            }

            var fileName = $"profile-avatar-{DateTime.UtcNow.Ticks}{ext}";

            // 1. Save to wwwroot/uploads/profile
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadFolder = Path.Combine(webRoot, "uploads", "profile");
            Directory.CreateDirectory(uploadFolder);
            var filePath = Path.Combine(uploadFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 2. Also mirror to Frontend public folder
            try
            {
                var frontendUploadFolder = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", "school-management-system", "public", "uploads", "profile"));
                Directory.CreateDirectory(frontendUploadFolder);
                var frontendFilePath = Path.Combine(frontendUploadFolder, fileName);
                File.Copy(filePath, frontendFilePath, true);
            }
            catch { }

            var relativeUrl = $"/uploads/profile/{fileName}";

            // Automatically update the stored profile avatar if existing profile exists
            try
            {
                var currentProfile = await GetUserProfileAsync(userId, claimEmail);
                currentProfile.Avatar = relativeUrl;
                await UpdateUserProfileAsync(currentProfile, userId, claimEmail);
            }
            catch { }

            return relativeUrl;
        }
    }
}
