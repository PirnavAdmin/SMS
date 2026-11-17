using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("platform_company_profile")]
    public class PlatformCompanyProfile
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; } = 1;

        [MaxLength(200)]
        public string CompanyName { get; set; } = string.Empty;

        [MaxLength(300)]
        public string Tagline { get; set; } = string.Empty;

        public string LogoUrl { get; set; } = string.Empty;

        [MaxLength(150)]
        public string SupportEmail { get; set; } = string.Empty;

        [MaxLength(50)]
        public string SupportPhone { get; set; } = string.Empty;

        [MaxLength(250)]
        public string WebsiteUrl { get; set; } = string.Empty;

        [MaxLength(30)]
        public string PrimaryColor { get; set; } = "#0284c7";

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
