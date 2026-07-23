using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Academic;

public class AddClassSubjectsDto
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one subject is required.")]
    public List<long> SubjectIds { get; set; } = [];
}