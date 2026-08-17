namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("hostel_attendances")]
public class HostelAttendance
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long AttendanceId { get; set; }

    [Required]
    public int AllocationId { get; set; }

    [ForeignKey("AllocationId")]
    public virtual StudentBedAllocation? Allocation { get; set; }

    public DateTime? Date { get; set; }

    [MaxLength(20)]
    public string? CurfewStatus { get; set; } = "Present";

    [MaxLength(255)]
    public string? Remarks { get; set; }

    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
}
