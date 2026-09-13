using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.FinanceManagement;

[Table("student_scholarships")]
public class StudentScholarship
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string StudentId { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string StudentName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? AdmissionNo { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ClassName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Section { get; set; } = string.Empty;

    public int ScholarshipId { get; set; }

    [Required]
    [MaxLength(150)]
    public string ScholarshipName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string ScholarshipCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string DiscountType { get; set; } = "Percentage";

    [Column(TypeName = "decimal(10,2)")]
    public decimal DiscountValue { get; set; } = 0m;

    [MaxLength(30)]
    public string AppliedDate { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
