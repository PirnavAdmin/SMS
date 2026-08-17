namespace SMS.Api.Dtos.AcademicManagement;

using System.Text.Json.Serialization;

public class SectionResponseDto
{
	public int SectionId { get; set; }

	[JsonPropertyName("id")]
	public string Id => SectionId.ToString();

	public string SectionName { get; set; } = string.Empty;

	[JsonPropertyName("name")]
	public string Name => SectionName;

	public int? ClassTeacherEmpId { get; set; }

	[JsonPropertyName("classTeacherId")]
	public string? ClassTeacherId => ClassTeacherEmpId?.ToString();

	public string? ClassTeacherName { get; set; }

	public string? EmployeeId { get; set; }

	[JsonPropertyName("teacherLabel")]
	public string TeacherLabel => !string.IsNullOrEmpty(ClassTeacherName)
		? (!string.IsNullOrEmpty(EmployeeId) ? $"{ClassTeacherName} ({EmployeeId})" : ClassTeacherName)
		: "Unassigned";

	[JsonPropertyName("capacity")]
	public int Capacity { get; set; }

	[JsonPropertyName("status")]
	public string Status { get; set; } = "Active";

	[JsonPropertyName("remarks")]
	public string? Remarks { get; set; }

	[JsonPropertyName("roomNo")]
	public string? RoomNo { get; set; }
}