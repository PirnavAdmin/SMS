using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("automated_id_formats")]
    public class AutomatedIdFormat
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("FormatKey")]
        public string FormatKey { get; set; } = string.Empty; // "student", "teaching", "non-teaching", "admission", or "custom_..."

        [Required]
        [MaxLength(150)]
        [Column("Name")]
        public string Name { get; set; } = string.Empty; // "Student ID", "Teaching Staff ID", etc., or custom name like "Student"

        [MaxLength(50)]
        [Column("Prefix")]
        public string Prefix { get; set; } = string.Empty;

        [Column("StartNo")]
        public int StartNo { get; set; } = 1;

        [Column("Padding")]
        public int Padding { get; set; } = 4;

        [Column("IncludeYear")]
        public bool IncludeYear { get; set; } = true;

        [MaxLength(10)]
        [Column("Separator")]
        public string Separator { get; set; } = "-";

        [MaxLength(20)]
        [Column("Position")]
        public string Position { get; set; } = "start"; // "start", "middle", "end"

        [Column("IsCustom")]
        public bool IsCustom { get; set; } = false; // false for 4 fixed formats, true for custom formats

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
