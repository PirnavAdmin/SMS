namespace SMS.Api.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("room_masters")]
public class RoomMaster
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int RoomId { get; set; }

    [Required]
    public int HostelId { get; set; }

    [ForeignKey("HostelId")]
    public virtual HostelBlock? Hostel { get; set; }

    [Required]
    public int RoomTypeId { get; set; }

    [ForeignKey("RoomTypeId")]
    public virtual RoomTypeConfig? RoomType { get; set; }

    [MaxLength(50)]
    public string? FloorLevel { get; set; } = "1st Floor";

    [MaxLength(50)]
    public string? RoomNumber { get; set; }

    [MaxLength(20)]
    public string? Status { get; set; } = "Active";

    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<StudentBedAllocation> Allocations { get; set; } = new List<StudentBedAllocation>();
}
