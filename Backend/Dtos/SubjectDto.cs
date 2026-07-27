namespace SMS.Api.Dtos;

public class SubjectDto
{
	public int SubjectId { get; set; }
	public string SubjectCode { get; set; } = string.Empty;
	public string SubjectName { get; set; } = string.Empty;
	public string CourseCode { get; set; } = string.Empty;
	public int DepartmentId { get; set; }
	public string DepartmentName { get; set; } = string.Empty;
	public string? DepartmentCode { get; set; }
}