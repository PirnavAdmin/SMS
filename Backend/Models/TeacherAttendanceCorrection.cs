namespace SMS.Api.Models;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("teacher_attendance_corrections")]
public class TeacherAttendanceCorrection
{
    [Key]
    public int CorrectionId { get; set; }

    [Required]
    public int StaffId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime AttendanceDate { get; set; }

    [MaxLength(20)]
    public string? CurrentInTime { get; set; }

    [MaxLength(20)]
    public string? CurrentOutTime { get; set; }

    [MaxLength(20)]
    public string? RequestedInTime { get; set; }

    [MaxLength(20)]
    public string? RequestedOutTime { get; set; }

    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Pending";

    [MaxLength(500)]
    public string? ApprovedRemarks { get; set; }

    public int? ApprovedBy { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey(nameof(StaffId))]
    public Staff? Staff { get; set; }
}