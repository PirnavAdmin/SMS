namespace SMS.Api.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("student_bed_allocations")]
public class StudentBedAllocation
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AllocationId { get; set; }

    [MaxLength(100)]
    public string? RegistrationNo { get; set; }

    [MaxLength(150)]
    public string? StudentName { get; set; }

    public int? StudentId { get; set; }

    [ForeignKey("StudentId")]
    public virtual AdmissionApplication? Student { get; set; }

    [Required]
    public int HostelId { get; set; }

    [ForeignKey("HostelId")]
    public virtual HostelBlock? Hostel { get; set; }

    [Required]
    public int RoomId { get; set; }

    [ForeignKey("RoomId")]
    public virtual RoomMaster? Room { get; set; }

    [MaxLength(50)]
    public string? BedNumber { get; set; }

    public DateTime? JoiningDate { get; set; } = DateTime.UtcNow;

    [MaxLength(20)]
    public string? Status { get; set; } = "Active";

    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<HostelAttendance> AttendanceRecords { get; set; } = new List<HostelAttendance>();
}
