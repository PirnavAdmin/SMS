namespace SMS.Api.Dtos;

using System.ComponentModel.DataAnnotations;

public class CreateSubjectDto
{
	public string? SubjectCode { get; set; }
	[Required(ErrorMessage = "Subject name is required.")] 
	public string SubjectName { get; set; } = string.Empty;
	public string? CourseCode { get; set; }
	public int DepartmentId { get; set; }
}