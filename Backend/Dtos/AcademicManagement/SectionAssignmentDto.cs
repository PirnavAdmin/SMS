namespace SMS.Api.Dtos.AcademicManagement;

public class SectionAssignmentDto
{
	public string SectionName { get; set; } = string.Empty;
	public int? ClassTeacherEmpId { get; set; }
	public string? RoomNo { get; set; }
}