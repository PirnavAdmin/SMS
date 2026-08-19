namespace SMS.Api.Models;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class AcademicClass
{
	[Key]
	public int Id { get; set; }

	[Required]
	public string ClassName { get; set; } = string.Empty; // e.g. "Class 9", "Class 10"

	// One-to-Many: Sections under this class grade
	public ICollection<Section> Sections { get; set; } = new List<Section>();

	// Many-to-Many: Curriculum subjects attached to this class grade
	public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
}