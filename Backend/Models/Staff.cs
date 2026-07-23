namespace SMS.Api.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Staff
{
    [Key]
    public int StaffId { get; set; }

    [Required]
    public string EmployeeId { get; set; } = string.Empty; // e.g. "EMP911"

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Phone]
    public string? Phone { get; set; }

    [Required]
    public string Designation { get; set; } = string.Empty; // e.g. "Senior biology teacher"

    [Required]
    public string Department { get; set; } = string.Empty; // e.g. "biology"

    public decimal MonthlySalary { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation Property: Sections where this staff member is Class Teacher
    public ICollection<Section> SectionsTaught { get; set; } = new List<Section>();

    // Helper property to match search dropdown: "rajesh ayer (EMP911)"
    [NotMapped]
    public string DisplayName => $"{FirstName} {LastName} ({EmployeeId})";
}