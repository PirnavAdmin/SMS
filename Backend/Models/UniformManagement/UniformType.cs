using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("uniform_types")]
    public class UniformType
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int UniformTypeId { get; set; }

        [Required]
        [MaxLength(150)]
        public string ItemName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Gender { get; set; }

        [MaxLength(100)]
        public string? SchoolWing { get; set; }

        [MaxLength(50)]
        public string? Size { get; set; }

        [MaxLength(100)]
        public string? CategoryName { get; set; }

        [MaxLength(100)]
        public string? Color { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        public int OpeningStock { get; set; } = 200;

        public int AvailableStock { get; set; } = 120;

        public int MinThreshold { get; set; } = 30;

        public int ReorderPoint { get; set; } = 50;

        [MaxLength(50)]
        public string? Status { get; set; } = "Active";

        public string? IncludedItemsJson { get; set; }

        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
