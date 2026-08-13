namespace SMS.Api.Models.AcademicManagement;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class Subject
{
    [Key]
    public int SubjectId { get; set; }

    public string? SubjectCode { get; set; }

    public string? SubjectName { get; set; }

    public string? CourseCode { get; set; }

    public int? AcademicClassId { get; set; }

    public int DepartmentId { get; set; } = 1;
    public Department? Department { get; set; }

    public ICollection<ClassSubjectMapping> SubjectMappings { get; set; } = new List<ClassSubjectMapping>();
}