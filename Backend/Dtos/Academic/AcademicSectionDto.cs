namespace SMS.Api.Dtos.Academic;

public class AcademicSectionDto
{
    public long SectionId { get; set; }

    public string SectionName { get; set; } = string.Empty;

    public long ClassTeacherId { get; set; }

    public string TeacherName { get; set; } = string.Empty;

    public string EmployeeCode { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    public bool Status { get; set; }
}