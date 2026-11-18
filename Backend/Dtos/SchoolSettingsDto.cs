using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class SchoolSettingsDto
    {
        [JsonPropertyName("schoolName")]
        public string SchoolName { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string NameAlias
        {
            get => SchoolName;
            set { if (!string.IsNullOrWhiteSpace(value)) SchoolName = value; }
        }

        [JsonPropertyName("tagline")]
        public string Tagline { get; set; } = string.Empty;

        [JsonPropertyName("motto")]
        public string MottoAlias
        {
            get => Tagline;
            set { if (!string.IsNullOrWhiteSpace(value)) Tagline = value; }
        }

        [JsonPropertyName("address")]
        public string Address { get; set; } = string.Empty;

        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("website")]
        public string Website { get; set; } = string.Empty;

        [JsonPropertyName("websiteUrl")]
        public string WebsiteUrlAlias
        {
            get => Website;
            set { if (!string.IsNullOrWhiteSpace(value)) Website = value; }
        }

        [JsonPropertyName("principalName")]
        public string PrincipalName { get; set; } = string.Empty;

        [JsonPropertyName("logoUrl")]
        public string LogoUrl { get; set; } = string.Empty;

        [JsonPropertyName("logoFormat")]
        public string LogoFormat { get; set; } = "PNG";

        [JsonPropertyName("campuses")]
        public object? Campuses { get; set; }

        [JsonPropertyName("certificateTemplates")]
        public object? CertificateTemplates { get; set; }

        [JsonPropertyName("boardType")]
        public string? BoardType { get; set; }

        [JsonPropertyName("idSequences")]
        public object? IdSequences { get; set; }

        [JsonPropertyName("theme")]
        public object? Theme { get; set; }
    }

    public class UploadLogoDto
    {
        [JsonPropertyName("logoData")]
        public string LogoData { get; set; } = string.Empty;

        [JsonPropertyName("logoUrl")]
        public string LogoUrlAlias
        {
            get => LogoData;
            set { if (!string.IsNullOrWhiteSpace(value)) LogoData = value; }
        }

        [JsonPropertyName("logoFormat")]
        public string? LogoFormat { get; set; }
    }

    public class UploadLogoFileRequest
    {
        public Microsoft.AspNetCore.Http.IFormFile? File { get; set; }
    }

    public class UserProfileDto
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        [JsonPropertyName("avatar")]
        public string Avatar { get; set; } = string.Empty;

        [JsonPropertyName("branch")]
        public string Branch { get; set; } = string.Empty;

        [JsonPropertyName("role")]
        public string Role { get; set; } = "Admin";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active Account";
    }

    public class UploadProfileImageFileRequest
    {
        public Microsoft.AspNetCore.Http.IFormFile? File { get; set; }
    }

    public class AuditLogItemDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("auditLogId")]
        public int AuditLogId { get; set; }

        [JsonPropertyName("userId")]
        public int? UserId { get; set; }

        [JsonPropertyName("userName")]
        public string UserName { get; set; } = string.Empty;

        [JsonPropertyName("userRole")]
        public string UserRole { get; set; } = string.Empty;

        [JsonPropertyName("action")]
        public string Action { get; set; } = string.Empty;

        [JsonPropertyName("details")]
        public string Details { get; set; } = string.Empty;

        [JsonPropertyName("ipAddress")]
        public string IpAddress { get; set; } = string.Empty;

        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; } = string.Empty;

        [JsonPropertyName("schoolId")]
        public int? SchoolId { get; set; }

        [JsonPropertyName("schoolName")]
        public string? SchoolName { get; set; }
    }

    public class CreateAuditLogRequestDto
    {
        [JsonPropertyName("action")]
        public string Action { get; set; } = string.Empty;

        [JsonPropertyName("details")]
        public string Details { get; set; } = string.Empty;

        [JsonPropertyName("userName")]
        public string? UserName { get; set; }

        [JsonPropertyName("userRole")]
        public string? UserRole { get; set; }

        [JsonPropertyName("ipAddress")]
        public string? IpAddress { get; set; }
    }
}
