namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("staff_experiences")]
public class StaffExperience
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StaffId { get; set; }

    [ForeignKey("StaffId")]
    public Staff? Staff { get; set; }

    [MaxLength(200)]
    public string? PreviousOrganization { get; set; }

    [MaxLength(150)]
    public string? DesignationHeld { get; set; }

    public DateTime? FromDate { get; set; }

    public DateTime? ToDate { get; set; }

    [MaxLength(50)]
    public string? TotalExperience { get; set; }

    [MaxLength(300)]
    public string? ReasonForLeaving { get; set; }
}
