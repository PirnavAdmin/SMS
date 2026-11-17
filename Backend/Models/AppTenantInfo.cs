using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Finbuckle.MultiTenant.Abstractions;

namespace SMS.Api.Models
{
    [Table("app_tenants")]
    public class AppTenantInfo : ITenantInfo
    {
        [Key]
        [MaxLength(64)]
        public string Id { get; set; } = Guid.NewGuid().ToString("N");

        [Required]
        [MaxLength(64)]
        public string Identifier { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Name { get; set; }

        public string? ConnectionString { get; set; }

        [Required]
        [MaxLength(200)]
        public string CompanyName { get; set; } = string.Empty;

        [MaxLength(30)]
        public string PrimaryColor { get; set; } = "#0284c7";

        [MaxLength(500)]
        public string LogoUrl { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
