namespace SMS.Api.Models.AcademicManagement;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("timetable_headers")]
public class TimetableHeader
{
    [Key]
    public int HeaderId { get; set; }

    [Required]
    [MaxLength(50)]
    public string AcademicYear { get; set; } = "2026-2027";

    [Required]
    [MaxLength(100)]
    public string BranchName { get; set; } = "Main Campus";

    [Required]
    public int ClassId { get; set; }

    [Required]
    public int SectionId { get; set; }

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Draft"; // "Draft", "Published"

    public bool IncludeSaturday { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(ClassId))]
    public virtual ClassGrade? ClassGrade { get; set; }

    [ForeignKey(nameof(SectionId))]
    public virtual ClassSection? ClassSection { get; set; }

    public virtual ICollection<TimetableSlot> Slots { get; set; } = new List<TimetableSlot>();
}
