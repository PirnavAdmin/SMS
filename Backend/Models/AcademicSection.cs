using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models;

[Table("academic_sections")]
public class AcademicSection
{
    [Key]
    [Column("section_id")]
    public long SectionId { get; set; }

    [Column("class_grade_id")]
    public long ClassGradeId { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("section_name")]
    public string SectionName { get; set; } = string.Empty;

    [Column("class_teacher_id")]
    public long ClassTeacherId { get; set; }

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

    public AcademicClassGrade ClassGrade { get; set; } = null!;
}