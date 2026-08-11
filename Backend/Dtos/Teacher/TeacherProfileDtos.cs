using System;
using System.Collections.Generic;

namespace SMS.Api.Dtos.Teacher;

public class TeacherSelfProfileDto
{
    public int StaffId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? ProfilePhoto { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Mobile { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? BloodGroup { get; set; }
    public string? Address { get; set; }
    public string? PermanentAddress { get; set; }
    public string? EmergencyContact { get; set; }
    public string? Branch { get; set; }
    public string? Department { get; set; }
    public string? Designation { get; set; }
    public DateTime? JoiningDate { get; set; }
    public string? Qualification { get; set; }
    public string? Experience { get; set; }
    public List<string> AssignedClasses { get; set; } = new();
    public List<string> AssignedSections { get; set; } = new();
    public List<string> AssignedSubjects { get; set; } = new();
    public string EmploymentStatus { get; set; } = "Active";
    public string ProfileStatus { get; set; } = "Completed";
}

public class UpdateMyTeacherProfileDto
{
    public string? ProfilePhoto { get; set; }
    public string? Mobile { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContact { get; set; }
}

public class TeacherAssignmentsResponseDto
{
    public int StaffId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public List<TeacherClassAssignmentDto> Classes { get; set; } = new();
    public List<TeacherSectionAssignmentDto> Sections { get; set; } = new();
    public List<TeacherSubjectAssignmentDto> Subjects { get; set; } = new();
}

public class TeacherClassAssignmentDto
{
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // e.g. "Class Teacher", "Subject Teacher"
}

public class TeacherSectionAssignmentDto
{
    public int SectionId { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
}

public class TeacherSubjectAssignmentDto
{
    public int SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
}
