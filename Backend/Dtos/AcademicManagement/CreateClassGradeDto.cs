using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos.AcademicManagement
{
	public class CreateClassGradeDto
	{
		[JsonPropertyName("name")]
		[Required]
		public string? Name { get; set; }

		[JsonPropertyName("class_name")]
		[Required]
		public string? ClassName { get; set; }

		[JsonPropertyName("campus_location")]
		public string? CampusLocation { get; set; }

		[JsonPropertyName("academic_year")]
		public string? AcademicYear { get; set; }

		[JsonPropertyName("display_order")]
		public int? DisplayOrder { get; set; }

		[JsonPropertyName("status")]
		public string? Status { get; set; }

		[JsonPropertyName("remarks")]
		public string? Remarks { get; set; }

		[JsonPropertyName("sectionsRaw")]
		public List<SectionAssignmentDto> Sections { get; set; } = new();

		[JsonPropertyName("subjectIds")]
		public List<int> SubjectIds { get; set; } = new();

		[JsonPropertyName("sections")]
		public List<string>? SectionNames { get; set; }

		[JsonPropertyName("sectionTeachers")]
		public Dictionary<string, string>? SectionTeachers { get; set; }

		[JsonPropertyName("subjects")]
		public List<string>? Subjects { get; set; }
	}
}