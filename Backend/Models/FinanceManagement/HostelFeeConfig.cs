using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.FinanceManagement;

[Table("hostel_fee_configs")]
public class HostelFeeConfig
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string HostelId { get; set; } = string.Empty;

    [MaxLength(150)]
    public string HostelName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string RoomTypeId { get; set; } = string.Empty;

    [MaxLength(150)]
    public string RoomTypeName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? RoomId { get; set; }

    [MaxLength(50)]
    public string RoomNo { get; set; } = "All Rooms";

    [MaxLength(30)]
    public string AcType { get; set; } = "All"; // "AC", "Non-AC", "All"

    [MaxLength(50)]
    public string SharingType { get; set; } = "All"; // "Single", "Double", "Triple", "4-Sharing", "All"

    [MaxLength(50)]
    public string? StartClass { get; set; }

    [MaxLength(50)]
    public string? EndClass { get; set; }

    [MaxLength(100)]
    public string? ClassRange { get; set; }

    [Column(TypeName = "text")]
    public string? ApplicableClasses { get; set; }

    [MaxLength(50)]
    public string AcademicYear { get; set; } = "2025-2026";

    [MaxLength(100)]
    public string? Branch { get; set; } = string.Empty;

    [MaxLength(50)]
    public string FeePlan { get; set; } = "Annual"; // "Monthly", "Quarterly", "Half Yearly", "Annual", "Term-wise"

    [Column(TypeName = "decimal(18,2)")]
    public decimal HostelFee { get; set; } = 40000m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal SecurityDeposit { get; set; } = 5000m;

    [Column(TypeName = "text")]
    public string? ApplicableTermsJson { get; set; }

    [MaxLength(30)]
    public string EffectiveFrom { get; set; } = "2026-09-02";

    [MaxLength(30)]
    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
