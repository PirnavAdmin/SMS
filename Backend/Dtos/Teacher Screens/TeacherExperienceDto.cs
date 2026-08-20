namespace SMS.Api.Dtos.TeacherScreens;

using System;
using System.Collections.Generic;

public class TeacherExperienceDto
{
    public int Id { get; set; }

    public int StaffId { get; set; }

    public string? TotalExperience { get; set; }

    public string? PreviousSchool { get; set; }

    public string? Organization { get; set; }

    public string? Designation { get; set; }

    public DateTime? JoiningDate { get; set; }

    public DateTime? RelievingDate { get; set; }

    public string? CertificateFileName { get; set; }

    public string? CertificateFileUrl { get; set; }

    public DateTime? CertificateUploadedAt { get; set; }
}

public class CreateTeacherExperienceDto
{
    public string? TotalExperience { get; set; }

    public string? PreviousSchool { get; set; }

    public string? Organization { get; set; }

    public string? Designation { get; set; }

    public DateTime? JoiningDate { get; set; }

    public DateTime? RelievingDate { get; set; }

    public string? CertificateFileName { get; set; }

    public string? CertificateFileUrl { get; set; }
}

public class UpdateTeacherExperienceDto
{
    public string? TotalExperience { get; set; }

    public string? PreviousSchool { get; set; }

    public string? Organization { get; set; }

    public string? Designation { get; set; }

    public DateTime? JoiningDate { get; set; }

    public DateTime? RelievingDate { get; set; }

    public string? CertificateFileName { get; set; }

    public string? CertificateFileUrl { get; set; }
}

public class BulkUpdateTeacherExperienceDto
{
    public List<CreateTeacherExperienceDto> Experiences { get; set; } = new List<CreateTeacherExperienceDto>();
}
