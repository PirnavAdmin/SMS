using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models;

[Table("academic_class_grades")]
public class AcademicClassGrade
{
    [Key]
    [Column("class_grade_id")]
    public long ClassGradeId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("class_grade_name")]
    public string ClassGradeName { get; set; } = string.Empty;

    [Column("display_order")]
    public int DisplayOrder { get; set; }

    [Column("status")]
    public bool Status { get; set; } = true;

    [Column("is_deleted")]
    public bool IsDeleted { get; set; }

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    [Column("updated_by")]
    public long? UpdatedBy { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    public ICollection<AcademicSection> Sections { get; set; }
        = new List<AcademicSection>();

    public ICollection<AcademicClassSubject> ClassSubjects { get; set; }
        = new List<AcademicClassSubject>();
}