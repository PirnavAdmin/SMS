using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("uniform_sizes")]
    public class UniformSize
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SizeId { get; set; }

        [Required]
        [MaxLength(50)]
        public string SizeName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? ChestSpec { get; set; }

        [MaxLength(50)]
        public string? WaistSpec { get; set; }

        [MaxLength(50)]
        public string? HeightTarget { get; set; }

        [MaxLength(50)]
        public string? AgeBracket { get; set; }

        [MaxLength(50)]
        public string? Gender { get; set; } = "Unisex";

        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
