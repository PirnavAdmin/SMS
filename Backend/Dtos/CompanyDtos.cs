using System;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos
{
    public class CompanyResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Identifier { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string PrimaryColor { get; set; } = "#0284c7";
        public string LogoUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int UsersCount { get; set; }
    }

    public class CreateCompanyDto
    {
        [Required]
        [MaxLength(64)]
        [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "Identifier must only contain lowercase alphanumeric characters and hyphens (e.g. 'acme-corp').")]
        public string Identifier { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string CompanyName { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? PrimaryColor { get; set; } = "#0284c7";

        [MaxLength(500)]
        public string? LogoUrl { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        // Optional initial Company Admin setup
        [EmailAddress]
        public string? AdminEmail { get; set; }

        public string? AdminPassword { get; set; }

        public string? AdminFullName { get; set; }

        public string? AdminMobile { get; set; }
    }

    public class UpdateCompanyDto
    {
        [Required]
        [MaxLength(200)]
        public string CompanyName { get; set; } = string.Empty;

        [MaxLength(64)]
        public string? Identifier { get; set; }

        [MaxLength(30)]
        public string? PrimaryColor { get; set; }

        [MaxLength(500)]
        public string? LogoUrl { get; set; }

        public bool? IsActive { get; set; }
    }

    public class ToggleCompanyStatusDto
    {
        public bool IsActive { get; set; }
    }
}
