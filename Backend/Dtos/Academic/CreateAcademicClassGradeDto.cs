using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Academic;

public class CreateAcademicClassGradeDto
{
    [Required(ErrorMessage = "Class grade name is required.")]
    [MaxLength(100)]
    public string ClassGradeName { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    [Required(ErrorMessage = "At least one section is required.")]
    [MinLength(1, ErrorMessage = "At least one section is required.")]
    public List<CreateAcademicSectionDto> Sections { get; set; } = [];

    [Required(ErrorMessage = "At least one subject is required.")]
    [MinLength(1, ErrorMessage = "At least one subject is required.")]
    public List<long> SubjectIds { get; set; } = [];
}