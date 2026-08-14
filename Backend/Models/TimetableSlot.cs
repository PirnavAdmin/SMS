namespace SMS.Api.Models;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("timetable_slots")]
public class TimetableSlot
{
    [Key]
    public int SlotId { get; set; }

    [Required]
    public int HeaderId { get; set; }

    public int? PeriodId { get; set; }

    [Required]
    [MaxLength(20)]
    public string DayOfWeek { get; set; } = "Monday"; // Monday..Saturday

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }

    [Required]
    public int SubjectId { get; set; }

    [Required]
    public int TeacherId { get; set; } // Foreign key to Staff.StaffId

    [MaxLength(50)]
    public string? RoomNo { get; set; } // e.g. "Room 101"

    // Navigation Properties
    [ForeignKey(nameof(HeaderId))]
    public virtual TimetableHeader? Header { get; set; }

    [ForeignKey(nameof(PeriodId))]
    public virtual PeriodSetting? Period { get; set; }

    [ForeignKey(nameof(SubjectId))]
    public virtual Subject? Subject { get; set; }

    [ForeignKey(nameof(TeacherId))]
    public virtual Staff? Teacher { get; set; }
}
