namespace SMS.Api.Models;

using System.ComponentModel.DataAnnotations;

public class Section
{
	[Key]
	public int SectionId { get; set; }

	[Required]
	public string SectionName { get; set; } = string.Empty; // "Section A", "Section B"

	public int AcademicClassId { get; set; }
	public AcademicClass AcademicClass { get; set; } = null!;

	// Assigned Class Teacher Foreign Key
	public int? ClassTeacherId { get; set; }
	public Staff? ClassTeacher { get; set; }
}