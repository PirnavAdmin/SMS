namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("staff_qualifications")]
public class StaffQualification
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StaffId { get; set; }

    [ForeignKey("StaffId")]
    public Staff? Staff { get; set; }

    [MaxLength(150)]
    public string? QualificationDegree { get; set; }

    [MaxLength(150)]
    public string? SpecializationSubject { get; set; }

    [MaxLength(200)]
    public string? InstitutionCollege { get; set; }

    [MaxLength(200)]
    public string? BoardUniversity { get; set; }

    [MaxLength(10)]
    public string? PassingYear { get; set; }

    [MaxLength(20)]
    public string? PercentageCgpa { get; set; }
}
