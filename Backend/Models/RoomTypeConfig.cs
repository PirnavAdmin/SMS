namespace SMS.Api.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("room_type_configs")]
public class RoomTypeConfig
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int RoomTypeId { get; set; }

    [Required]
    [MaxLength(150)]
    public string RoomTypeSpecification { get; set; } = string.Empty;

    [Required]
    public int BedCapacity { get; set; } = 1;

    [Required]
    [MaxLength(20)]
    public string AcType { get; set; } = "AC";

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<RoomMaster> Rooms { get; set; } = new List<RoomMaster>();
}
