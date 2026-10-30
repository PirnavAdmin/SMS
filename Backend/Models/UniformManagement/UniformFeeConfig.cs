using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("uniform_fee_configs")]
    public class UniformFeeConfig
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [MaxLength(50)]
        public string? AcademicYear { get; set; }

        [MaxLength(100)]
        public string? Branch { get; set; }

        [Required]
        [MaxLength(100)]
        public string ClassName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Gender { get; set; } = "Unisex";

        [Required]
        [MaxLength(200)]
        public string PackageOrItemName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? UniformItemId { get; set; }

        [MaxLength(50)]
        public string? FeePlan { get; set; } = "Annual";

        [Column(TypeName = "decimal(18,2)")]
        public decimal FeeAmount { get; set; } = 0m;

        [MaxLength(50)]
        public string? EffectiveFrom { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
