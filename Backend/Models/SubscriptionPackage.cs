using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("subscription_packages")]
    public class SubscriptionPackage
    {
        [Key]
        [MaxLength(100)]
        public string Id { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Tagline { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal YearlyPrice { get; set; }

        [MaxLength(20)]
        public string Currency { get; set; } = "INR";

        public int MaxStudents { get; set; }

        public int MaxStaff { get; set; }

        public int MaxBranches { get; set; }

        public int StorageGb { get; set; }

        public bool IsPopular { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Active";

        public string FeaturesJson { get; set; } = "[]";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
