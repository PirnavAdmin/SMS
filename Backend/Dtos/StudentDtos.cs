using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos;

// Used for the student list screen
public class StudentDto
{
    public int StudentId { get; set; }

    public string AdmissionNumber { get; set; } = string.Empty;

    public string RollNumber { get; set; } = string.Empty;

    public string StudentName { get; set; } = string.Empty;

    public int BranchId { get; set; }

    public string BranchName { get; set; } = string.Empty;

    public int AcademicYearId { get; set; }

    public string AcademicYearName { get; set; } = string.Empty;

    public int ClassId { get; set; }

    public string ClassName { get; set; } = string.Empty;

    public int SectionId { get; set; }

    public string SectionName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal? AttendancePercentage { get; set; }

    public string? Performance { get; set; }

    public string? Avatar { get; set; }
}

// Used when viewing one student's complete details
public class StudentDetailsDto
{
    public int StudentId { get; set; }

    public string AdmissionNumber { get; set; } = string.Empty;

    public string RollNumber { get; set; } = string.Empty;

    public string StudentName { get; set; } = string.Empty;

    public DateTime? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public string? FatherName { get; set; }

    public string? FatherMobile { get; set; }

    public string? MotherName { get; set; }

    public string? MotherMobile { get; set; }

    public string? Email { get; set; }

    public string? MobileNumber { get; set; }

    public string? Address { get; set; }

    public int BranchId { get; set; }

    public string BranchName { get; set; } = string.Empty;

    public int AcademicYearId { get; set; }

    public string AcademicYearName { get; set; } = string.Empty;

    public int ClassId { get; set; }

    public string ClassName { get; set; } = string.Empty;

    public int SectionId { get; set; }

    public string SectionName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal? AttendancePercentage { get; set; }

    public string? Performance { get; set; }

    public string? Avatar { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

// Used when creating a student
public class CreateStudentDto
{
    [Required]
    [MaxLength(50)]
    public string AdmissionNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string RollNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string StudentName { get; set; } = string.Empty;

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    [MaxLength(150)]
    public string? FatherName { get; set; }

    [MaxLength(20)]
    public string? FatherMobile { get; set; }

    [MaxLength(150)]
    public string? MotherName { get; set; }

    [MaxLength(20)]
    public string? MotherMobile { get; set; }

    [EmailAddress]
    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? MobileNumber { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [Range(1, int.MaxValue)]
    public int BranchId { get; set; }

    [Range(1, int.MaxValue)]
    public int AcademicYearId { get; set; }

    [Range(1, int.MaxValue)]
    public int ClassId { get; set; }

    [Range(1, int.MaxValue)]
    public int SectionId { get; set; }

    public string? Avatar { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active";
}

// Used when editing a student
public class UpdateStudentDto
{
    [Required]
    [MaxLength(50)]
    public string AdmissionNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string RollNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string StudentName { get; set; } = string.Empty;

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    [MaxLength(150)]
    public string? FatherName { get; set; }

    [MaxLength(20)]
    public string? FatherMobile { get; set; }

    [MaxLength(150)]
    public string? MotherName { get; set; }

    [MaxLength(20)]
    public string? MotherMobile { get; set; }

    [EmailAddress]
    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? MobileNumber { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [Range(1, int.MaxValue)]
    public int BranchId { get; set; }

    [Range(1, int.MaxValue)]
    public int AcademicYearId { get; set; }

    [Range(1, int.MaxValue)]
    public int ClassId { get; set; }

    [Range(1, int.MaxValue)]
    public int SectionId { get; set; }

    public string? Avatar { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active";
}

// Used for search, filters, sorting and pagination
public class StudentFilterDto
{
    public string? Search { get; set; }

    public int? BranchId { get; set; }

    public int? AcademicYearId { get; set; }

    public int? ClassId { get; set; }

    public int? SectionId { get; set; }

    public string? Status { get; set; }

    public string SortBy { get; set; } = "StudentName";

    public string SortOrder { get; set; } = "asc";

    [Range(1, int.MaxValue)]
    public int PageNumber { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 10;
}

// Used for active/inactive status changes
public class UpdateStudentStatusDto
{
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = string.Empty;
}

// Generic paginated response for the student list
public class PagedStudentResponseDto
{
    public IEnumerable<StudentDto> Items { get; set; }
        = new List<StudentDto>();

    public int TotalRecords { get; set; }

    public int PageNumber { get; set; }

    public int PageSize { get; set; }

    public int TotalPages =>
        PageSize <= 0
            ? 0
            : (int)Math.Ceiling(TotalRecords / (double)PageSize);
}

// Used by branch, year, class and section dropdowns
public class StudentDropdownDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
}