using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models;

public class ClassGrade
{
    [Key]
    public int ClassId { get; set; }

    [Required]
    [MaxLength(100)]
    public string ClassName { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string CampusLocation { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string AcademicYear { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<ClassSection> Sections { get; set; }
        = new List<ClassSection>();

    public ICollection<ClassSubjectMapping> SubjectMappings { get; set; }
        = new List<ClassSubjectMapping>();

    //public ICollection<ClassCurriculumSubject> CurriculumSubjects { get; set; }
       // = new List<ClassCurriculumSubject>();

    public ICollection<TeacherAssignment> TeacherAssignments { get; set; }
        = new List<TeacherAssignment>();

    public ICollection<AdmissionApplication> AdmissionApplications { get; set; }
        = new List<AdmissionApplication>();

    public ICollection<Student> Students { get; set; }
        = new List<Student>();
}