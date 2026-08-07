using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models;

public class ClassSection
{
    [Key]
    public int SectionId { get; set; }

    [Required]
    [MaxLength(100)]
    public string SectionName { get; set; } = string.Empty;

    public int ClassId { get; set; }

    [ForeignKey(nameof(ClassId))]
    public ClassGrade ClassGrade { get; set; } = null!;

    public int Capacity { get; set; } = 40;

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    public string? Remarks { get; set; }

    public int? ClassTeacherEmpId { get; set; }

    [ForeignKey(nameof(ClassTeacherEmpId))]
    public Staff? ClassTeacher { get; set; }

    public ICollection<Student> Students { get; set; }
        = new List<Student>();
}