namespace SMS.Api.Dtos;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

public class CreateClassGradeDto
{
	[Required] public string ClassName { get; set; } = string.Empty;
	public List<SectionAssignmentDto> Sections { get; set; } = new();
	public List<int> SubjectIds { get; set; } = new();

	// Frontend-specific mappings
	[JsonPropertyName("name")]
	public string? Name { get; set; }

	[JsonPropertyName("sections")]
	public List<string>? SectionNames { get; set; }

	[JsonPropertyName("sectionTeachers")]
	public Dictionary<string, string>? SectionTeachers { get; set; }

	[JsonPropertyName("subjects")]
	public List<string>? Subjects { get; set; }
}