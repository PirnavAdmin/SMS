using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class SchoolSettingsDto
    {
        [JsonPropertyName("schoolName")]
        public string SchoolName { get; set; } = "Pirnav Educational Institutions";

        [JsonPropertyName("name")]
        public string NameAlias
        {
            get => SchoolName;
            set { if (!string.IsNullOrWhiteSpace(value)) SchoolName = value; }
        }

        [JsonPropertyName("tagline")]
        public string Tagline { get; set; } = "Empowering Minds, Shaping Tomorrow";

        [JsonPropertyName("motto")]
        public string MottoAlias
        {
            get => Tagline;
            set { if (!string.IsNullOrWhiteSpace(value)) Tagline = value; }
        }

        [JsonPropertyName("address")]
        public string Address { get; set; } = "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081";

        [JsonPropertyName("phone")]
        public string Phone { get; set; } = "+91 9123456789";

        [JsonPropertyName("email")]
        public string Email { get; set; } = "contact@pirnavschools.edu";

        [JsonPropertyName("website")]
        public string Website { get; set; } = "https://pirnavschools.edu";

        [JsonPropertyName("websiteUrl")]
        public string WebsiteUrlAlias
        {
            get => Website;
            set { if (!string.IsNullOrWhiteSpace(value)) Website = value; }
        }

        [JsonPropertyName("principalName")]
        public string PrincipalName { get; set; } = "Dr. Eleanor Vance";

        [JsonPropertyName("logoUrl")]
        public string LogoUrl { get; set; } = string.Empty;

        [JsonPropertyName("logoFormat")]
        public string LogoFormat { get; set; } = "PNG";

        [JsonPropertyName("campuses")]
        public object? Campuses { get; set; }

        [JsonPropertyName("certificateTemplates")]
        public object? CertificateTemplates { get; set; }
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
}
