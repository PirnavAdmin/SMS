using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("student_promotion_histories")]
    public class StudentPromotionHistory
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("student_id")]
        public int StudentId { get; set; }

        [MaxLength(50)]
        [Column("admission_no")]
        public string AdmissionNo { get; set; } = string.Empty;

        [MaxLength(150)]
        [Column("student_name")]
        public string StudentName { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("from_academic_year")]
        public string FromAcademicYear { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("to_academic_year")]
        public string ToAcademicYear { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("from_class")]
        public string FromClass { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("to_class")]
        public string ToClass { get; set; } = string.Empty;

        [MaxLength(20)]
        [Column("from_section")]
        public string FromSection { get; set; } = string.Empty;

        [MaxLength(20)]
        [Column("to_section")]
        public string ToSection { get; set; } = string.Empty;

        [Column("overall_pct", TypeName = "decimal(5,2)")]
        public decimal OverallPct { get; set; }

        [MaxLength(10)]
        [Column("grade")]
        public string Grade { get; set; } = "A";

        [MaxLength(20)]
        [Column("final_result")]
        public string FinalResult { get; set; } = "PASS";

        [MaxLength(30)]
        [Column("status")]
        public string Status { get; set; } = "Promoted";

        [MaxLength(255)]
        [Column("remarks")]
        public string? Remarks { get; set; }

        [Column("promotion_date")]
        public DateTime PromotionDate { get; set; } = DateTime.UtcNow;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
