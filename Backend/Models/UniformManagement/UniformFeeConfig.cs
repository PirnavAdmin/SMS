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

        [Required]
        [MaxLength(100)]
        public string ClassName { get; set; } = "Class 10";

        [Required]
        [MaxLength(200)]
        public string PackageOrItemName { get; set; } = "Full Kit";

        [MaxLength(50)]
        public string Gender { get; set; } = "Unisex";

        [MaxLength(50)]
        public string AcademicYear { get; set; } = "2025-2026";

        [Column(TypeName = "decimal(18,2)")]
        public decimal FeeAmount { get; set; } = 3500.00m;

        [MaxLength(50)]
        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
