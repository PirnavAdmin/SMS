using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Academic;

public class UpdateAcademicSectionDto
{
    [Required(ErrorMessage = "Section name is required.")]
    [MaxLength(50)]
    public string SectionName { get; set; } = string.Empty;

    [Range(1, long.MaxValue, ErrorMessage = "Class teacher is required.")]
    public long ClassTeacherId { get; set; }

    public int DisplayOrder { get; set; }

    public bool Status { get; set; } = true;
}