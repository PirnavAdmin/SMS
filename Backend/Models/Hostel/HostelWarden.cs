namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("hostel_wardens")]
public class HostelWarden
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int WardenId { get; set; }

    [Required]
    public int HostelId { get; set; }

    [ForeignKey("HostelId")]
    public virtual HostelBlock? Hostel { get; set; }

    public int? StaffId { get; set; }

    [ForeignKey("StaffId")]
    public virtual Staff? Staff { get; set; }

    [MaxLength(150)]
    public string? WardenName { get; set; }

    [MaxLength(20)]
    public string? MobileNumber { get; set; }

    [MaxLength(20)]
    public string? AlternateMobile { get; set; }

    [MaxLength(150)]
    public string? EmailAddress { get; set; }

    [NotMapped]
    public string? BlockName { get; set; }

    [NotMapped]
    public string? FloorLevel { get; set; }

    [NotMapped]
    public DateTime? EffectiveDate { get; set; }

    [MaxLength(50)]
    public string Designation { get; set; } = "Warden";

    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
}
