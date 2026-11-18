using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Finbuckle.MultiTenant.EntityFrameworkCore;

namespace SMS.Api.Models
{
    [MultiTenant]
    [Table("SchoolSettings")]
    public class SchoolSettings
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [MaxLength(250)]
        public string SchoolName { get; set; } = string.Empty;

        [MaxLength(250)]
        public string Tagline { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Phone { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(150)]
        public string Website { get; set; } = string.Empty;

        [MaxLength(150)]
        public string PrincipalName { get; set; } = string.Empty;

        public string LogoUrl { get; set; } = string.Empty;

        [MaxLength(20)]
        public string LogoFormat { get; set; } = "PNG";

        public string CampusesJson { get; set; } = "[]";

        public string CertificateTemplatesJson { get; set; } = "[]";

        public string? IdSequenceSettingsJson { get; set; } = null;

        public string? UserProfileJson { get; set; } = null;

        public string? FinanceSettingsJson { get; set; } = null;

        [MaxLength(100)]
        public string? BoardType { get; set; } = null;

        public string? ThemeSettingsJson { get; set; } = null;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
