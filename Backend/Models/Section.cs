namespace SMS.Api.Models;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class Section
{
    [Key]
    public int SectionId { get; set; }

    [Required]
    public string SectionName { get; set; } = string.Empty;

    public int AcademicClassId { get; set; }

    public AcademicClass AcademicClass { get; set; } = null!;

    public int? ClassTeacherId { get; set; }

    public Staff? ClassTeacher { get; set; }
}