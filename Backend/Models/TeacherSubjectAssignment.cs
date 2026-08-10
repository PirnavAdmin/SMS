using SMS.Api.Models.AcademicManagement;

namespace SMS.Api.Models;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("teacher_subject_assignments")]
public class TeacherSubjectAssignment
{
    [Key]
    public int AssignmentId { get; set; }

    [Required]
    public int ClassId { get; set; }

    [Required]
    public int SectionId { get; set; }

    [Required]
    public int SubjectId { get; set; }

    [Required]
    public int StaffId { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(ClassId))]
    public virtual ClassGrade? ClassGrade { get; set; }

    [ForeignKey(nameof(SectionId))]
    public virtual ClassSection? ClassSection { get; set; }

    [ForeignKey(nameof(SubjectId))]
    public virtual Subject? Subject { get; set; }

    [ForeignKey(nameof(StaffId))]
    public virtual Staff? Staff { get; set; }
}
