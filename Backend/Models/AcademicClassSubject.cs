using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models;

[Table("academic_class_subjects")]
public class AcademicClassSubject
{
    [Key]
    [Column("class_subject_id")]
    public long ClassSubjectId { get; set; }

    [Column("class_grade_id")]
    public long ClassGradeId { get; set; }

    [Column("subject_id")]
    public long SubjectId { get; set; }

    [Column("is_deleted")]
    public bool IsDeleted { get; set; }

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public AcademicClassGrade ClassGrade { get; set; } = null!;
}