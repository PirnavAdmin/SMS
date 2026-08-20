namespace SMS.Api.Dtos.TeacherScreens;

using System;
using System.ComponentModel.DataAnnotations;

public class TeacherPersonalInfoDto
{
    public int StaffId { get; set; }

    public string? ProfilePhoto { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string? MiddleName { get; set; }

    public string LastName { get; set; } = string.Empty;

    public string Gender { get; set; } = string.Empty;

    public DateTime? DateOfBirth { get; set; }

    public string? BloodGroup { get; set; }

    public string? AlternateMobile { get; set; }

    public string? Nationality { get; set; }

    public string? Religion { get; set; }

    public string? MaritalStatus { get; set; }

    public string? FatherName { get; set; }

    public string? MotherName { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? EmployeeId { get; set; }
}

public class CreateTeacherPersonalInfoDto
{
    public string? ProfilePhoto { get; set; }

    [Required(ErrorMessage = "First name is required.")]
    public string FirstName { get; set; } = string.Empty;

    public string? MiddleName { get; set; }

    [Required(ErrorMessage = "Last name is required.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Gender is required.")]
    public string Gender { get; set; } = string.Empty;

    [Required(ErrorMessage = "Date of birth is required.")]
    public DateTime DateOfBirth { get; set; }

    public string? BloodGroup { get; set; }

    public string? AlternateMobile { get; set; }

    public string? Nationality { get; set; }

    public string? Religion { get; set; }

    public string? MaritalStatus { get; set; }

    public string? FatherName { get; set; }

    public string? MotherName { get; set; }
}

public class UpdateTeacherPersonalInfoDto
{
    public string? ProfilePhoto { get; set; }

    public string? FirstName { get; set; }

    public string? MiddleName { get; set; }

    public string? LastName { get; set; }

    public string? Gender { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public string? BloodGroup { get; set; }

    public string? AlternateMobile { get; set; }

    public string? Nationality { get; set; }

    public string? Religion { get; set; }

    public string? MaritalStatus { get; set; }

    public string? FatherName { get; set; }

    public string? MotherName { get; set; }
}
