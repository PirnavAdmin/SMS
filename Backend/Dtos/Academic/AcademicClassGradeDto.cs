namespace SMS.Api.Dtos.Academic;

public class AcademicClassGradeDto
{
    public long ClassGradeId { get; set; }

    public string ClassGradeName { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    public bool Status { get; set; }

    public int TotalSections { get; set; }

    public List<AcademicSectionDto> Sections { get; set; } = [];

    public List<AcademicSubjectDto> Subjects { get; set; } = [];
}