using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("student_uniform_distributions")]
    public class StudentUniformDistribution
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int DistributionId { get; set; }

        public int? StudentId { get; set; }

        [MaxLength(50)]
        public string? AdmissionNo { get; set; }

        [MaxLength(150)]
        public string? StudentName { get; set; }

        [MaxLength(100)]
        public string? ClassName { get; set; }

        [MaxLength(100)]
        public string? TransactionType { get; set; } = "Baseline Distribution (Admission Kit)";

        public int? UniformTypeId { get; set; }

        [ForeignKey("UniformTypeId")]
        public virtual UniformType? UniformType { get; set; }

        [MaxLength(150)]
        public string? ItemName { get; set; }

        [MaxLength(50)]
        public string? SizeSpec { get; set; } = "M";

        public int Quantity { get; set; } = 1;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public DateTime? DistributionDate { get; set; } = DateTime.UtcNow;

        [MaxLength(255)]
        public string? Notes { get; set; }

        [MaxLength(50)]
        public string? PaymentStatus { get; set; } = "Paid";

        [MaxLength(50)]
        public string? Status { get; set; } = "Issued";

        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
