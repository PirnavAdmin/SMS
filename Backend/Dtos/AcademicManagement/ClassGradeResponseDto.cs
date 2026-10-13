namespace SMS.Api.Dtos.AcademicManagement;

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

	[JsonPropertyName("campusLocation")]
	public string CampusLocation { get; set; } = string.Empty;

	[JsonPropertyName("academicYear")]
	public string AcademicYear { get; set; } = string.Empty;

	[JsonPropertyName("displayOrder")]
	public int? DisplayOrder { get; set; }

	[JsonPropertyName("status")]
	public string Status { get; set; } = "Active";

	[JsonPropertyName("remarks")]
	public string? Remarks { get; set; }

	[JsonIgnore]
	public List<SectionResponseDto> Sections { get; set; } = new();

	[JsonPropertyName("sections")]
	public List<string> SectionNames => Sections.Select(s => s.SectionName).ToList();

	[JsonPropertyName("sectionDetails")]
	public Dictionary<string, object> SectionDetails => Sections
		.Where(s => !string.IsNullOrEmpty(s.SectionName))
		.GroupBy(s => s.SectionName)
		.ToDictionary(
			g => g.Key,
			g => (object)new
			{
				capacity = g.First().Capacity,
				status = g.First().Status ?? "Active",
				remarks = g.First().Remarks ?? "",
				roomNo = g.First().RoomNo ?? ""
			}
		);

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