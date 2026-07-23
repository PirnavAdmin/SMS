using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Academic;

public class UpdateAcademicClassGradeDto
{
    [Required(ErrorMessage = "Class grade name is required.")]
    [MaxLength(100)]
    public string ClassGradeName { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    public bool Status { get; set; } = true;

    [Required]
    [MinLength(1, ErrorMessage = "At least one section is required.")]
    public List<UpdateAcademicSectionItemDto> Sections { get; set; } = [];

    [Required]
    [MinLength(1, ErrorMessage = "At least one subject is required.")]
    public List<long> SubjectIds { get; set; } = [];
}

public class UpdateAcademicSectionItemDto
{
    public long? SectionId { get; set; }

    [Required]
    [MaxLength(50)]
    public string SectionName { get; set; } = string.Empty;

    [Range(1, long.MaxValue)]
    public long ClassTeacherId { get; set; }

    public int DisplayOrder { get; set; }

    public bool Status { get; set; } = true;
}