using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models;

public class ClassGrade
{
    [Key]
    public int ClassId { get; set; }

    [Required]
    [MaxLength(100)]
    public string ClassName { get; set; } = string.Empty;

    public ICollection<ClassSection> Sections { get; set; }
        = new List<ClassSection>();

    public ICollection<ClassCurriculumSubject> CurriculumSubjects { get; set; }
        = new List<ClassCurriculumSubject>();

    public ICollection<AdmissionApplication> AdmissionApplications { get; set; }
        = new List<AdmissionApplication>();

    public ICollection<Student> Students { get; set; }
        = new List<Student>();
}