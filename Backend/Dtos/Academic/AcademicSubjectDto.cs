namespace SMS.Api.Dtos.Academic;

public class AcademicSubjectDto
{
    public long SubjectId { get; set; }

    public string SubjectCode { get; set; } = string.Empty;

    public string SubjectName { get; set; } = string.Empty;
}