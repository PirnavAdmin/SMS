namespace SMS.Api.Dtos.TeacherScreens;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class TeacherEducationDto
{
    public int Id { get; set; }

    public int StaffId { get; set; }

    public string HighestQualification { get; set; } = string.Empty;

    public string BoardUniversity { get; set; } = string.Empty;

    public string Year { get; set; } = string.Empty;

    public string Percentage { get; set; } = string.Empty;

    public string? BEd { get; set; }

    public string? MEd { get; set; }

    public string? PhD { get; set; }

    public string? Specialization { get; set; }
}

public class CreateTeacherEducationDto
{
    [Required(ErrorMessage = "Highest qualification is required.")]
    public string HighestQualification { get; set; } = string.Empty;

    [Required(ErrorMessage = "University or board is required.")]
    public string BoardUniversity { get; set; } = string.Empty;

    [Required(ErrorMessage = "Year is required.")]
    public string Year { get; set; } = string.Empty;

    [Required(ErrorMessage = "Percentage is required.")]
    public string Percentage { get; set; } = string.Empty;

    public string? BEd { get; set; }

    public string? MEd { get; set; }

    public string? PhD { get; set; }

    public string? Specialization { get; set; }
}

public class UpdateTeacherEducationDto
{
    public string? HighestQualification { get; set; }

    public string? BoardUniversity { get; set; }

    public string? Year { get; set; }

    public string? Percentage { get; set; }

    public string? BEd { get; set; }

    public string? MEd { get; set; }

    public string? PhD { get; set; }

    public string? Specialization { get; set; }
}

public class BulkUpdateTeacherEducationDto
{
    public List<CreateTeacherEducationDto> Qualifications { get; set; } = new List<CreateTeacherEducationDto>();
}
