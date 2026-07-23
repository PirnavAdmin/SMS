namespace SMS.Api.Dtos;

using System.ComponentModel.DataAnnotations;

public class CreateSubjectDto
{
	[Required] public string SubjectCode { get; set; } = string.Empty;
	[Required] public string SubjectName { get; set; } = string.Empty;
	public string? CourseCode { get; set; }
}