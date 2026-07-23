namespace SMS.Api.Dtos;

using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

public class ClassGradeResponseDto
{
	public int ClassId { get; set; }

	[JsonPropertyName("id")]
	public string Id => $"CL-{ClassId}";

	public string ClassName { get; set; } = string.Empty;

	[JsonPropertyName("name")]
	public string Name => ClassName;

	public List<SectionResponseDto> Sections { get; set; } = new();

	[JsonPropertyName("sectionNames")]
	public List<string> SectionNames => Sections.Select(s => s.SectionName).ToList();

	[JsonPropertyName("sectionTeachers")]
	public Dictionary<string, string> SectionTeachers => Sections
		.Where(s => !string.IsNullOrEmpty(s.ClassTeacherName))
		.ToDictionary(
			s => s.SectionName,
			s => !string.IsNullOrEmpty(s.EmployeeId) 
				? $"{s.ClassTeacherName} ({s.EmployeeId})" 
				: s.ClassTeacherName!
		);

	[JsonPropertyName("teacher")]
	public string Teacher => Sections.FirstOrDefault(s => !string.IsNullOrEmpty(s.ClassTeacherName))?.ClassTeacherName ?? "Unassigned";

	public List<SubjectDto> CurriculumSubjects { get; set; } = new();

	[JsonPropertyName("subjects")]
	public List<string> SubjectNames => CurriculumSubjects.Select(cs => cs.SubjectName).ToList();
}