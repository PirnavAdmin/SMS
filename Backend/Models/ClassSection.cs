namespace SMS.Api.Models;

using System.ComponentModel.DataAnnotations;

public class ClassSection
{
    [Key]
    public int SectionId { get; set; }

    [Required]
    public string SectionName { get; set; } = string.Empty;

    public int ClassId { get; set; }
    public ClassGrade ClassGrade { get; set; } = null!;

    // Note: Based on your AppDbContext, this is the Foreign Key property name you used
    public int? ClassTeacherEmpId { get; set; }
    public Staff? ClassTeacher { get; set; }
}