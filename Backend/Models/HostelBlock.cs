namespace SMS.Api.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("hostel_blocks")]
public class HostelBlock
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int HostelId { get; set; }

    [MaxLength(150)]
    public string? HostelName { get; set; }

    [MaxLength(50)]
    public string? HostelCode { get; set; }

    [MaxLength(50)]
    public string? HostelType { get; set; } = "Boys Hostel";

    [MaxLength(150)]
    public string? WardenName { get; set; }

    [MaxLength(20)]
    public string? PrimaryMobileNumber { get; set; }

    [MaxLength(20)]
    public string? AlternateMobileNumber { get; set; }

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Status { get; set; } = "Active";

    [MaxLength(500)]
    public string? Address { get; set; }

    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<RoomMaster> Rooms { get; set; } = new List<RoomMaster>();
    public virtual ICollection<HostelWarden> Wardens { get; set; } = new List<HostelWarden>();
    public virtual ICollection<StudentBedAllocation> Allocations { get; set; } = new List<StudentBedAllocation>();
}
