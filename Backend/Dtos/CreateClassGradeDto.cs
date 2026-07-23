namespace SMS.Api.Dtos;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class CreateClassGradeDto
{
	[Required] public string ClassName { get; set; } = string.Empty;
	public List<SectionAssignmentDto> Sections { get; set; } = new();
	public List<int> SubjectIds { get; set; } = new();
}