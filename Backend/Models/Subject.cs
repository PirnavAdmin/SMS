namespace SMS.Api.Models;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class Subject
{
    [Key]
    public int SubjectId { get; set; } // Changed to match SubjectId in bridge table

    [Required]
    public string SubjectCode { get; set; } = string.Empty;

    [Required]
    public string SubjectName { get; set; } = string.Empty;

    public string CourseCode { get; set; } = string.Empty;

    public ICollection<ClassCurriculumSubject> CurriculumSubjects { get; set; } = new List<ClassCurriculumSubject>();
}