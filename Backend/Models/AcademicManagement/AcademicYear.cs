using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.AcademicManagement;

[Table("academic_years")]
public class AcademicYear
{
    [Key]
    [Column("academic_year_id")]
    public int AcademicYearId { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("academic_year_name")]
    public string AcademicYearName { get; set; } = string.Empty;

    [Column("start_date", TypeName = "date")]
    public DateTime StartDate { get; set; }

    [Column("end_date", TypeName = "date")]
    public DateTime EndDate { get; set; }

    [Column("is_current")]
    public bool IsCurrent { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("is_deleted")]
    public bool IsDeleted { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Student> Students { get; set; }
        = new List<Student>();
}